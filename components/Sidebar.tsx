
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Theme } from '../types';
import { PlusCircle, MessageSquare, Trash2, Pencil, X, Settings } from './icons';
import ThemeSwitcher from './ThemeSwitcher';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onNewChat, onSelectChat, onDeleteChat, onRenameChat, theme, onThemeChange, isOpen, onClose, onOpenSettings }) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartRename = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setTempTitle(session.title);
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setTempTitle('');
  };

  const handleConfirmRename = () => {
    if (editingSessionId && tempTitle.trim()) {
      onRenameChat(editingSessionId, tempTitle.trim());
    }
    handleCancelRename();
  };


  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden" 
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-[var(--color-bg-primary)] flex flex-col p-2 border-r border-[var(--color-border)] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-64`}>
        <div className="flex items-center justify-between p-2 mb-4">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">OmniChat</h1>
          <div className="flex items-center">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white bg-[var(--color-accent)] rounded-md hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-accent)] transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto pr-1">
          <nav className="space-y-1">
            {sessions.map(session => (
              <div key={session.id} className="group relative">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (editingSessionId !== session.id) onSelectChat(session.id); }}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 mr-3 flex-shrink-0" />
                  {editingSessionId === session.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={handleConfirmRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 w-0 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-1 -ml-1 text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  ) : (
                    <span className="truncate flex-1 text-left">{session.title}</span>
                  )}
                </a>
                 <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-opacity ${editingSessionId === session.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                   <button
                     onClick={(e) => { e.stopPropagation(); handleStartRename(session); }}
                     className="p-1 text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                     aria-label="Rename chat"
                     disabled={!!editingSessionId}
                   >
                     <Pencil className="w-4 h-4" />
                   </button>
                   <button
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
                    className="p-1 text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                 </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="p-2 mt-auto text-xs text-gray-500 space-y-2">
          <ThemeSwitcher currentTheme={theme} onThemeChange={onThemeChange} />
          <p className="pt-2 text-center text-[var(--color-text-secondary)]/50">Powered by Gemini</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
