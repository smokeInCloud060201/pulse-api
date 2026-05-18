import React, { useState } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { useRequestStore } from '../../stores/requestStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { requestService } from '../../services/requestService';
import { ApiRequest, ApiResponse, KeyValuePair } from '../../types/request';
import { RequestConfig } from './RequestConfig';
import { KeyValueEditor } from './KeyValueEditor';
import { GraphQLEditor } from './GraphQLEditor';
import { GrpcEditor } from './GrpcEditor';
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

  // Parse headers and params safely
  const safeParseKV = (jsonStr: string) => {
    try { return JSON.parse(jsonStr) as KeyValuePair[]; } catch { return []; }
  };

  if (!request) return null;

  const handleRequestChange = (updatedReq: ApiRequest) => {
    updateTabRequest(updatedReq);
  };

  const saveRequest = async () => {
    if (!request) return;
    await updateRequest(request);
    updateTabRequest({ ...request });
  };

  const handleSend = async () => {
    if (!request) return;
    setIsLoading(true);
    try {
      await saveRequest();
      const res = await requestService.executeRequest(request.id, activeEnvironmentId);
      setResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBodyChange = (value: string | undefined) => {
    handleRequestChange({ ...request, body_content: value || '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <RequestConfig 
        request={request}
        onChange={handleRequestChange}
        onSend={handleSend}
        isLoading={isLoading}
      />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Top/Left pane: Request Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
          <div className="request-editor-tabs">
            <div className={`req-tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Params</div>
            <div className={`req-tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
            <div className={`req-tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
            <div className={`req-tab ${activeTab === 'prereq' ? 'active' : ''}`} onClick={() => setActiveTab('prereq')}>Pre-request Script</div>
            <div className={`req-tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>Tests</div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
            {activeTab === 'params' && (
              <KeyValueEditor 
                items={safeParseKV(request.query_params)} 
                onChange={(items) => handleRequestChange({ ...request, query_params: JSON.stringify(items) })}
              />
            )}
            {activeTab === 'headers' && (
              <KeyValueEditor 
                items={safeParseKV(request.headers)} 
                onChange={(items) => handleRequestChange({ ...request, headers: JSON.stringify(items) })}
              />
            )}
            {activeTab === 'body' && (
              <div style={{ height: '100%', paddingTop: 16, display: 'flex', flexDirection: 'column' }}>
                {request.protocol === 'GraphQL' ? (
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
                    options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
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
                  onChange={(val) => handleRequestChange({ ...request, pre_script: val || '' })}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
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
                  onChange={(val) => handleRequestChange({ ...request, post_script: val || '' })}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom/Right pane: Response */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
            Response
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Sending request...</div>
            ) : response ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <span style={{ color: response.status < 300 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    Status: {response.status} {response.status_text}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>Time: {response.latency_ms}ms</span>
                  <span style={{ color: 'var(--text-muted)' }}>Size: {response.size_bytes}B</span>
                </div>
                <div style={{ flex: 1 }}>
                  <Editor 
                    height="100%"
                    language={response.body_type === 'json' ? 'json' : response.body_type === 'html' ? 'html' : 'text'}
                    theme="vs-dark"
                    value={response.body}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
                  />
                </div>
                {response.console_logs && response.console_logs.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', height: '150px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px 16px', background: 'var(--bg-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Console</div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {response.console_logs.map((log, i) => (
                        <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4px 0' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Hit Send to get a response</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
