import React, { useState } from 'react';
import { Search, Settings, Bell, User, Plus } from 'lucide-react';
import './TopNavBar.css';

export const TopNavBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="top-navbar">
      <div className="top-nav-left">
        <div className="nav-item nav-item-bold">Home</div>
        <div className="nav-item has-dropdown">
          Workspaces ⌄
          <div className="dropdown-menu">
            <div className="dropdown-item">My Workspace</div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item">Create Workspace</div>
          </div>
        </div>
      </div>

      <div className="top-nav-center">
        <div className="nav-search-container">
          <Search size={14} className="nav-search-icon" />
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search Postman"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="nav-btn-plus">
          <Plus size={16} />
        </button>
      </div>

      <div className="top-nav-right">
        <button className="nav-icon-btn">
          <Settings size={16} />
        </button>
        <button className="nav-upgrade-btn">Upgrade</button>
      </div>
    </div>
  );
};
