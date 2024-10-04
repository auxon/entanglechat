console.log('Background script loaded');

// Simple in-memory storage for demonstration
let commits = [];
let branches = ['main'];
let currentBranch = 'main';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);

  if (request.type === 'CREATE_COMMIT') {
    const commit = {
      oid: generateOid(),
      message: request.message,
      data: request.data,
      timestamp: Date.now(),
      branch: currentBranch
    };
    commits.push(commit);
    console.log('Commit created:', commit);
    sendResponse({ success: true, message: 'Commit created successfully' });
  } else if (request.type === 'GET_COMMIT_HISTORY') {
    const { page, perPage } = request;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageCommits = commits.slice(start, end);
    sendResponse({ 
      success: true, 
      commits: pageCommits, 
      totalCommits: commits.length 
    });
  } else if (request.type === 'GET_COMMIT_CONTENT') {
    const commit = commits.find(c => c.oid === request.oid);
    if (commit) {
      sendResponse({ success: true, content: commit.data });
    } else {
      sendResponse({ success: false, message: 'Commit not found' });
    }
  } else if (request.type === 'LIST_BRANCHES') {
    sendResponse({ success: true, branches, currentBranch });
  } else if (request.type === 'SWITCH_BRANCH') {
    if (branches.includes(request.branchName)) {
      currentBranch = request.branchName;
      sendResponse({ success: true, message: `Switched to branch "${request.branchName}"` });
    } else {
      sendResponse({ success: false, message: `Branch "${request.branchName}" does not exist` });
    }
  } else if (request.type === 'CREATE_BRANCH') {
    if (!branches.includes(request.branchName)) {
      branches.push(request.branchName);
      sendResponse({ success: true, message: `Branch "${request.branchName}" created successfully` });
    } else {
      sendResponse({ success: false, message: `Branch "${request.branchName}" already exists` });
    }
  }

  return true; // Indicates that the response is sent asynchronously
});

function generateOid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

console.log('Background script setup complete');