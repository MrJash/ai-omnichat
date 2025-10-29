
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ArrowUpDown } from './icons';
import { ChatMode } from '../types';

interface ResponseActionsProps {
    onRegenerate: () => void;
    onAdjustLength: (adjustment: 'shorter' | 'longer') => void;
    messageContent: string;
    mode: ChatMode;
}

const ResponseActions: React.FC<ResponseActionsProps> = ({ onRegenerate, onAdjustLength, messageContent, mode }) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const adjustRef = useRef<HTMLDivElement>(null);
  
  const showAdjust = mode === ChatMode.STUDY_MODE && messageContent.split('\n').length > 5;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adjustRef.current && !adjustRef.current.contains(event.target as Node)) {
        setIsAdjusting(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [adjustRef]);

  const handleAdjustClick = (adjustment: 'shorter' | 'longer') => {
    onAdjustLength(adjustment);
    setIsAdjusting(false);
  }

  return (
    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[var(--color-border)]/50">
      <button onClick={onRegenerate} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded">
        <RefreshCw className="w-3.5 h-3.5" />
        Regenerate
      </button>

      {showAdjust && (
        <div className="relative" ref={adjustRef}>
            <button onClick={() => setIsAdjusting(!isAdjusting)} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Adjust Length
            </button>
            {isAdjusting && (
                <div className="absolute bottom-full mb-2 w-28 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md shadow-lg z-10">
                    <button onClick={() => handleAdjustClick('shorter')} className="block w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]">Shorter</button>
                    <button onClick={() => handleAdjustClick('longer')} className="block w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]">Longer</button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ResponseActions;
