import React from 'react';
import { Settings, Plus } from 'lucide-react';
import { CollectionTree } from '../collections/CollectionTree';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Pulse</div>
      </div>
      <div className="sidebar-collections">
        <CollectionTree />
      </div>
      <div className="sidebar-footer">
        <button className="icon-btn"><Settings size={18} /></button>
      </div>
    </div>
  );
};

