import React from 'react';
import { KeyValuePair } from '../../types/request';
import { Trash2, Plus, FileUp } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { Dropdown } from '../ui/Dropdown';
import './RequestEditor.css';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  allowFileTypes?: boolean;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, onChange, allowFileTypes = false }) => {
  const updateItem = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { key: '', value: '', enabled: true, value_type: 'text' }]);
  };

  const handleSelectFile = async (index: number) => {
    try {
      const selected = await open({
        multiple: false,
        title: 'Select a file'
      });
      if (selected && typeof selected === 'string') {
        updateItem(index, 'value', selected);
      }
    } catch (e) {
      console.error('Failed to open file picker', e);
    }
  };

  return (
    <div className="kv-editor">
      <div className="kv-header">
        <div className="kv-col-check"></div>
        <div className="kv-col-key">Key</div>
        <div className="kv-col-value">Value</div>
        <div className="kv-col-action"></div>
      </div>

      {items.map((item, i) => (
        <div key={i} className="kv-row">
          <div className="kv-col-check">
            <input type="checkbox" checked={item.enabled} onChange={e => updateItem(i, 'enabled', e.target.checked)} />
          </div>
          <div className="kv-col-key" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={e => updateItem(i, 'key', e.target.value)}
              className="kv-input"
              style={{ flex: 1 }}
            />
            {allowFileTypes && (
              <Dropdown
                value={item.value_type || 'text'}
                onChange={(value) => updateItem(i, 'value_type', value)}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'file', label: 'File' },
                ]}
                className="kv-type-select"
                style={{ width: '70px', flexShrink: 0 }}
                triggerStyle={{ padding: '0 8px', height: '100%', border: 'none', backgroundColor: 'transparent' }}
              />
            )}
          </div>
          <div className="kv-col-value" style={{ display: 'flex', alignItems: 'center' }}>
            {allowFileTypes && item.value_type === 'file' ? (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                <input
                  type="text"
                  placeholder="Select a file..."
                  value={item.value || ''}
                  readOnly
                  onClick={() => handleSelectFile(i)}
                  className="kv-input"
                  style={{ cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
                />
                <button 
                  className="icon-btn-small" 
                  onClick={() => handleSelectFile(i)}
                  style={{ color: 'hsl(var(--text-muted))', marginRight: '8px' }}
                >
                  <FileUp size={16} />
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Value"
                value={item.value}
                onChange={e => updateItem(i, 'value', e.target.value)}
                className="kv-input"
              />
            )}
          </div>
          <div className="kv-col-action">
            <button className="icon-btn-small" onClick={() => removeItem(i)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="kv-row add-row">
        <button className="text-btn" onClick={addItem}>
          <Plus size={14} style={{ marginRight: 4 }} /> Add Row
        </button>
      </div>
    </div>
  );
};
