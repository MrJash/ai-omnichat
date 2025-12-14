
import React, { useState, useRef, useEffect } from 'react';
import { ChatMode } from '../types';
import ModeSelector from './ModeSelector';
import { Send, Paperclip, XCircle, File as FileIcon, Image as ImageIcon } from './icons';

interface PromptInputProps {
  onSend: (prompt: string, file?: File) => void;
  isLoading: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  customInstruction: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, mode, onModeChange, customInstruction }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSendClick = () => {
    if ((prompt.trim() || file) && !isLoading) {
      onSend(prompt, file || undefined);
      setPrompt('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const removeFile = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {file && (
        <div className="bg-[var(--color-bg-tertiary)] p-2 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-[var(--color-text-secondary)]" /> : <FileIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />}
            <span className="font-medium">{file.name}</span>
            <span className="text-[var(--color-text-secondary)]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button onClick={removeFile} className="p-1 rounded-full hover:bg-[var(--color-bg-hover)]">
            <XCircle className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
      )}
      <div className={`relative flex items-center gap-2 p-2 bg-[var(--color-bg-tertiary)] ${file ? 'rounded-b-lg' : 'rounded-lg'}`}>
        <ModeSelector selectedMode={mode} onModeChange={onModeChange} customInstruction={customInstruction} />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors">
            <Paperclip className="w-5 h-5" />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message or upload a file..."
          className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none resize-none max-h-48 px-2"
          rows={1}
          disabled={isLoading}
        />

        <button
          onClick={handleSendClick}
          disabled={isLoading || (!prompt.trim() && !file)}
          className="p-2 rounded-full bg-[var(--color-accent)] text-white disabled:bg-[var(--color-bg-hover)] disabled:cursor-not-allowed hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PromptInput;
