import { useEffect } from 'react';
import './monaco-setup';
import { TopNavBar } from './components/layout/TopNavBar';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar } from './components/layout/TabBar';
import { RequestEditor } from './components/request/RequestEditor';
import { useTabStore } from './stores/tabStore';
import { useResizer } from './utils/useResizer';
import { Rocket, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ApiRequest } from './types/request';
import './styles/theme.css';

function App() {
  const { init, isInitialized, activeTabId, tabs, openTab } = useTabStore();
  
  const { size: sidebarWidth, isDragging: isSidebarDragging, handleMouseDown: handleSidebarMouseDown } = useResizer({
    initialSize: 280,
    direction: 'horizontal',
    minSize: 200,
    maxSize: 600,
    storageKey: 'pulse-sidebar-width'
  });

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

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopNavBar />
      <div className="main-content" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex' }}>
          <Sidebar />
        </div>
        
        <div 
          className={`app-resizer app-resizer-vertical ${isSidebarDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleSidebarMouseDown}
        />

        <div className="content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid hsl(var(--border-light))'
            }}
          >
            <div style={{ flex: 1 }}>
              <TabBar />
            </div>
          </div>
          {!isInitialized ? (
            <div style={{ padding: '24px', flex: 1 }}>Loading...</div>
          ) : tabs.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'hsl(var(--bg-base))'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                <Rocket size={80} style={{ color: 'hsl(var(--primary))', marginBottom: '24px' }} />
                <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'hsl(var(--text-main))' }}>
                  No Request Selected
                </h2>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Select a request from the sidebar or create a new one to get started.
                </p>
                <button
                  onClick={handleNewRequest}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'hsl(var(--primary))',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> New Request
                </button>
              </div>
            </div>
          ) : activeTabId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <RequestEditor requestId={activeTabId} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
