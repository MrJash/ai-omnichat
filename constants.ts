import { ChatMode } from './types';

export const CHAT_MODES: Record<ChatMode, { instruction: string; model: string; }> = {
  [ChatMode.AI_ASSISTANT]: {
    instruction: "You are a helpful and friendly AI assistant. Be conversational and provide detailed explanations.",
    model: "gemini-2.5-flash",
  },
  [ChatMode.STUDY_MODE]: {
    instruction: "You are a knowledgeable study partner. Break down complex topics into simple concepts and quiz the user.",
    model: "gemini-2.5-flash",
  },
  [ChatMode.CODING_MODE]: {
    instruction: "You are an expert coding assistant. Provide clean, efficient, and well-documented code. Explain complex concepts clearly. When asked to generate code, only output the code itself inside a formatted code block.",
    model: "gemini-2.5-pro",
  },
  [ChatMode.FORMAL]: {
    instruction: "You are a professional assistant. Your responses should be formal, well-structured, and use professional language.",
    model: "gemini-2.5-flash",
  },
  [ChatMode.PRECISE]: {
    instruction: "You are a precise and concise AI. Provide direct, to-the-point answers with minimal fluff.",
    model: "gemini-2.5-flash",
  },
  [ChatMode.QUICK_CHAT]: {
    instruction: "You are an AI optimized for speed. Provide quick and brief answers.",
    model: "gemini-flash-lite-latest",
  },
  [ChatMode.CUSTOM]: {
    instruction: "Follow the user's custom instructions.",
    model: "gemini-2.5-flash",
  }
};