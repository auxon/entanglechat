import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './popup.css';

const BranchManager = ({ currentBranch, branches, onSwitchBranch, onCreateBranch }) => {
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      onCreateBranch(newBranchName.trim());
      setNewBranchName('');
    }
  };

  return (
    <div className="branch-manager">
      <h2>Branches</h2>
      <ul>
        {branches.map(branch => (
          <li key={branch}>
            {branch === currentBranch ? (
              <strong>{branch}</strong>
            ) : (
              <button onClick={() => onSwitchBranch(branch)}>{branch}</button>
            )}
          </li>
        ))}
      </ul>
      <div className="new-branch">
        <input
          type="text"
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          placeholder="New branch name"
        />
        <button onClick={handleCreateBranch}>Create Branch</button>
      </div>
    </div>
  );
};

const Popup = () => {
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'LIST_BRANCHES' }, response => {
      if (response.success) {
        setBranches(response.branches);
        setCurrentBranch(response.currentBranch);
      }
    });
  }, []);

  const handleSwitchBranch = (branchName) => {
    chrome.runtime.sendMessage({ type: 'SWITCH_BRANCH', branchName }, response => {
      if (response.success) {
        setCurrentBranch(branchName);
      }
    });
  };

  const handleCreateBranch = (branchName) => {
    chrome.runtime.sendMessage({ type: 'CREATE_BRANCH', branchName }, response => {
      if (response.success) {
        setBranches([...branches, branchName]);
      }
    });
  };

  const openHistoryPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  };

  return (
    <div className="popup">
      <h1>ChatGPT Git Tracker</h1>
      <BranchManager
        currentBranch={currentBranch}
        branches={branches}
        onSwitchBranch={handleSwitchBranch}
        onCreateBranch={handleCreateBranch}
      />
      <button className="history-button" onClick={openHistoryPage}>View History</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Popup />);