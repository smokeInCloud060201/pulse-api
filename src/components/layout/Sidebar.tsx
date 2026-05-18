import React, { useState } from 'react';
import { Search, Sun, Moon, Folder, Server, Clock, User } from 'lucide-react';
import { CollectionTree } from '../collections/CollectionTree';
import { ImportModal } from './ImportModal';
import { useTabStore } from '../../stores/tabStore';
import { v4 as uuidv4 } from 'uuid';
import { ApiRequest } from '../../types/request';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'environments' | 'history'>('collections');
  const [theme, setTheme] = useState(localStorage.getItem('pulse-theme') || 'dark');
  const { openTab } = useTabStore();

  const handleNewRequest = () => {
    const newReq: ApiRequest = {
      id: uuidv4(),
      folder_id: null,
      collection_id: '',
      name: 'Untitled Request',
      protocol: 'REST',
      method: 'GET',
      url: '',
      headers: '[]',
      query_params: '[]',
      body_type: null,
      body_content: null,
      pre_script: null,
      post_script: null,
      sort_order: 0,
      proto_file: null,
      grpc_service: null,
      grpc_method: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    openTab(newReq);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pulse-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="sidebar-container">
      {/* Icon Strip Column */}
      <div className="sidebar-icon-strip">
        <div className="sidebar-icon-group">
          <button
            className={`strip-icon-btn ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
            title="Collections"
          >
            <Folder size={18} />
            <span className="strip-icon-label">Collections</span>
          </button>
          <button
            className={`strip-icon-btn ${activeTab === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveTab('environments')}
            title="Environments"
          >
            <Server size={18} />
            <span className="strip-icon-label">Environments</span>
          </button>
          <button
            className={`strip-icon-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            title="History"
          >
            <Clock size={18} />
            <span className="strip-icon-label">History</span>
          </button>
        </div>

        <div className="sidebar-icon-group" style={{ marginTop: 'auto' }}>
          <button className="strip-icon-btn" title="Toggle Theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Main List Column */}
      <div className="sidebar-content">
        <div className="sidebar-content-header">
          <div className="sidebar-workspace-title">
            <User size={14} style={{ marginRight: 6 }} /> My Workspace
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="sidebar-header-btn" onClick={handleNewRequest}>New</button>
            <button className="sidebar-header-btn" onClick={() => setShowImport(true)}>
              Import
            </button>
          </div>
        </div>

        <div className="sidebar-filter-bar">
          <Search size={12} className="sidebar-filter-icon" />
          <input type="text" className="sidebar-filter-input" placeholder="Filter..." />
        </div>

        <div className="sidebar-collections">
          {activeTab === 'collections' && <CollectionTree searchTerm="" />}
          {activeTab === 'environments' && (
            <div style={{ padding: '16px', color: 'hsl(var(--text-muted))', fontSize: '12px', textAlign: 'center' }}>
              Environments Coming Soon
            </div>
          )}
          {activeTab === 'history' && (
            <div style={{ padding: '16px', color: 'hsl(var(--text-muted))', fontSize: '12px', textAlign: 'center' }}>
              History Coming Soon
            </div>
          )}
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
};
