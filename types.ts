export enum ChatMode {
  AI_ASSISTANT = 'AI Assistant',
  STUDY_MODE = 'Study Mode',
  CODING_MODE = 'Coding Mode',
  FORMAL = 'Formal',
  PRECISE = 'Precise',
  QUICK_CHAT = 'Quick Chat',
  CUSTOM = 'Custom',
}

export type Theme = 'twilight' | 'solaris' | 'midnight-dusk';

// FIX: Made properties optional to match the GroundingChunk type from @google/genai
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    // FIX: Corrected `placeAnswerSources` to be an object instead of an array of objects to match the @google/genai SDK's `GroundingChunk` type.
    placeAnswerSources?: {
      reviewSnippets?: {
        uri?: string;
        title?: string;
        text?: string;
      }[];
    };
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  file?: {
    name:string;
    type: string;
    data: string; // base64
  };
  grounding?: GroundingChunk[];
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: ChatMode;
  model: string;
  systemInstruction: string;
}