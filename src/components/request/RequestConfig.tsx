import React from 'react';
import { Play } from 'lucide-react';
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
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'WS'];

export const RequestConfig: React.FC<RequestConfigProps> = ({
  request,
  onChange,
  onSend,
  isLoading,
  wsStatus,
  onWsConnect,
  onWsDisconnect
}) => {
  return (
    <div className="request-config">
      <select
        className="protocol-select"
        value={request.protocol || 'REST'}
        onChange={e => {
          const protocol = e.target.value;
          const method = protocol === 'GraphQL' ? 'POST' : request.method;
          onChange({ ...request, protocol, method });
        }}
        style={{
          padding: '8px',
          border: 'none',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        <option value="REST">REST</option>
        <option value="GraphQL">GraphQL</option>
        <option value="gRPC">gRPC</option>
        <option value="WebSocket">WebSocket</option>
      </select>
      <select
        className={`method-select method-${request.method.toLowerCase()}`}
        value={request.protocol === 'WebSocket' ? 'WS' : request.method}
        onChange={e => onChange({ ...request, method: e.target.value })}
        disabled={request.protocol === 'GraphQL' || request.protocol === 'gRPC' || request.protocol === 'WebSocket'}
      >
        {METHODS.map(m => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

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

      {request.protocol === 'WebSocket' ? (
        <button
          className="send-btn"
          onClick={wsStatus === 'connected' ? onWsDisconnect : onWsConnect}
          style={{
            backgroundColor: wsStatus === 'connected' ? 'var(--color-danger)' : 'var(--color-primary)'
          }}
        >
          {wsStatus === 'connecting' ? 'Connecting...' : wsStatus === 'connected' ? 'Disconnect' : 'Connect'}
        </button>
      ) : (
        <button className="send-btn" onClick={onSend} disabled={isLoading}>
          {isLoading ? (
            'Sending...'
          ) : (
            <>
              <Play size={14} fill="currentColor" /> Send
            </>
          )}
        </button>
      )}
    </div>
  );
};
