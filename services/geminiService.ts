
import { GoogleGenAI, Modality } from '@google/genai';
import { ChatSession, GroundingChunk, ChatMessage } from '../types';

declare const pdfjsLib: any;

const extractPdfText = async (fileData: string): Promise<string> => {
  const pdfData = atob(fileData);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  let textContent = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((s: any) => s.str).join(' ');
  }
  return textContent;
};


export const generateResponse = async (
  prompt: string,
  session: ChatSession,
  file?: { name: string, type: string, data: string }
): Promise<{ text: string, grounding?: GroundingChunk[] }> => {

    if (!process.env.API_KEY || process.env.API_KEY.trim() === '') {
      throw new Error("API_KEY is not set. Please configure the API_KEY environment variable in your deployment settings.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let modelName = session.model;
      const systemInstruction = session.systemInstruction;
      let finalPrompt = prompt;

      // Keyword-based routing
      const lowerCasePrompt = prompt.toLowerCase();
      const useSearch = /\b(latest|recent|current|news|who won)\b/.test(lowerCasePrompt);
      const useMaps = /\b(near me|nearby|directions|restaurants|hotels|locations)\b/.test(lowerCasePrompt);
      const useImageGen = /\b(draw|generate|create an image|picture of)\b/.test(lowerCasePrompt) && !file;
      const useFlowchart = /\b(flowchart|diagram)\b/.test(lowerCasePrompt);

      if(useImageGen) {
          const imageResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: prompt }] },
              config: { responseModalities: [Modality.IMAGE] }
          });

          const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imagePart?.inlineData) {
              const base64Image = imagePart.inlineData.data;
              const mimeType = imagePart.inlineData.mimeType;
              return { text: `![Generated Image](data:${mimeType};base64,${base64Image})` };
          }
          return { text: "Sorry, I couldn't generate an image for that prompt." };
      }

      // Process history to include files
      const historyContents = session.messages.slice(0, -1).map(msg => {
        const parts: any[] = [];
        if (msg.file && msg.file.type.startsWith('image/')) {
          parts.push({
            inlineData: {
              mimeType: msg.file.type,
              data: msg.file.data,
            }
          });
        }
        parts.push({ text: msg.content });
        return { role: msg.role, parts };
      });
      
      const currentUserParts: any[] = [];
      
      // Handle current file upload
      if (file) {
        modelName = 'gemini-2.5-flash';
        if (file.type.startsWith('image/')) {
          currentUserParts.push({
            inlineData: {
              mimeType: file.type,
              data: file.data
            }
          });
        } else if (file.type === 'application/pdf') {
          try {
            const pdfText = await extractPdfText(file.data);
            finalPrompt = `User has uploaded a PDF named "${file.name}" with the following content: \n\n<pdf_content>\n${pdfText}\n</pdf_content>\n\nUser's prompt is: ${prompt}`;
          } catch (e) {
            console.error("PDF processing error", e);
            return { text: "Sorry, I couldn't process the PDF file. It might be corrupted or in an unsupported format." };
          }
        }
      }
      
      if (useFlowchart) {
          finalPrompt = `Create a flowchart based on this request: "${prompt}". Use Mermaid.js syntax. Only output the Mermaid code inside a \`\`\`mermaid block.`;
      }

      currentUserParts.push({ text: finalPrompt });
      const contents = [...historyContents, { role: 'user', parts: currentUserParts }];

      const tools: any[] = [];
      if (useMaps) {
          tools.push({ googleMaps: {} });
      }
      if (useSearch && !useMaps) { // Can be combined but let's prioritize maps if keywords for both exist
          tools.push({ googleSearch: {} });
      }

      const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
              systemInstruction,
              tools,
          }
      });

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];

      return { text: response.text, grounding: groundingChunks };
    } catch(error) {
        console.error("Gemini API Error:", error);
        
        const friendlyErrorMessage = "You may have exceeded your API quota or have a billing issue. This can happen with features like image analysis on a free-tier plan. Please check your Google AI Studio account and ensure billing is enabled for your API key. For more details, visit [ai.google.dev/gemini-api/docs/billing](https://ai.google.dev/gemini-api/docs/billing).";

        if (error instanceof Error) {
            const errorMessageLower = error.message.toLowerCase();
            const errorNameLower = error.name.toLowerCase();
            
            if (errorMessageLower.includes('quota') || 
                errorNameLower.includes('quota') || 
                errorMessageLower.includes('billing')) {
                throw new Error(friendlyErrorMessage);
            }
        }
        
        // Fallback for non-Error objects or other formats
        const errorString = String(error).toLowerCase();
        if (errorString.includes('quota') || errorString.includes('billing')) {
            throw new Error(friendlyErrorMessage);
        }
        
        throw error;
    }
};