import React from 'react';
import { X } from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useTabStore } from '../../stores/tabStore';
import { useRequestStore } from '../../stores/requestStore';
import { EnvSelector } from './EnvSelector';
import './TabBar.css';

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'var(--color-success)';
    case 'POST':
      return 'var(--color-warning)';
    case 'PUT':
      return 'var(--color-info)';
    case 'DELETE':
      return 'var(--color-danger)';
    case 'PATCH':
      return 'var(--color-warning)';
    default:
      return 'var(--text-muted)';
  }
};

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, markTabSaved } = useTabStore();
  const { updateRequest } = useRequestStore();

  if (tabs.length === 0) {
    return (
      <div className="tab-bar">
        <div className="tabs-scroll"></div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', marginLeft: 'auto' }}>
          <EnvSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="tab-bar">
      <div className="tabs-scroll">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={activeTabId === tab.id ? { borderTopColor: `hsl(${getMethodColor(tab.request.method)})` } : {}}
          >
            <span className="method" style={{ color: `hsl(${getMethodColor(tab.request.method)})` }}>
              {tab.request.method}
            </span>
            <span className="tab-title">
              {tab.request.name || 'Untitled Request'}
            </span>
            {tab.isDirty && <span style={{ color: 'hsl(var(--color-warning))', flexShrink: 0, fontSize: '1.2rem', lineHeight: 1 }}>•</span>}
            <button
              className="tab-close"
              onClick={async (e) => {
                e.stopPropagation();
                if (tab.isDirty) {
                  const shouldSave = await ask(`Do you want to save the changes to "${tab.request.name || 'Untitled Request'}"?`, {
                    title: 'Unsaved Changes',
                    kind: 'warning',
                  });
                  if (shouldSave) {
                    try {
                      await updateRequest(tab.request);
                      markTabSaved(tab.id);
                    } catch (error) {
                      console.error('Failed to save request:', error);
                      return; // abort close if save failed
                    }
                  }
                }
                closeTab(tab.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', marginLeft: 'auto' }}>
        <EnvSelector />
      </div>
    </div>
  );
};
