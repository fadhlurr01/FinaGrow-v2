
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  // This is a fallback for development, but the environment variable should be set.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAIFinancialAdvice = async (prompt: string, context: string): Promise<string> => {
  try {
    const fullPrompt = `
      As a world-class financial analyst AI for the FINAGROW Financial Management & Growth System, your name is FINAGROW AI.
      Your goal is to provide insightful, clear, and actionable financial advice based on the user's query and the current financial context.
      Do not provide generic advice. Be specific and data-driven where possible.
      Format your response in clean Markdown.

      **Current Financial Context:**
      ${context}

      **User's Question:**
      "${prompt}"

      **Your Analysis and Advice:**
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.5,
        topP: 0.95,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I encountered an error while analyzing your request. Please check your API key configuration and try again. It's possible the content was blocked due to safety settings.";
  }
};
