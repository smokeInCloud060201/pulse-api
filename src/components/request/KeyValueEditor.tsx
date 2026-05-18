import React from 'react';
import { KeyValuePair } from '../../types/request';
import { Trash2, Plus } from 'lucide-react';
import './RequestEditor.css';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, onChange }) => {
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
    onChange([...items, { key: '', value: '', enabled: true }]);
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
          <div className="kv-col-key">
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={e => updateItem(i, 'key', e.target.value)}
              className="kv-input"
            />
          </div>
          <div className="kv-col-value">
            <input
              type="text"
              placeholder="Value"
              value={item.value}
              onChange={e => updateItem(i, 'value', e.target.value)}
              className="kv-input"
            />
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
