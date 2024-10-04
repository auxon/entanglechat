console.log('%c Content script loaded ', 'background: #222; color: #bada55');

let observedArticles = new Set();
let pendingCommits = new Map();

const observerConfig = { 
  childList: true, 
  subtree: true,
  characterData: true
};

function createCommitForArticle(article) {
  const role = article.querySelector('div[data-message-author-role]')?.getAttribute('data-message-author-role') || 'unknown';
  let contentDiv;

  if (role === 'user') {
    contentDiv = article.querySelector('div.whitespace-pre-wrap');
  } else {
    contentDiv = article.querySelector('div.markdown.prose.w-full.break-words.dark\\:prose-invert.light');
  }

  const content = contentDiv ? contentDiv.innerHTML.trim() : '';
  
  if (content) {
    const message = `New ${role} message`;
    const data = `${role}:\n${content}`;

    console.log('Creating commit for article:', { role, content: content.substring(0, 100) + '...' });

    chrome.runtime.sendMessage({ 
      type: 'CREATE_COMMIT', 
      message: message,
      data: data
    }, response => {
      console.log('CREATE_COMMIT response:', response);
    });

    pendingCommits.delete(article);
  } else {
    console.log('Content not yet loaded for article, waiting...');
    pendingCommits.set(article, role);
  }
}

function handleNewArticles(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.matches('article')) {
      if (!observedArticles.has(node)) {
        observedArticles.add(node);
        console.log('New article found:', node);
        createCommitForArticle(node);
      }
    } else {
      node.querySelectorAll('article').forEach(article => {
        if (!observedArticles.has(article)) {
          observedArticles.add(article);
          console.log('New article found in child:', article);
          createCommitForArticle(article);
        }
      });
    }
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(handleNewArticles);
    } else if (mutation.type === 'characterData') {
      let target = mutation.target;
      while (target && target.nodeName !== 'ARTICLE') {
        target = target.parentNode;
      }
      if (target && pendingCommits.has(target)) {
        createCommitForArticle(target);
      }
    }
  });
});

function setupMutationObserver() {
  const targetNode = document.body;
  observer.observe(targetNode, observerConfig);
  console.log('Mutation observer set up on body');

  // Check for existing articles
  document.querySelectorAll('article').forEach(handleNewArticles);
}

function initializeObserver() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMutationObserver);
  } else {
    setupMutationObserver();
  }
}

// Initial setup
initializeObserver();

// Fallback for late-loading content
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('Checking for late-loading articles');
    document.querySelectorAll('article').forEach(handleNewArticles);
    
    // Check pending commits
    pendingCommits.forEach((role, article) => {
      createCommitForArticle(article);
    });
  }, 2000);
});

// For debugging: Log when the content script receives a message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  sendResponse({ received: true });
});