import React from 'react';
import { Columns, Rows, ChevronDown } from 'lucide-react';
import { ApiRequest } from '../../types/request';
import './RequestEditor.css';

interface RequestConfigProps {
  request: ApiRequest;
  onChange: (request: ApiRequest) => void;
  onSend: () => void;
  isLoading: boolean;
  wsStatus?: 'disconnected' | 'connecting' | 'connected';
  onWsConnect?: () => void;
  onWsDisconnect?: () => void;
  layoutMode: 'stacked' | 'side-by-side';
  onToggleLayout: () => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'WS'];

export const RequestConfig: React.FC<RequestConfigProps> = ({
  request,
  onChange,
  onSend,
  isLoading,
  wsStatus,
  onWsConnect,
  onWsDisconnect,
  layoutMode,
  onToggleLayout
}) => {
  return (
    <div className="request-config">
      <div className="url-bar-group">

        <div className="method-select-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            className={`method-select method-${request.method.toLowerCase()}`}
            value={request.protocol === 'WebSocket' ? 'WS' : request.method}
            onChange={e => onChange({ ...request, method: e.target.value })}
            disabled={request.protocol === 'GraphQL' || request.protocol === 'gRPC' || request.protocol === 'WebSocket'}
            style={{ paddingRight: '24px' }}
          >
            {METHODS.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'hsl(var(--text-muted))' }} />
        </div>

        <div className="vertical-divider" />

        <input
          type="text"
          className="url-input"
          placeholder="Enter request URL"
          value={request.url}
          onChange={e => onChange({ ...request, url: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') onSend();
          }}
        />
      </div>

      <div className="send-btn-group">
        {request.protocol === 'WebSocket' ? (
          <button
            className="send-btn main-send"
            onClick={wsStatus === 'connected' ? onWsDisconnect : onWsConnect}
            style={{ backgroundColor: wsStatus === 'connected' ? 'hsl(var(--method-delete))' : 'hsl(var(--primary))' }}
          >
            {wsStatus === 'connecting' ? 'Connecting...' : wsStatus === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
        ) : (
          <button className="send-btn main-send" onClick={onSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        )}
        <button className="send-btn dropdown-send" disabled={isLoading}>
          <ChevronDown size={14} />
        </button>
      </div>

      <button
        className="layout-toggle-btn"
        onClick={onToggleLayout}
        title={layoutMode === 'stacked' ? 'Switch to Side-by-Side' : 'Switch to Stacked'}
      >
        {layoutMode === 'stacked' ? <Columns size={16} /> : <Rows size={16} />}
      </button>
    </div>
  );
};
