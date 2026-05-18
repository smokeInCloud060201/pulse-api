import React from 'react';
import Editor from '@monaco-editor/react';
import { ApiRequest } from '../../types/request';

interface GrpcEditorProps {
  request: ApiRequest;
  onChange: (request: ApiRequest) => void;
}

export const GrpcEditor: React.FC<GrpcEditorProps> = ({ request, onChange }) => {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left side: Proto definition */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          Proto File Content
        </div>
        <div style={{ flex: 1, padding: '8px' }}>
          <Editor
            height="100%"
            language="proto"
            theme="vs-dark"
            value={request.proto_file || ''}
            onChange={val => onChange({ ...request, proto_file: val || '' })}
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Right side: Method and Payload */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Service Name (e.g. helloworld.Greeter)
            </div>
            <input
              type="text"
              value={request.grpc_service || ''}
              onChange={e => onChange({ ...request, grpc_service: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '4px'
              }}
              placeholder="Package.Service"
            />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Method Name (e.g. SayHello)
            </div>
            <input
              type="text"
              value={request.grpc_method || ''}
              onChange={e => onChange({ ...request, grpc_method: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '4px'
              }}
              placeholder="MethodName"
            />
          </div>
        </div>
        <div style={{ padding: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Request Payload (JSON)</div>
        <div style={{ flex: 1, padding: '8px' }}>
          <Editor
            height="100%"
            language="json"
            theme="vs-dark"
            value={request.body_content || ''}
            onChange={val => onChange({ ...request, body_content: val || '' })}
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>
      </div>
    </div>
  );
};
