import React, { useState, useEffect } from 'react';
import { X } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: string, instruction: string) => void;
  currentModel: string;
  currentInstruction: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentModel, currentInstruction }) => {
  const [model, setModel] = useState(currentModel);
  const [instruction, setInstruction] = useState(currentInstruction);

  useEffect(() => {
    setModel(currentModel);
    setInstruction(currentInstruction);
  }, [isOpen, currentModel, currentInstruction]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(model, instruction);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Settings</h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="default-model" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Default Model for New Chats
            </label>
            <select
              id="default-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>

          <div>
            <label htmlFor="custom-instruction" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Custom System Instruction
            </label>
            <textarea
              id="custom-instruction"
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., You are a helpful assistant that always replies in verse."
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
            />
            <p className="text-xs text-[var(--color-text-secondary)]/80 mt-1">This instruction will be used for any new chats you create.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)]/50 rounded-md hover:bg-[var(--color-bg-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-accent)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] rounded-md hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-accent)]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
