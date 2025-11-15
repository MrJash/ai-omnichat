
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, ChatMode, Theme } from '../types';
import PromptInput from './PromptInput';
import Message from './Message';
import { generateResponse } from '../services/geminiService';
import { Menu } from './icons';
import { CHAT_MODES } from '../constants';

interface ChatWindowProps {
  session: ChatSession;
  onUpdateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  theme: Theme;
  onToggleSidebar: () => void;
  defaultModel: string;
  customInstruction: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, onUpdateSession, theme, onToggleSidebar, defaultModel, customInstruction }) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [session.messages, isLoading]);
  
  const handleSend = async (prompt: string, file?: File) => {
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        userMessage.file = {
          name: file.name,
          type: file.type,
          data: (reader.result as string).split(',')[1],
        };
        await processMessage(userMessage);
      };
      reader.readAsDataURL(file);
    } else {
      await processMessage(userMessage);
    }
  };

  const processMessage = async (userMessage: ChatMessage) => {
    const updatedMessages = [...session.messages, userMessage];
    const isFirstMessage = session.messages.length === 0;
    const newTitle = isFirstMessage && userMessage.content.length > 0
        ? userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : '')
        : session.title;
    
    onUpdateSession(session.id, { messages: updatedMessages, title: newTitle });
    const sessionForApi = { ...session, messages: updatedMessages, title: newTitle };

    try {
      const response = await generateResponse(userMessage.content, sessionForApi, userMessage.file);
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: response.text,
        grounding: response.grounding,
      };
      onUpdateSession(session.id, { messages: [...updatedMessages, modelMessage] });
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      onUpdateSession(session.id, { messages: [...updatedMessages, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegenerate = async () => {
    const lastUserMessage = session.messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    setIsLoading(true);
    const historyWithoutLastResponse = session.messages.slice(0, -1);
    onUpdateSession(session.id, { messages: historyWithoutLastResponse });
    const sessionForApi = { ...session, messages: historyWithoutLastResponse };

     try {
      const response = await generateResponse(lastUserMessage.content, sessionForApi, lastUserMessage.file);
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: response.text,
        grounding: response.grounding,
      };
      onUpdateSession(session.id, { messages: [...historyWithoutLastResponse, modelMessage] });
    } catch (error) {
      console.error("Error regenerating response:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: `Sorry, I couldn't regenerate the response. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      onUpdateSession(session.id, { messages: [...historyWithoutLastResponse, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustLength = async (adjustment: 'shorter' | 'longer') => {
    setIsLoading(true);
    const historyWithOldResponse = [...session.messages];
    const historyForUiUpdate = session.messages.slice(0, -1);
    
    onUpdateSession(session.id, { messages: historyForUiUpdate });

    const adjustmentPrompt = `Make your last response ${adjustment}.`;
    const sessionForApi = { ...session, messages: historyWithOldResponse };

    try {
        const response = await generateResponse(
            adjustmentPrompt, 
            sessionForApi,
            undefined
        );
        const newModelMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'model',
            content: response.text,
            grounding: response.grounding,
        };
        onUpdateSession(session.id, { messages: [...historyForUiUpdate, newModelMessage] });
    } catch (error) {
        console.error("Error adjusting length:", error);
        onUpdateSession(session.id, { messages: historyWithOldResponse });
    } finally {
        setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: ChatMode) => {
    let newModel: string;
    let newInstruction: string;

    if (newMode === ChatMode.CUSTOM) {
        newModel = defaultModel;
        newInstruction = customInstruction;
    } else {
        newModel = CHAT_MODES[newMode].model;
        newInstruction = CHAT_MODES[newMode].instruction;
    }
    
    onUpdateSession(session.id, {
        mode: newMode,
        model: newModel,
        systemInstruction: newInstruction
    });
  };
  
  return (
    <div className="flex-1 flex flex-col h-full">
       <div className="flex items-center p-2 border-b border-[var(--color-border)] md:hidden bg-[var(--color-bg-secondary)] flex-shrink-0">
        <button onClick={onToggleSidebar} className="p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate ml-2">{session.title}</h2>
      </div>
      <div id="messages" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {session.messages.map((msg, index) => (
          <Message 
            key={msg.id} 
            message={msg} 
            isLastMessage={index === session.messages.length - 1} 
            onRegenerate={handleRegenerate}
            onAdjustLength={handleAdjustLength}
            mode={session.mode}
            theme={theme}
          />
        ))}
         {isLoading && (
            <Message message={{ id: 'loading', role: 'model', content: '', isLoading: true }} isLastMessage={true} onRegenerate={() => {}} onAdjustLength={() => {}} mode={session.mode} theme={theme}/>
          )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-2 md:p-4 bg-[var(--color-bg-primary)]/50 border-t border-[var(--color-border)]">
        <PromptInput onSend={handleSend} isLoading={isLoading} mode={session.mode} onModeChange={handleModeChange} customInstruction={customInstruction} />
      </div>
    </div>
  );
};

export default ChatWindow;
