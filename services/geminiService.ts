
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, AIRule } from "../types";

// Função para verificar quais chaves estão disponíveis
const getAPIKeys = () => {
  const gemini = localStorage.getItem('finai_api_key_gemini') || process.env.API_KEY;
  const openai = localStorage.getItem('finai_api_key_openai');
  return { gemini, openai };
};

// Helper para limpar respostas JSON que vêm com markdown (```json ...)
const cleanJsonString = (text: string): string => {
    if (!text) return "{}";
    // Remove marcadores de código markdown no início e fim
    return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
};

// ==========================================
// CLIENTE OPENAI (FALLBACK)
// ==========================================
const callOpenAI = async (apiKey: string, prompt: string | any[], systemInstruction: string, jsonMode: boolean = false) => {
    // Explicitly typed to allow string or array content for multimodal support
    const messages: { role: string; content: string | any[] }[] = [
        { role: "system", content: systemInstruction }
    ];

    if (typeof prompt === 'string') {
        messages.push({ role: "user", content: prompt });
    } else {
        // Suporte multimodal básico para OpenAI (Texto + Imagem)
        const content: any[] = [];
        for (const part of prompt) {
            if (part.text) content.push({ type: "text", text: part.text });
            if (part.inlineData) {
                content.push({ 
                    type: "image_url", 
                    image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } 
                });
            }
        }
        messages.push({ role: "user", content });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // Modelo mais rápido e multimodal da OpenAI
                messages: messages,
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Erro na OpenAI");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        throw new Error(`OpenAI Error: ${error.message}`);
    }
};

// ==========================================
// FUNÇÕES PRINCIPAIS
// ==========================================

export const analyzeFinancialInput = async (
  textInput: string | null,
  mediaFile: File | null,
  availableCategories: Category[],
  userRules: AIRule[] = []
) => {
  try {
    const { gemini, openai } = getAPIKeys();
    
    if (!gemini && !openai) {
        throw new Error("Nenhuma API Key configurada. Vá em Configurações e adicione Gemini ou OpenAI.");
    }

    // Preparação do Prompt / Contexto
    let forcedCategory: string | null = null;
    if (textInput && userRules.length > 0) {
        const lowerInput = textInput.toLowerCase();
        const rule = userRules.find(r => lowerInput.includes(r.keyword.toLowerCase()));
        if (rule) forcedCategory = rule.category;
    }

    const systemPrompt = `Você é o FinAI, um assistente financeiro.
        
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
    }`;

    // --- LÓGICA DE SELEÇÃO DE PROVEDOR ---

    // 1. Prioridade: Google Gemini (Mais rápido e barato para este uso)
    if (gemini) {
        const ai = new GoogleGenAI({ apiKey: gemini });
        const parts: any[] = [];
        if (textInput) parts.push({ text: textInput });
        if (mediaFile) {
            const base64Data = await fileToGenerativePart(mediaFile);
            parts.push(base64Data);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: parts.length > 0 ? parts : [{ text: "Análise de transação" }] },
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            }
        });
        
        const cleanText = cleanJsonString(response.text || "{}");
        return JSON.parse(cleanText);
    }

    // 2. Fallback: OpenAI
    if (openai) {
        // Nota: OpenAI não suporta áudio nativo na API de chat padrão como o Gemini.
        if (mediaFile && mediaFile.type.startsWith('audio/')) {
            return {
                isTransaction: false,
                responseMessage: "Para processar áudios diretamente, por favor configure a chave do Google Gemini nas configurações. A OpenAI requer etapas extras para áudio."
            };
        }

        const parts: any[] = [];
        if (textInput) parts.push({ text: textInput });
        if (mediaFile && mediaFile.type.startsWith('image/')) {
            const base64Data = await fileToGenerativePart(mediaFile);
            parts.push(base64Data);
        }

        const jsonResponse = await callOpenAI(openai, parts.length > 0 ? parts : "Analisar", systemPrompt, true);
        const cleanText = cleanJsonString(jsonResponse || "{}");
        return JSON.parse(cleanText);
    }

    return { isTransaction: false, responseMessage: "Erro de configuração." };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { 
        isTransaction: false, 
        responseMessage: error.message.includes("API Key") 
            ? "Configure sua Chave de API nas configurações." 
            : `Tive um problema técnico ao processar: ${error.message}. Tente novamente.`
    };
  }
};

export const getFinancialAdvice = async (
  prompt: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  try {
    const { gemini, openai } = getAPIKeys();
    
    if (!gemini && !openai) {
        return "Configure uma chave de API (Gemini ou OpenAI) nas configurações.";
    }

    // Contexto resumido
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
    
    const finalPrompt = `${context}\n\nUsuário pergunta: ${prompt}`;
    const systemInst = "Você é um consultor financeiro pessoal no WhatsApp. Responda de forma curta, direta, use emojis, formatação Markdown (negrito/itálico) e seja motivador. Fale em PT-BR.";

    if (gemini) {
        const ai = new GoogleGenAI({ apiKey: gemini });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: finalPrompt }],
            config: { systemInstruction: systemInst }
        });
        return response.text;
    } 
    
    if (openai) {
        return await callOpenAI(openai, finalPrompt, systemInst, false);
    }

    return "Erro de configuração.";
  } catch (error: any) {
    return `Erro ao consultar IA: ${error.message}`;
  }
};

// Helper para converter File em formato Base64 genérico
async function fileToGenerativePart(file: File) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
        // Propriedade extra para facilitar conversão para OpenAI se necessário
        text: null 
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
