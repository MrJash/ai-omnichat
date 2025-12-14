import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ChatMode, Theme } from '../types';
import Flowchart from './Flowchart';
import ResponseActions from './ResponseActions';
import { User, Bot, Globe, MapPin, File, Image as ImageIcon, Loader, Clipboard, Check } from './icons';

interface MessageProps {
  message: ChatMessage;
  isLastMessage: boolean;
  onRegenerate: () => void;
  onAdjustLength: (adjustment: 'shorter' | 'longer') => void;
  mode: ChatMode;
  theme: Theme;
}


// New component for rendering code blocks
interface CodeBlockProps {
  language: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-md my-2 text-left">
      <div className="flex justify-between items-center px-4 py-1.5 bg-[var(--color-bg-tertiary)]/50 rounded-t-md">
        <span className="text-xs text-[var(--color-text-secondary)] font-sans">{language}</span>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" />
              Copy code
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto"><code className={`language-${language}`}>{children}</code></pre>
    </div>
  );
};

const Message: React.FC<MessageProps> = ({ message, isLastMessage, onRegenerate, onAdjustLength, mode, theme }) => {
  // FIX: Define isModel based on the message role.
  const isModel = message.role === 'model';
  const isLightTheme = theme === 'solaris';

  const renderers = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      
      if (match && match[1] === 'mermaid') {
        return <Flowchart chart={String(children)} />;
      }

      if (inline) {
        return (
          <code className="bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] px-1 py-0.5 rounded font-mono text-sm" {...props}>
            {children}
          </code>
        );
      }

      return !inline && match ? (
        <CodeBlock language={match[1]}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      ) : (
        <CodeBlock language="text">
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    },
  }), []);

  const filePreview = message.file ? (
    <div className="mt-2 p-2 bg-[var(--color-bg-secondary)]/50 rounded-lg max-w-xs">
      <p className="text-sm font-medium flex items-center gap-2">
        {message.file.type.startsWith('image/') 
            ? <ImageIcon className="w-4 h-4 text-[var(--color-text-secondary)]" /> 
            : <File className="w-4 h-4 text-[var(--color-text-secondary)]" />}
        {message.file.name}
      </p>
      {message.file.type.startsWith('image/') && (
        <img src={`data:${message.file.type};base64,${message.file.data}`} alt="Uploaded content" className="mt-2 rounded-md max-h-48" />
      )}
    </div>
  ) : null;

  const groundingInfo = message.grounding?.length ? (
     <div className="mt-4 border-t border-[var(--color-border)] pt-2">
       <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Sources:</h4>
       <div className="flex flex-wrap gap-2">
         {message.grounding.map((chunk, index) => {
            if (chunk.web && chunk.web.uri) {
              return <a key={`web-${index}`} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] px-2 py-1 rounded-md flex items-center gap-1.5"><Globe className="w-3 h-3" />{chunk.web.title || new URL(chunk.web.uri).hostname}</a>
            }
            if (chunk.maps && chunk.maps.uri) {
              return <a key={`map-${index}`} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] px-2 py-1 rounded-md flex items-center gap-1.5"><MapPin className="w-3 h-3" />{chunk.maps.title || 'Map Link'}</a>
            }
            return null;
         })}
       </div>
     </div>
  ) : null;

  return (
    <div className={`flex items-start gap-4 ${!isModel && 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)]'}`}>
        {isModel ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-[var(--color-text-primary)]" />}
      </div>
      <div className={`max-w-4xl p-4 rounded-lg shadow-md ${isModel ? 'bg-[var(--color-model-message-bg)]' : 'bg-[var(--color-user-message-bg)]'}`}>
        {message.isLoading ? (
          <div className="flex items-center gap-2">
             <Loader className="w-5 h-5 animate-spin"/>
             <span className="text-[var(--color-text-secondary)]">Generating...</span>
          </div>
        ) : (
          <>
            <div className={`prose prose-sm max-w-none ${!isLightTheme && 'prose-invert'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                {message.content}
              </ReactMarkdown>
            </div>
            {filePreview}
            {groundingInfo}
            {isModel && isLastMessage && (
              <ResponseActions 
                onRegenerate={onRegenerate}
                onAdjustLength={onAdjustLength}
                messageContent={message.content}
                mode={mode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;