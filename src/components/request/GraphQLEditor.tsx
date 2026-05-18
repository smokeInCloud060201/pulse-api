import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { ApiRequest } from '../../types/request';
import { getIntrospectionQuery, buildClientSchema } from 'graphql';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { monaco } from '../../monaco-setup';

interface GraphQLEditorProps {
  request: ApiRequest;
  onChange: (value: string) => void;
}

export const GraphQLEditor: React.FC<GraphQLEditorProps> = ({ request, onChange }) => {
  // const monaco = useMonaco();
  const { activeEnvironmentId, environments } = useEnvironmentStore();
  const [schemaFetched, setSchemaFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse existing body content
  let parsedContent = { query: '', variables: '{}' };
  try {
    if (request.body_content) {
      parsedContent = JSON.parse(request.body_content);
    }
  } catch (e) {
    // ignore
  }

  const handleQueryChange = (val: string | undefined) => {
    onChange(JSON.stringify({ ...parsedContent, query: val || '' }));
  };

  const handleVariablesChange = (val: string | undefined) => {
    onChange(JSON.stringify({ ...parsedContent, variables: val || '{}' }));
  };

  // Replace variables in URL using active environment
  const resolveUrl = (url: string) => {
    if (!activeEnvironmentId) return url;
    const env = environments.find(e => e.id === activeEnvironmentId);
    if (!env) return url;
    
    let resolvedUrl = url;
    const variables = env.variables || [];
    for (const v of variables) {
      if (v.enabled) {
        resolvedUrl = resolvedUrl.replace(new RegExp(`{{${v.key}}}`, 'g'), v.value);
      }
    }
    return resolvedUrl;
  };

  const fetchSchema = async () => {
    if (!request.url) {
      setError('URL is required to fetch schema');
      return;
    }

    setIsFetching(true);
    setError(null);
    try {
      const resolvedUrl = resolveUrl(request.url);
      const response = await fetch(resolvedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: getIntrospectionQuery()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // We successfully got the introspection result
      const schema = buildClientSchema(result.data);
      console.log('Schema fetched successfully');
      
      if ((monaco.languages as any).graphql) {
        (monaco.languages as any).graphql.setSchemaConfig([
          {
            schema: schema,
            uri: resolvedUrl,
            fileMatch: ['**/*.graphql']
          }
        ]);
      }
      
      setSchemaFetched(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch schema:', err);
      setError(err.message || 'Failed to fetch schema');
      setSchemaFetched(false);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GraphQL Query</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{error}</span>}
          {schemaFetched && <span style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}>Schema loaded ✓</span>}
          <button 
            onClick={fetchSchema}
            disabled={isFetching}
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {isFetching ? 'Fetching...' : 'Fetch Schema'}
          </button>
        </div>
      </div>
      <div style={{ flex: 2, border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <Editor 
          height="100%" 
          language="graphql" 
          theme="vs-dark"
          path={`${request.id || 'query'}.graphql`}
          value={parsedContent.query}
          onChange={handleQueryChange}
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
      
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 8px', marginTop: '8px' }}>GraphQL Variables (JSON)</div>
      <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <Editor 
          height="100%" 
          language="json" 
          theme="vs-dark"
          value={parsedContent.variables}
          onChange={handleVariablesChange}
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
    </div>
  );
};
