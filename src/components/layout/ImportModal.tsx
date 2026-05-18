import React, { useRef, useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useCollectionStore } from '../../stores/collectionStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { parsePostmanCollection, parsePostmanEnvironment } from '../../utils/postmanImporter';
import { v4 as uuidv4 } from 'uuid';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'environment'>('collection');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importCollectionData } = useCollectionStore();
  const { createEnvironment, updateEnvironment } = useEnvironmentStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (activeTab === 'collection') {
          const result = parsePostmanCollection(content);
          if (result.error) {
            setStatus({ type: 'error', message: result.error });
            return;
          }
          if (result.collection && result.folders && result.requests) {
            await importCollectionData(result.collection, result.folders, result.requests);
            setStatus({
              type: 'success',
              message: `Successfully imported collection: ${result.collection.name} with ${result.requests.length} requests.`
            });
          }
        } else {
          const result = parsePostmanEnvironment(content);
          if (result.error) {
            setStatus({ type: 'error', message: result.error });
            return;
          }
          if (result.name && result.variables) {
            const newEnvId = uuidv4();
            await createEnvironment(newEnvId, result.name);
            await updateEnvironment(
              newEnvId,
              result.name,
              result.variables.map(v => ({
                id: uuidv4(),
                environment_id: newEnvId,
                key: v.key,
                value: v.value,
                enabled: v.enabled,
                var_type: 'default'
              }))
            );
            setStatus({
              type: 'success',
              message: `Successfully imported environment: ${result.name} with ${result.variables.length} variables.`
            });
          }
        }
      } catch (err: unknown) {
        setStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'An unexpected error occurred during import.'
        });
      }
    };

    reader.readAsText(file);

    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'hsl(var(--bg-panel))',
          borderRadius: '8px',
          width: '560px',
          maxWidth: '90vw',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          border: '1px solid hsl(var(--border-light))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid hsl(var(--border-light))'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Import</h2>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              padding: 4
            }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            padding: '0 16px',
            borderBottom: '1px solid hsl(var(--border-light))',
            backgroundColor: 'hsl(var(--bg-base))'
          }}
        >
          <div
            onClick={() => {
              setActiveTab('collection');
              setStatus({ type: 'idle', message: '' });
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderBottom: activeTab === 'collection' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeTab === 'collection' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))'
            }}
          >
            Postman Collection
          </div>
          <div
            onClick={() => {
              setActiveTab('environment');
              setStatus({ type: 'idle', message: '' });
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderBottom: activeTab === 'environment' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeTab === 'environment' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))'
            }}
          >
            Postman Environment
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px',
              border: '1px dashed hsl(var(--border-light))',
              borderRadius: '6px',
              backgroundColor: 'hsl(var(--bg-surface))',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={32} style={{ color: 'hsl(var(--primary))', marginBottom: '16px' }} />
            <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 500, color: 'hsl(var(--text-main))' }}>
              Upload {activeTab === 'collection' ? 'Collection' : 'Environment'} File
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
              Drag and drop your JSON file here, or click to browse
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {status.type !== 'idle' && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor:
                  status.type === 'success' ? 'hsla(var(--color-success), 0.1)' : 'hsla(var(--color-danger), 0.1)',
                color: status.type === 'success' ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))',
                border: `1px solid ${status.type === 'success' ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))'}`
              }}
            >
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span style={{ fontSize: '0.85rem' }}>{status.message}</span>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'hsl(var(--bg-base))',
            borderTop: '1px solid hsl(var(--border-light))',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-light))',
              borderRadius: '4px',
              color: 'hsl(var(--text-main))',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
