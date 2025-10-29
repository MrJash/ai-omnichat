
import { GoogleGenAI, Modality } from '@google/genai';
import { ChatMode, ChatMessage, GroundingChunk } from '../types';
import { CHAT_MODES } from '../constants';

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
  mode: ChatMode,
  history: ChatMessage[],
  file?: { name: string, type: string, data: string },
  location?: { lat: number, lng: number } | null
): Promise<{ text: string, grounding?: GroundingChunk[] }> => {

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    let modelName = CHAT_MODES[mode].model;
    const systemInstruction = CHAT_MODES[mode].instruction;
    let finalPrompt = prompt;

    const parts: any[] = [];
    
    // Handle file upload
    if (file) {
      modelName = 'gemini-2.5-flash';
      if (file.type.startsWith('image/')) {
        parts.push({
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
    parts.push({ text: finalPrompt });

    // Keyword-based routing
    const lowerCasePrompt = prompt.toLowerCase();
    const useSearch = /\b(latest|recent|current|news|who won)\b/.test(lowerCasePrompt);
    const useMaps = /\b(near me|nearby|directions|restaurants|hotels|locations)\b/.test(lowerCasePrompt);
    const useImageGen = /\b(draw|generate|create an image|picture of)\b/.test(lowerCasePrompt) && !file;
    const useFlowchart = /\b(flowchart|diagram)\b/.test(lowerCasePrompt);

    const tools: any[] = [];
    const toolConfig: any = {};
    if (useMaps) {
        tools.push({ googleMaps: {} });
        if(location) {
            toolConfig.retrievalConfig = { latLng: { latitude: location.lat, longitude: location.lng }};
        }
    }
    if (useSearch && !useMaps) { // Can be combined but let's prioritize maps if keywords for both exist
        tools.push({ googleSearch: {} });
    }

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

    if (useFlowchart) {
        finalPrompt = `Create a flowchart based on this request: "${prompt}". Use Mermaid.js syntax. Only output the Mermaid code inside a \`\`\`mermaid block.`;
        parts.pop(); // remove original prompt part
        parts.push({text: finalPrompt});
    }

    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
    contents.push({ role: 'user', parts });


    const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
            systemInstruction,
            tools,
            toolConfig
        }
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    return { text: response.text, grounding: groundingChunks };
};
