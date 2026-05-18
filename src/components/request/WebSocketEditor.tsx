import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Editor from '@monaco-editor/react';

export interface WsMessage {
  id: string;
  type: 'sent' | 'received' | 'system';
  data: string;
  time: string;
}

interface WebSocketBodyProps {
  onSend: (msg: string) => void;
  status: string;
}

export const WebSocketBody: React.FC<WebSocketBodyProps> = ({ onSend, status }) => {
  const [message, setMessage] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
      <div
        style={{
          flex: 1,
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={message}
          onChange={v => setMessage(v || '')}
          options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
        />
      </div>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          disabled={status !== 'connected' || !message.trim()}
          onClick={() => {
            onSend(message);
            setMessage('');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Send size={16} /> Send Message
        </button>
      </div>
    </div>
  );
};

interface WebSocketResponseProps {
  messages: WsMessage[];
}

export const WebSocketResponse: React.FC<WebSocketResponseProps> = ({ messages }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: 600
        }}
      >
        WebSocket Log
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
            No messages yet. Connect to a WebSocket server.
          </div>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.type === 'sent' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.time}</div>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  maxWidth: '85%',
                  backgroundColor:
                    m.type === 'sent'
                      ? 'var(--color-primary)'
                      : m.type === 'received'
                        ? 'var(--bg-panel)'
                        : 'transparent',
                  border: m.type === 'received' ? '1px solid var(--border-color)' : 'none',
                  color: m.type === 'system' ? 'var(--text-muted)' : 'inherit',
                  fontStyle: m.type === 'system' ? 'italic' : 'normal',
                  fontFamily: m.type !== 'system' ? 'monospace' : 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {m.data}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
