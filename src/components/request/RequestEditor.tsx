import React, { useState, useCallback } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { useRequestStore } from '../../stores/requestStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { requestService } from '../../services/requestService';
import { ApiRequest, ApiResponse, KeyValuePair } from '../../types/request';
import { RequestConfig } from './RequestConfig';
import { KeyValueEditor } from './KeyValueEditor';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { GraphQLEditor } from './GraphQLEditor';
import { GrpcEditor } from './GrpcEditor';
import { WebSocketBody, WebSocketResponse, WsMessage } from './WebSocketEditor';
import { AuthEditor } from './AuthEditor';
import { EnvSelector } from '../layout/EnvSelector';
import Editor from '@monaco-editor/react';
import './RequestEditor.css';

interface RequestEditorProps {
  requestId: string;
}

export const RequestEditor: React.FC<RequestEditorProps> = ({ requestId }) => {
  const { tabs, updateTabRequest } = useTabStore();
  const { updateRequest } = useRequestStore();
  const { activeEnvironmentId } = useEnvironmentStore();

  const tab = tabs.find(t => t.id === requestId);
  const request = tab?.request;

  const [activeTab, setActiveTab] = useState('params');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [wsConnectionId, setWsConnectionId] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<WsMessage[]>([]);
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'side-by-side'>(() => {
    return (localStorage.getItem('pulse_layout') as 'stacked' | 'side-by-side') || 'stacked';
  });

  const toggleLayout = () => {
    const newLayout = layoutMode === 'stacked' ? 'side-by-side' : 'stacked';
    setLayoutMode(newLayout);
    localStorage.setItem('pulse_layout', newLayout);
  };

  // Parse headers and params safely
  const safeParseKV = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr) as KeyValuePair[];
    } catch {
      return [];
    }
  };

  const handleRequestChange = (updatedReq: ApiRequest) => {
    updateTabRequest(updatedReq);
  };

  const saveRequest = useCallback(async () => {
    if (!request) return;
    await updateRequest(request);
    updateTabRequest({ ...request });
  }, [request, updateRequest, updateTabRequest]);

  const handleSend = useCallback(async () => {
    if (!request) return;
    setIsLoading(true);
    try {
      if (request.collection_id) {
        await saveRequest().catch(e => console.warn('Failed to save request before sending:', e));
      }
      const res = await requestService.executeRequest(request, activeEnvironmentId);
      setResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [request, activeEnvironmentId, saveRequest]);

  const handleBodyChange = (value: string | undefined) => {
    handleRequestChange({ ...request, body_content: value || '' });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveRequest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSend, saveRequest]);

  React.useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen<any>('ws_event', event => {
      const payload = event.payload;
      if (payload.connection_id !== wsConnectionId) return;

      if (payload.event_type === 'message') {
        setWsMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            type: 'received',
            data: payload.data,
            time: new Date().toLocaleTimeString()
          }
        ]);
      } else if (payload.event_type === 'error') {
        setWsMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'system',
            data: `Error: ${payload.data}`,
            time: new Date().toLocaleTimeString()
          }
        ]);
        setWsStatus('disconnected');
        setWsConnectionId(null);
      } else if (payload.event_type === 'closed') {
        setWsMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'system',
            data: 'Connection closed',
            time: new Date().toLocaleTimeString()
          }
        ]);
        setWsStatus('disconnected');
        setWsConnectionId(null);
      }
    }).then(fn => (unlisten = fn));

    return () => {
      if (unlisten) unlisten();
    };
  }, [wsConnectionId]);

  if (!request) return null;

  const handleWsConnect = async () => {
    if (!request) return;
    setWsStatus('connecting');
    try {
      const connId = await invoke<string>('connect_websocket', { url: request.url });
      setWsConnectionId(connId);
      setWsStatus('connected');
      setWsMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          data: `Connected to ${request.url}`,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } catch (e: unknown) {
      setWsStatus('disconnected');
      setWsMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          data: `Failed to connect: ${e instanceof Error ? e.message : String(e)}`,
          time: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleWsDisconnect = async () => {
    if (wsConnectionId) {
      try {
        await invoke('disconnect_websocket', { connectionId: wsConnectionId });
      } catch (e: unknown) {
        console.error(e);
      }
      setWsStatus('disconnected');
      setWsConnectionId(null);
      setWsMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          data: 'Disconnected by user',
          time: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleWsSend = async (message: string) => {
    if (wsStatus === 'connected' && wsConnectionId) {
      try {
        await invoke('send_websocket_message', { connectionId: wsConnectionId, message });
        setWsMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'sent',
            data: message,
            time: new Date().toLocaleTimeString()
          }
        ]);
      } catch (e: unknown) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'hsl(var(--bg-panel))' }}>
      {/* Breadcrumbs Row */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0 16px' }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            color: 'hsl(var(--text-muted))',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>REST API basics: CRUD, test & variable</span>
          <span>/</span>
          <span style={{ color: 'hsl(var(--text-main))', fontWeight: 500 }}>{request.name || 'Untitled Request'}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <EnvSelector />
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: '1px solid hsl(var(--border-light))',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: '0.8rem',
              cursor: 'pointer',
              color: 'hsl(var(--text-main))'
            }}
          >
            Save
          </button>
        </div>
      </div>

      <RequestConfig
        request={request}
        onChange={handleRequestChange}
        onSend={handleSend}
        isLoading={isLoading}
        wsStatus={wsStatus}
        onWsConnect={handleWsConnect}
        onWsDisconnect={handleWsDisconnect}
        layoutMode={layoutMode}
        onToggleLayout={toggleLayout}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: layoutMode === 'stacked' ? 'column' : 'row',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Top/Left pane: Request Details */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: layoutMode === 'side-by-side' ? '1px solid var(--border-light)' : 'none',
            borderBottom: layoutMode === 'stacked' ? '1px solid var(--border-light)' : 'none',
            overflow: 'hidden'
          }}
        >
          <div className="request-editor-tabs">
            <div className={`req-tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>
              Params
            </div>
            <div className={`req-tab ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>
              Auth
            </div>
            <div
              className={`req-tab ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
            </div>
            <div className={`req-tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>
              Body
            </div>
            <div className={`req-tab ${activeTab === 'prereq' ? 'active' : ''}`} onClick={() => setActiveTab('prereq')}>
              Pre-request Script
            </div>
            <div className={`req-tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
              Tests
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
            {activeTab === 'params' && (
              <KeyValueEditor
                items={safeParseKV(request.query_params)}
                onChange={items => handleRequestChange({ ...request, query_params: JSON.stringify(items) })}
              />
            )}
            {activeTab === 'auth' && (
              <AuthEditor
                headers={safeParseKV(request.headers)}
                onChange={items => handleRequestChange({ ...request, headers: JSON.stringify(items) })}
              />
            )}
            {activeTab === 'headers' && (
              <KeyValueEditor
                items={safeParseKV(request.headers)}
                onChange={items => handleRequestChange({ ...request, headers: JSON.stringify(items) })}
              />
            )}
            {activeTab === 'body' && (
              <div style={{ height: '100%', paddingTop: 16, display: 'flex', flexDirection: 'column' }}>
                {request.protocol === 'WebSocket' ? (
                  <WebSocketBody onSend={handleWsSend} status={wsStatus} />
                ) : request.protocol === 'GraphQL' ? (
                  <GraphQLEditor request={request} onChange={handleBodyChange} />
                ) : request.protocol === 'gRPC' ? (
                  <GrpcEditor request={request} onChange={handleRequestChange} />
                ) : (
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={request.body_content || ''}
                    onChange={handleBodyChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false
                    }}
                  />
                )}
              </div>
            )}
            {activeTab === 'prereq' && (
              <div style={{ height: '100%', paddingTop: 16 }}>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={request.pre_script || ''}
                  onChange={val => handleRequestChange({ ...request, pre_script: val || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false
                  }}
                />
              </div>
            )}
            {activeTab === 'tests' && (
              <div style={{ height: '100%', paddingTop: 16 }}>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={request.post_script || ''}
                  onChange={val => handleRequestChange({ ...request, post_script: val || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom/Right pane: Response */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)'
          }}
        >
          {request.protocol === 'WebSocket' ? (
            <WebSocketResponse messages={wsMessages} />
          ) : (
            <>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: 600
                }}
              >
                Response
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {isLoading ? (
                  <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Sending request...</div>
                ) : response ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        gap: '16px',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span
                        style={{
                          color: response.status < 300 ? 'var(--color-success)' : 'var(--color-danger)'
                        }}
                      >
                        Status: {response.status} {response.status_text}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>Time: {response.latency_ms}ms</span>
                      <span style={{ color: 'var(--text-muted)' }}>Size: {response.size_bytes}B</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Editor
                        height="100%"
                        language={
                          response.body_type === 'json' ? 'json' : response.body_type === 'html' ? 'html' : 'text'
                        }
                        theme="vs-dark"
                        value={response.body}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 13,
                          wordWrap: 'on'
                        }}
                      />
                    </div>
                    {response.console_logs && response.console_logs.length > 0 && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          height: '150px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 16px',
                            background: 'var(--bg-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          Console
                        </div>
                        <div
                          style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '8px 16px',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                          }}
                        >
                          {response.console_logs.map((log, i) => (
                            <div
                              key={i}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '4px 0'
                              }}
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Hit Send to get a response</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
