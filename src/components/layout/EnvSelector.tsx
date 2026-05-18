import React, { useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUiStore } from '../../stores/uiStore';
import { Dropdown } from '../ui/Dropdown';

export const EnvSelector: React.FC = () => {
  const { environments, activeEnvironmentId, setActiveEnvironment, fetchEnvironments } = useEnvironmentStore();
  const { isEnvManagerOpen, setEnvManagerOpen } = useUiStore();

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px' }}>
      <Dropdown
        value={activeEnvironmentId || ''}
        onChange={val => setActiveEnvironment(val || null)}
        options={[
          { value: '', label: 'No Environment' },
          ...environments.map(env => ({ value: env.id, label: env.name }))
        ]}
        triggerStyle={{
          background: 'var(--bg-secondary)',
          minWidth: '150px'
        }}
      />
      <button
        onClick={() => setEnvManagerOpen(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px'
        }}
        title="Manage Environments"
      >
        ⚙️
      </button>

      {isEnvManagerOpen && <EnvEditorModal onClose={() => setEnvManagerOpen(false)} />}
    </div>
  );
};

interface EnvEditorModalProps {
  onClose: () => void;
}

const EnvEditorModal: React.FC<EnvEditorModalProps> = ({ onClose }) => {
  const { environments, createEnvironment, deleteEnvironment, updateEnvironment } = useEnvironmentStore();
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(environments[0]?.id || null);
  const [newEnvName, setNewEnvName] = useState('');

  const selectedEnv = environments.find(e => e.id === selectedEnvId);

  const handleCreate = async () => {
    if (!newEnvName.trim()) return;
    const id = `env_${Date.now()}`;
    await createEnvironment(id, newEnvName);
    setSelectedEnvId(id);
    setNewEnvName('');
  };

  const handleAddVar = () => {
    if (!selectedEnv) return;
    const newVars = [
      ...selectedEnv.variables,
      {
        id: `var_${Date.now()}`,
        environment_id: selectedEnv.id,
        key: '',
        value: '',
        var_type: 'default',
        enabled: true
      }
    ];
    updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
  };

  const handleUpdateVar = (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    if (!selectedEnv) return;
    const newVars = [...selectedEnv.variables];
    newVars[index] = { ...newVars[index], [field]: val };
    updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
  };

  const handleDeleteVar = (index: number) => {
    if (!selectedEnv) return;
    const newVars = selectedEnv.variables.filter((_, i) => i !== index);
    updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          width: '800px',
          height: '600px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Manage Environments</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '250px',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
              <input
                value={newEnvName}
                onChange={e => setNewEnvName(e.target.value)}
                placeholder="New environment..."
                style={{
                  flex: 1,
                  padding: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={handleCreate}
                style={{
                  padding: '6px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {environments.map(env => (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: selectedEnvId === env.id ? 'var(--bg-hover)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{env.name}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteEnvironment(env.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)'
            }}
          >
            {selectedEnv ? (
              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <h3 style={{ margin: '0 0 16px 0' }}>{selectedEnv.name}</h3>

                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                    marginBottom: '8px',
                    fontWeight: 600,
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ width: '40px', textAlign: 'center' }}>✓</div>
                  <div style={{ flex: 1 }}>VARIABLE</div>
                  <div style={{ flex: 1 }}>VALUE</div>
                  <div style={{ width: '40px' }}></div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                  {selectedEnv.variables.map((v, i) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={e => handleUpdateVar(i, 'enabled', e.target.checked)}
                        />
                      </div>
                      <input
                        value={v.key}
                        onChange={e => handleUpdateVar(i, 'key', e.target.value)}
                        placeholder="Variable Name"
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <input
                        value={v.value}
                        onChange={e => handleUpdateVar(i, 'value', e.target.value)}
                        placeholder="Initial Value"
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <button
                        onClick={() => handleDeleteVar(i)}
                        style={{
                          width: '40px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddVar}
                    style={{
                      marginTop: '16px',
                      padding: '6px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    + Add Variable
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                Select an environment to edit its variables
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
