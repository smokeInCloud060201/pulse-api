import React, { useState, useRef, useEffect } from 'react';
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
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setIsMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="request-config">
      <div className="url-bar-group">

        <div className="method-select-wrapper" ref={methodDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className={`method-select method-${request.method.toLowerCase()}`}
            onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
            disabled={request.protocol === 'GraphQL' || request.protocol === 'gRPC' || request.protocol === 'WebSocket'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            {request.protocol === 'WebSocket' ? 'WS' : request.method}
            <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))' }} />
          </button>

          {isMethodDropdownOpen && (
            <div className="method-dropdown-menu">
              {METHODS.map(m => (
                <div
                  key={m}
                  className={`method-dropdown-item method-${m.toLowerCase()}`}
                  onClick={() => {
                    onChange({ ...request, method: m });
                    setIsMethodDropdownOpen(false);
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

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
