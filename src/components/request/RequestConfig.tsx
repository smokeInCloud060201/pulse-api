import React from 'react';
import { Play } from 'lucide-react';
import { ApiRequest } from '../../types/request';
import './RequestEditor.css';

interface RequestConfigProps {
  request: ApiRequest;
  onChange: (request: ApiRequest) => void;
  onSend: () => void;
  isLoading: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

export const RequestConfig: React.FC<RequestConfigProps> = ({ request, onChange, onSend, isLoading }) => {
  return (
    <div className="request-config">
      <select 
        className={`method-select method-${request.method.toLowerCase()}`}
        value={request.method}
        onChange={(e) => onChange({ ...request, method: e.target.value })}
      >
        {METHODS.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      
      <input 
        type="text" 
        className="url-input"
        placeholder="Enter request URL"
        value={request.url}
        onChange={(e) => onChange({ ...request, url: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
      />
      
      <button 
        className="send-btn" 
        onClick={onSend}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : (
          <>
            <Play size={14} fill="currentColor" /> Send
          </>
        )}
      </button>
    </div>
  );
};
