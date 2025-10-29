
import React, { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, ChatMode, Theme } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { CHAT_MODES } from './constants';
import { MessageSquarePlus } from './components/icons';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('twilight');

  useEffect(() => {
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
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    if (activeSessionId) {
      localStorage.setItem('activeChatSessionId', activeSessionId);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    localStorage.setItem('chatTheme', theme);
  }, [theme]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      mode: ChatMode.AI_ASSISTANT,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

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

  const handleUpdateSession = (sessionId: string, updatedMessages: ChatMessage[], newMode?: ChatMode, newTitle?: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: newTitle || s.title,
            messages: updatedMessages,
            mode: newMode || s.mode,
          };
        }
        return s;
      })
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

  return (
    <div className={`theme-${theme} flex h-screen font-sans antialiased`}>
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectChat={setActiveSessionId}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameSession}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="flex-1 flex flex-col bg-[var(--color-bg-secondary)]">
        {activeSession ? (
          <ChatWindow key={activeSession.id} session={activeSession} onUpdateSession={handleUpdateSession} theme={theme} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
            <MessageSquarePlus className="w-16 h-16 mb-4" />
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Welcome to AI OmniChat</h1>
            <p className="mt-2">Start a new conversation from the sidebar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
