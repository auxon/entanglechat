const COMMITS_PER_PAGE = 10;
let currentPage = 1;
let totalCommits = 0;
let selectedCommit = null;

async function loadCommitHistory(page = 1) {
    const commitList = document.getElementById('commitList');
    const commitContent = document.getElementById('commitContent');
    commitList.innerHTML = '';
    commitContent.textContent = '';

    try {
        const response = await chrome.runtime.sendMessage({ 
            type: 'GET_COMMIT_HISTORY', 
            page, 
            perPage: COMMITS_PER_PAGE 
        });
        if (response.success) {
            totalCommits = response.totalCommits;
            response.commits.forEach(commit => {
                const li = document.createElement('li');
                li.className = 'commit';
                li.textContent = `${commit.oid.slice(0, 7)} - ${commit.message} (${new Date(commit.timestamp).toLocaleString()})`;
                li.addEventListener('click', () => {
                    loadCommitContent(commit.oid);
                    selectedCommit = commit;
                    updateCommitActions(true);
                });
                commitList.appendChild(li);
            });
            updatePaginationControls();
        } else {
            commitList.textContent = 'Failed to load commit history';
        }
    } catch (error) {
        console.error('Error loading commit history:', error);
        commitList.textContent = 'An error occurred while loading commit history';
    }
}

function updateCommitActions(enabled) {
    document.getElementById('revertBtn').disabled = !enabled;
    document.getElementById('newBranchBtn').disabled = !enabled;
}

async function loadCommitContent(oid) {
    const commitContent = document.getElementById('commitContent');
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_COMMIT_CONTENT', oid });
        if (response.success) {
            const [role, content] = response.content.split(':\n');
            commitContent.innerHTML = `
                <div class="commit-role"><strong>${role}:</strong></div>
                <div class="commit-content markdown prose w-full break-words dark:prose-invert light">${content}</div>
            `;
        } else {
            commitContent.textContent = 'Failed to load commit content';
        }
    } catch (error) {
        console.error('Error loading commit content:', error);
        commitContent.textContent = 'An error occurred while loading commit content';
    }
}

function updatePaginationControls() {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage * COMMITS_PER_PAGE >= totalCommits;
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalCommits / COMMITS_PER_PAGE)}`;
}

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadCommitHistory(currentPage);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage * COMMITS_PER_PAGE < totalCommits) {
        currentPage++;
        loadCommitHistory(currentPage);
    }
});

document.getElementById('revertBtn').addEventListener('click', async () => {
    if (selectedCommit) {
        const confirmRevert = confirm(`Are you sure you want to revert to commit ${selectedCommit.oid.slice(0, 7)}?`);
        if (confirmRevert) {
            try {
                const response = await chrome.runtime.sendMessage({ 
                    type: 'REVERT_TO_COMMIT', 
                    commitOid: selectedCommit.oid 
                });
                if (response.success) {
                    alert('Successfully reverted to the selected commit.');
                    loadCommitHistory(currentPage);
                } else {
                    alert(`Failed to revert: ${response.message}`);
                }
            } catch (error) {
                console.error('Error reverting to commit:', error);
                alert('An error occurred while reverting to the commit.');
            }
        }
    }
});

document.getElementById('newBranchBtn').addEventListener('click', async () => {
    if (selectedCommit) {
        const branchName = prompt('Enter a name for the new branch:');
        if (branchName) {
            try {
                const response = await chrome.runtime.sendMessage({ 
                    type: 'CREATE_BRANCH_FROM_COMMIT', 
                    commitOid: selectedCommit.oid,
                    branchName: branchName
                });
                if (response.success) {
                    alert(`Successfully created new branch "${branchName}" from the selected commit.`);
                } else {
                    alert(`Failed to create branch: ${response.message}`);
                }
            } catch (error) {
                console.error('Error creating branch from commit:', error);
                alert('An error occurred while creating the branch.');
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', () => loadCommitHistory(currentPage));