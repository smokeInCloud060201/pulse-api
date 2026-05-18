import React, { useRef, useState, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUiStore } from '../../stores/uiStore';
import './EnvInput.css';

interface EnvInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EnvInput: React.FC<EnvInputProps> = ({ value, onChange, className = '', style, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { setEnvManagerOpen } = useUiStore();
  
  const [hoveredVar, setHoveredVar] = useState<{ key: string; value: string; rect: DOMRect } | null>(null);

  // Sync scroll position between input and overlay
  const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Find value in active environment
  const resolveVariable = (key: string): string => {
    if (!activeEnvironmentId) return 'No environment selected';
    const env = environments.find(e => e.id === activeEnvironmentId);
    if (!env) return 'Environment not found';
    const variable = env.variables.find(v => v.key === key && v.enabled);
    return variable ? variable.value : 'Unresolved variable';
  };

  // Parse text into regular text and variables
  const renderOverlay = () => {
    const parts = value.split(/(\{\{[^}]+\}\})/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2);
        return (
          <span
            key={index}
            className="env-var"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredVar({ key, value: resolveVariable(key), rect });
            }}
            onMouseLeave={() => setHoveredVar(null)}
            onClick={() => {
              setHoveredVar(null);
              setEnvManagerOpen(true);
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`env-input-container ${className}`} style={style}>
      <div className="env-input-overlay" ref={scrollRef}>
        {renderOverlay()}
        {/* Invisible spacer to match input padding/width properly */}
        <span style={{ paddingRight: '2px' }}></span>
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        className="env-input-field"
        spellCheck={false}
        {...props}
      />

      {hoveredVar && (
        <div 
          className="env-input-tooltip"
          style={{
            top: `${hoveredVar.rect.bottom + window.scrollY + 5}px`,
            left: `${hoveredVar.rect.left + window.scrollX}px`,
          }}
        >
          <div className="tooltip-key">{hoveredVar.key}</div>
          <div className="tooltip-value">{hoveredVar.value}</div>
          <div className="tooltip-hint">Click to edit</div>
        </div>
      )}
    </div>
  );
};
