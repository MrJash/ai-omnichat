
import React, { useState, useRef, useEffect } from 'react';
import { ChatMode } from '../types';
import { ChevronDown } from './icons';

interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  customInstruction: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onModeChange, customInstruction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (mode: ChatMode) => {
    onModeChange(mode);
    setIsOpen(false);
  }

  const availableModes = Object.values(ChatMode).filter(mode => {
      if (mode === ChatMode.CUSTOM) {
          // Only show 'Custom' mode if a custom instruction is set
          return customInstruction && customInstruction.trim() !== '';
      }
      return true;
  });

  return (
    <div ref={wrapperRef} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center py-2 px-3 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)] rounded-md hover:bg-[var(--color-bg-hover)]/80 focus:outline-none"
      >
        {selectedMode}
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-48 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md shadow-lg z-10">
          {availableModes.map((mode) => (
            <button
              key={mode}
              onClick={() => handleSelect(mode)}
              className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
