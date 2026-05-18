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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
          backgroundColor: 'var(--bg-panel)',
          padding: '24px',
          borderRadius: '8px',
          width: '500px',
          maxWidth: '90vw',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Import Data</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div
          className="tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}
        >
          <div
            className={`tab ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('collection');
              setStatus({ type: 'idle', message: '' });
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'collection' ? '2px solid var(--color-primary)' : 'none',
              color: activeTab === 'collection' ? 'var(--color-primary)' : 'inherit'
            }}
          >
            Postman Collection
          </div>
          <div
            className={`tab ${activeTab === 'environment' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('environment');
              setStatus({ type: 'idle', message: '' });
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'environment' ? '2px solid var(--color-primary)' : 'none',
              color: activeTab === 'environment' ? 'var(--color-primary)' : 'inherit'
            }}
          >
            Postman Environment
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '30px 20px',
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.2)'
          }}
        >
          <UploadCloud size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ margin: '0 0 16px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            {activeTab === 'collection'
              ? 'Select a Postman Collection v2.1 JSON file'
              : 'Select a Postman Environment JSON file'}
          </p>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </button>
        </div>

        {status.type !== 'idle' && (
          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: status.type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
              color: status.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
            }}
          >
            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.9rem' }}>{status.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
