
import React, { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, ChatMode, Theme } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { CHAT_MODES } from './constants';
import { MessageSquarePlus, TriangleAlert, Menu } from './components/icons';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('twilight');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User Settings
  const [defaultModel, setDefaultModel] = useState('gemini-2.5-flash');
  const [customInstruction, setCustomInstruction] = useState('');

  useEffect(() => {
    if (!process.env.API_KEY || process.env.API_KEY.trim() === '') {
      setApiKeyError('API_KEY is not configured. Please set the API_KEY environment variable in your deployment settings.');
      return;
    }

    // Load settings from localStorage
    const savedModel = localStorage.getItem('defaultModel');
    if (savedModel) setDefaultModel(savedModel);
    const savedInstruction = localStorage.getItem('customInstruction');
    if (savedInstruction) setCustomInstruction(savedInstruction);

    const savedTheme = localStorage.getItem('chatTheme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
      const savedActiveId = localStorage.getItem('activeChatSessionId');
      setActiveSessionId(savedActiveId);
    } else {
      handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiKeyError) return;
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    if (activeSessionId) {
      localStorage.setItem('activeChatSessionId', activeSessionId);
    }
  }, [sessions, activeSessionId, apiKeyError]);

  useEffect(() => {
    localStorage.setItem('chatTheme', theme);
  }, [theme]);

  const handleSaveSettings = (model: string, instruction: string) => {
    setDefaultModel(model);
    localStorage.setItem('defaultModel', model);
    setCustomInstruction(instruction);
    localStorage.setItem('customInstruction', instruction);
    setIsSettingsOpen(false);

    // If instruction is cleared, revert any 'Custom' sessions to 'AI Assistant'
    if (!instruction || instruction.trim() === '') {
      setSessions(prev =>
        prev.map(s => {
          if (s.mode === ChatMode.CUSTOM) {
            const aiAssistantConfig = CHAT_MODES[ChatMode.AI_ASSISTANT];
            return { 
                ...s, 
                mode: ChatMode.AI_ASSISTANT,
                model: aiAssistantConfig.model,
                systemInstruction: aiAssistantConfig.instruction,
            };
          }
          return s;
        })
      );
    }
  };

  const handleNewChat = useCallback(() => {
    const hasCustomInstruction = customInstruction && customInstruction.trim() !== '';
    const newSessionMode = hasCustomInstruction ? ChatMode.CUSTOM : ChatMode.AI_ASSISTANT;
    const modeConfig = hasCustomInstruction
// FIX: Changed `systemInstruction` to `instruction` to match the property name used by `CHAT_MODES`, resolving a TypeScript error.
        ? { model: defaultModel, instruction: customInstruction }
        : CHAT_MODES[ChatMode.AI_ASSISTANT];

    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      mode: newSessionMode,
      model: modeConfig.model,
      systemInstruction: modeConfig.instruction,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [defaultModel, customInstruction]);

  const handleDeleteChat = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      if (remainingSessions.length === 0) {
        handleNewChat();
      }
    }
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, title: newTitle };
        }
        return s;
      })
    );
  };
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  if (apiKeyError) {
    return (
      <div className={`theme-${theme} flex h-screen font-sans antialiased items-center justify-center p-4 bg-[var(--color-bg-primary)]`}>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-8 max-w-lg text-center">
          <TriangleAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Configuration Error</h1>
          <p className="text-[var(--color-text-secondary)]">
            {apiKeyError}
          </p>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]/80">
            Once configured, please refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`theme-${theme} flex h-screen font-sans antialiased overflow-hidden`}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={() => {
            handleNewChat();
            setIsSidebarOpen(false);
          }}
          onSelectChat={(id) => {
            setActiveSessionId(id);
            setIsSidebarOpen(false);
          }}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameSession}
          theme={theme}
          onThemeChange={setTheme}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <main className="flex-1 flex flex-col bg-[var(--color-bg-secondary)] relative min-w-0">
          {activeSession ? (
            <ChatWindow 
              key={activeSession.id} 
              session={activeSession} 
              onUpdateSession={handleUpdateSession} 
              theme={theme} 
              onToggleSidebar={() => setIsSidebarOpen(true)}
              defaultModel={defaultModel}
              customInstruction={customInstruction}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] text-center p-4">
               <div className="absolute top-0 left-0 p-4 md:hidden">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
                      <Menu className="w-6 h-6" />
                  </button>
              </div>
              <MessageSquarePlus className="w-16 h-16 mb-4" />
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Welcome to AI OmniChat</h1>
              <p className="mt-2">Start a new conversation from the sidebar.</p>
            </div>
          )}
        </main>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentModel={defaultModel}
        currentInstruction={customInstruction}
      />
    </>
  );
};

export default App;
