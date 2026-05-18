import React, { useState, useEffect } from 'react';
import { KeyValuePair } from '../../types/request';
import { Dropdown } from '../ui/Dropdown';

interface AuthEditorProps {
  headers: KeyValuePair[];
  onChange: (headers: KeyValuePair[]) => void;
}

type AuthType = 'none' | 'bearer' | 'basic';

export const AuthEditor: React.FC<AuthEditorProps> = ({ headers, onChange }) => {
  const [authType, setAuthType] = useState<AuthType>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [basicUsername, setBasicUsername] = useState('');
  const [basicPassword, setBasicPassword] = useState('');

  useEffect(() => {
    // Try to guess auth type from existing headers on mount
    const authHeader = headers.find(h => h.key.toLowerCase() === 'authorization');
    if (authHeader) {
      if (authHeader.value.startsWith('Bearer ')) {
        setAuthType('bearer');
        setBearerToken(authHeader.value.substring(7));
      } else if (authHeader.value.startsWith('Basic ')) {
        setAuthType('basic');
        try {
          const decoded = atob(authHeader.value.substring(6));
          const [u, ...p] = decoded.split(':');
          setBasicUsername(u);
          setBasicPassword(p.join(':'));
        } catch {
          // Ignore parse errors
        }
      }
    } else {
      setAuthType('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const updateAuthHeader = (type: AuthType, value: string | null) => {
    const newHeaders = headers.filter(h => h.key.toLowerCase() !== 'authorization');
    if (type !== 'none' && value) {
      newHeaders.push({
        key: 'Authorization',
        value,
        enabled: true
      });
    }
    onChange(newHeaders);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as AuthType;
    setAuthType(type);
    if (type === 'none') {
      updateAuthHeader('none', null);
    } else if (type === 'bearer') {
      updateAuthHeader('bearer', `Bearer ${bearerToken}`);
    } else if (type === 'basic') {
      const b64 = btoa(`${basicUsername}:${basicPassword}`);
      updateAuthHeader('basic', `Basic ${b64}`);
    }
  };

  const handleBearerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setBearerToken(token);
    updateAuthHeader('bearer', `Bearer ${token}`);
  };

  const handleBasicChange = (field: 'username' | 'password', value: string) => {
    const u = field === 'username' ? value : basicUsername;
    const p = field === 'password' ? value : basicPassword;
    if (field === 'username') setBasicUsername(value);
    if (field === 'password') setBasicPassword(value);

    const b64 = btoa(`${u}:${p}`);
    updateAuthHeader('basic', `Basic ${b64}`);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500 }}>Auth Type:</label>
        <Dropdown
          value={authType}
          onChange={(val) => {
            const type = val as AuthType;
            setAuthType(type);
            if (type === 'none') {
              updateAuthHeader('none', null);
            } else if (type === 'bearer') {
              updateAuthHeader('bearer', `Bearer ${bearerToken}`);
            } else if (type === 'basic') {
              const b64 = btoa(`${basicUsername}:${basicPassword}`);
              updateAuthHeader('basic', `Basic ${b64}`);
            }
          }}
          options={[
            { value: 'none', label: 'No Auth' },
            { value: 'bearer', label: 'Bearer Token' },
            { value: 'basic', label: 'Basic Auth' }
          ]}
          triggerStyle={{
            padding: '6px 8px',
            background: 'hsl(var(--bg-panel))',
            minWidth: '130px'
          }}
        />
      </div>

      {authType === 'bearer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            The Authorization header will be automatically generated when you send the request.
          </p>
          <input
            type="text"
            placeholder="Token"
            value={bearerToken}
            onChange={handleBearerChange}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid hsl(var(--border-light))',
              background: 'hsl(var(--bg-base))',
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
      )}

      {authType === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            The Authorization header will be automatically generated with Base64 encoding.
          </p>
          <input
            type="text"
            placeholder="Username"
            value={basicUsername}
            onChange={e => handleBasicChange('username', e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid hsl(var(--border-light))',
              background: 'hsl(var(--bg-base))',
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              width: '100%'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={basicPassword}
            onChange={e => handleBasicChange('password', e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid hsl(var(--border-light))',
              background: 'hsl(var(--bg-base))',
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
      )}
    </div>
  );
};
