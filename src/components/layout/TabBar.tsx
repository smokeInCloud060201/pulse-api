import React from 'react';
import { X } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import './TabBar.css';

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'var(--color-success)';
    case 'POST': return 'var(--color-warning)';
    case 'PUT': return 'var(--color-info)';
    case 'DELETE': return 'var(--color-danger)';
    case 'PATCH': return 'var(--color-warning)';
    default: return 'var(--text-muted)';
  }
};

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  if (tabs.length === 0) {
    return <div className="tab-bar"><div className="tabs-scroll"></div></div>;
  }

  return (
    <div className="tab-bar">
      <div className="tabs-scroll">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span 
              className="method" 
              style={{ color: `hsl(${getMethodColor(tab.request.method)})` }}
            >
              {tab.request.method}
            </span>
            <span className="tab-title">
              {tab.request.name || 'Untitled Request'}
              {tab.isDirty && <span style={{ marginLeft: 4, color: 'hsl(var(--color-warning))' }}>•</span>}
            </span>
            <button 
              className="tab-close" 
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
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

