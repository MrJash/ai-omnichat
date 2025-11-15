import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, ChatMode, Theme } from '../types';
import PromptInput from './PromptInput';
import Message from './Message';
import { generateResponse } from '../services/geminiService';

interface ChatWindowProps {
  session: ChatSession;
  onUpdateSession: (sessionId: string, updatedMessages: ChatMessage[], newMode?: ChatMode, newTitle?: string) => void;
  theme: Theme;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, onUpdateSession, theme }) => {
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
    const newTitle = session.messages.length === 0 ? userMessage.content.substring(0, 30) + '...' : session.title;
    
    onUpdateSession(session.id, updatedMessages, session.mode, newTitle);

    try {
      const response = await generateResponse(userMessage.content, session.mode, updatedMessages.slice(0, -1), userMessage.file);
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: response.text,
        grounding: response.grounding,
      };
      onUpdateSession(session.id, [...updatedMessages, modelMessage], session.mode, newTitle);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      onUpdateSession(session.id, [...updatedMessages, errorMessage], session.mode, newTitle);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegenerate = async () => {
    const lastUserMessage = session.messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    setIsLoading(true);
    const historyWithoutLastResponse = session.messages.slice(0, -1);
    onUpdateSession(session.id, historyWithoutLastResponse);

     try {
      const response = await generateResponse(lastUserMessage.content, session.mode, historyWithoutLastResponse.slice(0, -1), lastUserMessage.file);
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: response.text,
        grounding: response.grounding,
      };
      onUpdateSession(session.id, [...historyWithoutLastResponse, modelMessage]);
    } catch (error) {
      console.error("Error regenerating response:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: `Sorry, I couldn't regenerate the response. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      onUpdateSession(session.id, [...historyWithoutLastResponse, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustLength = async (adjustment: 'shorter' | 'longer') => {
    setIsLoading(true);
    const historyWithOldResponse = [...session.messages];
    const historyForUiUpdate = session.messages.slice(0, -1);
    
    onUpdateSession(session.id, historyForUiUpdate);

    const adjustmentPrompt = `Make your last response ${adjustment}.`;

    try {
        const response = await generateResponse(
            adjustmentPrompt, 
            session.mode, 
            historyWithOldResponse,
            undefined
        );
        const newModelMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'model',
            content: response.text,
            grounding: response.grounding,
        };
        onUpdateSession(session.id, [...historyForUiUpdate, newModelMessage]);
    } catch (error) {
        console.error("Error adjusting length:", error);
        onUpdateSession(session.id, historyWithOldResponse);
    } finally {
        setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: ChatMode) => {
    onUpdateSession(session.id, session.messages, newMode);
  };
  
  return (
    <div className="flex-1 flex flex-col h-full">
      <div id="messages" className="flex-1 overflow-y-auto p-6 space-y-6">
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
      <div className="p-4 bg-[var(--color-bg-primary)]/50 border-t border-[var(--color-border)]">
        <PromptInput onSend={handleSend} isLoading={isLoading} mode={session.mode} onModeChange={handleModeChange} />
      </div>
    </div>
  );
};

export default ChatWindow;