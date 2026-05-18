import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Dropdown.css';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
  triggerStyle?: React.CSSProperties;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, style, className, triggerStyle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`custom-dropdown ${className || ''}`} ref={dropdownRef} style={style}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        style={triggerStyle}
      >
        <span className="custom-dropdown-label">{selectedOption?.label}</span>
        <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-dropdown-item ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
