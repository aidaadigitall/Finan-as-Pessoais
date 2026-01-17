
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, AIRule } from "../types";

// The API key must be obtained exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinancialInput = async (
  textInput: string | null,
  mediaFile: File | null,
  availableCategories: Category[],
  userRules: AIRule[] = []
) => {
  try {
    const parts: any[] = [];
    if (textInput) {
      parts.push({ text: textInput });
    }
    
    // Gemini 3 Flash is recommended for basic text/structured tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: parts.length > 0 ? parts : [{ text: "Análise de transação financeira" }] },
      config: {
        systemInstruction: `Você é o FinAI, assistente financeiro. Analise o input e retorne APENAS um JSON: { "isTransaction": boolean, "transactionDetails": { "description": string, "amount": number, "type": "income"|"expense", "category": string }, "responseMessage": string }. Use as categorias: ${JSON.stringify(availableCategories.map(c => c.name))}`,
        responseMimeType: "application/json",
      }
    });

    // Access .text property directly (not a method)
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return { isTransaction: false, responseMessage: "Erro ao processar com IA. Verifique sua conexão e chave de API." };
  }
};

export const getFinancialAdvice = async (
  prompt: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  try {
    const context = `Histórico recente: ${JSON.stringify(transactions.slice(0, 10))}. Categorias: ${JSON.stringify(categories)}`;
    
    // Gemini 3 Pro is recommended for complex reasoning/advice
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ text: `${context}\n\nUsuário: ${prompt}` }],
      config: {
        systemInstruction: "Você é um consultor financeiro especialista. Forneça insights curtos, práticos e baseados em dados em Português.",
      }
    });

    // Access .text property directly
    return response.text;
  } catch (error) {
    console.error("Advice Error:", error);
    return "Não foi possível gerar conselhos no momento.";
  }
};
