import React, { useState } from 'react';
import { Settings, Download } from 'lucide-react';
import { CollectionTree } from '../collections/CollectionTree';
import { ImportModal } from './ImportModal';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [showImport, setShowImport] = useState(false);
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Pulse</div>
      </div>
      <div className="sidebar-collections">
        <CollectionTree />
      </div>
      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button className="icon-btn" title="Settings">
          <Settings size={18} />
        </button>
        <button className="icon-btn" title="Import Data" onClick={() => setShowImport(true)}>
          <Download size={18} />
        </button>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
};
