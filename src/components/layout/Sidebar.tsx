import React, { useState } from 'react';
import { Settings, Download, Search, Sun, Moon } from 'lucide-react';
import { CollectionTree } from '../collections/CollectionTree';
import { ImportModal } from './ImportModal';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [showImport, setShowImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('pulse-theme') || 'dark');

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
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Pulse</div>
      </div>
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid hsl(var(--border-light))',
              background: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-main))'
            }}
          />
        </div>
      </div>
      <div className="sidebar-collections">
        <CollectionTree searchTerm={searchTerm} />
      </div>
      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button className="icon-btn" title="Toggle Theme" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="icon-btn" title="Settings">
            <Settings size={18} />
          </button>
          <button className="icon-btn" title="Import Data" onClick={() => setShowImport(true)}>
            <Download size={18} />
          </button>
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
};
