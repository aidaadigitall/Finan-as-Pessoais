
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, AIRule } from "../types";

// Função auxiliar para obter a instância da IA com a chave mais recente
const getAIClient = () => {
  // Tenta pegar do ambiente (desenvolvimento) ou do localStorage (configuração do usuário)
  const apiKey = localStorage.getItem('finai_api_key_gemini') || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key não configurada. Vá em Configurações > Chaves de API.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinancialInput = async (
  textInput: string | null,
  mediaFile: File | null,
  availableCategories: Category[],
  userRules: AIRule[] = []
) => {
  try {
    const ai = getAIClient();
    const parts: any[] = [];
    
    // 1. Processamento de Regras Manuais (Override)
    // Se o texto contiver uma palavra-chave definida pelo usuário, forçamos a categoria.
    let forcedCategory: string | null = null;
    if (textInput && userRules.length > 0) {
        const lowerInput = textInput.toLowerCase();
        const rule = userRules.find(r => lowerInput.includes(r.keyword.toLowerCase()));
        if (rule) {
            forcedCategory = rule.category;
        }
    }

    if (textInput) {
      parts.push({ text: textInput });
    }
    
    // Convertendo imagem para base64 se houver (lógica simplificada para o SDK novo)
    if (mediaFile) {
        const base64Data = await fileToGenerativePart(mediaFile);
        parts.push(base64Data);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Modelo mais rápido e eficiente atual
      contents: { parts: parts.length > 0 ? parts : [{ text: "Análise de transação financeira" }] },
      config: {
        systemInstruction: `Você é o FinAI, um assistente financeiro.
        
        SEU OBJETIVO:
        Identificar se o usuário relatou uma transação (gasto, ganho, transferência).

        LISTA DE CATEGORIAS VÁLIDAS: 
        ${JSON.stringify(availableCategories.map(c => c.name))}

        ${forcedCategory ? `ATENÇÃO: Para este input, o usuário definiu uma REGRA DE OURO. A categoria DEVE ser estritamente "${forcedCategory}", independentemente do que você acha.` : ''}

        DIRETRIZES:
        1. Se for transação, "isTransaction": true.
        2. Extraia valor (amount), descrição (description), tipo (income/expense) e categoria.
        3. Se a data for mencionada (ex: "ontem", "hoje", "dia 15"), tente inferir (mas o front cuidará da data exata).
        4. Se for parcelado (ex: "12x", "parcelado em 3 vezes"), extraia installmentCount.
        5. "responseMessage" deve ser curta e amigável (estilo WhatsApp).

        RETORNE JSON PURO:
        { 
          "isTransaction": boolean, 
          "transactionDetails": { 
            "description": string, 
            "amount": number, 
            "type": "income"|"expense", 
            "category": string,
            "installmentCount": number | null
          }, 
          "responseMessage": string 
        }`,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { 
        isTransaction: false, 
        responseMessage: error.message.includes("API Key") 
            ? "Configure sua Chave de API nas configurações para eu funcionar!" 
            : "Tive um problema técnico. Tente novamente." 
    };
  }
};

export const getFinancialAdvice = async (
  prompt: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  try {
    const ai = getAIClient();
    
    // Resumo simples para não estourar tokens
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const context = `
      DADOS FINANCEIROS ATUAIS:
      - Saldo: R$ ${balance.toFixed(2)}
      - Receitas: R$ ${totalIncome.toFixed(2)}
      - Despesas: R$ ${totalExpense.toFixed(2)}
      - Últimos 5 lançamentos: ${JSON.stringify(transactions.slice(0, 5).map(t => `${t.description} (${t.amount})`))}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: `${context}\n\nUsuário pergunta: ${prompt}` }],
      config: {
        systemInstruction: "Você é um consultor financeiro pessoal no WhatsApp. Responda de forma curta, direta, use emojis, formatação Markdown (negrito/itálico) e seja motivador. Fale em PT-BR.",
      }
    });

    return response.text;
  } catch (error) {
    return "Preciso que você configure uma Chave de API válida nas configurações para analisar seus dados.";
  }
};

// Helper para converter File em formato aceito pelo Gemini
async function fileToGenerativePart(file: File) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
