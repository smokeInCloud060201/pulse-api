import React from 'react';
import { X, Play } from 'lucide-react';
import './TabBar.css';

export const TabBar: React.FC = () => {
  return (
    <div className="tab-bar">
      <div className="tabs-scroll">
        <div className="tab active">
          <span className="method method-post">POST</span>
          <span className="tab-title">Create User</span>
          <button className="tab-close"><X size={14} /></button>
        </div>
        <div className="tab">
          <span className="method method-get">GET</span>
          <span className="tab-title">Users List</span>
          <button className="tab-close"><X size={14} /></button>
        </div>
      </div>
      <div className="env-selector">
        <select className="env-select">
          <option>No Environment</option>
          <option>Development</option>
          <option>Production</option>
        </select>
      </div>
    </div>
  );
};
