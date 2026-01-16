import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, Category, AIRule, Transaction } from "../types";

// VITE USES import.meta.env, NOT process.env
// Safely access env to prevent crashes if not defined
const env = (import.meta as any).env || {};
const API_KEY = env.VITE_GEMINI_API_KEY || '';

// Helper to summarize financial data for the AI context
const generateFinancialContext = (transactions: Transaction[], categories: Category[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const expensesByCategory: Record<string, number> = {};
  monthlyTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const overdueTransactions = transactions.filter(t => 
    t.type === 'expense' && !t.isPaid && t.dueDate && new Date(t.dueDate) < now
  );
  
  const pendingPayables = transactions.filter(t => 
    t.type === 'expense' && !t.isPaid
  );

  return `
    RESUMO FINANCEIRO (Mês Atual):
    - Receita Total: R$ ${totalIncome.toFixed(2)}
    - Despesa Total: R$ ${totalExpense.toFixed(2)}
    - Saldo do Mês: R$ ${balance.toFixed(2)}
    
    GASTOS POR CATEGORIA:
    ${Object.entries(expensesByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

    DÍVIDAS:
    - Atrasadas: ${overdueTransactions.length}
    - Pendentes: R$ ${pendingPayables.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
  `;
};

const getSystemInstruction = (categories: Category[], userRules: AIRule[]) => {
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.name).join(', ');
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both').map(c => c.name).join(', ');
  
  const rulesText = userRules.length > 0 
    ? `APRENDIZADO HISTÓRICO:\n${userRules.map(r => `- Se contiver "${r.keyword}", CLASSIFIQUE COMO: "${r.category}".`).join('\n')}`
    : 'Nenhum padrão histórico ainda.';

  return `
    Você é um assistente financeiro (FinAI). Analise inputs para JSON.
    
    PRIORIDADE:
    1. Regras do Usuário: ${rulesText}
    2. Padrões de Mercado.
    3. Inferência.

    CATEGORIAS VÁLIDAS:
    - Receitas: ${incomeCategories}
    - Despesas: ${expenseCategories}

    Output JSON Schema:
    { "isTransaction": boolean, "transactionDetails": { ... }, "responseMessage": string }
  `;
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeFinancialInput = async (
  textInput: string | null,
  mediaFile: File | null,
  availableCategories: Category[],
  userRules: AIRule[] = []
) => {
  if (!API_KEY) {
    console.error("API Key do Gemini não encontrada (VITE_GEMINI_API_KEY).");
    return { isTransaction: false, transactionDetails: null, responseMessage: "Erro de configuração: Chave de API ausente. Verifique o arquivo .env" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelId = "gemini-3-flash-preview"; // Using Gemini 3 Flash as per guidelines
    const parts: any[] = [];

    if (mediaFile) {
      const base64Data = await fileToGenerativePart(mediaFile);
      parts.push({ inlineData: { mimeType: mediaFile.type, data: base64Data } });
    }

    if (textInput) parts.push({ text: textInput });
    else if (!mediaFile) parts.push({ text: "Analise este anexo financeiro." });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: getSystemInstruction(availableCategories, userRules),
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Sem resposta da IA");
    return JSON.parse(responseText);

  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    return {
      isTransaction: false,
      transactionDetails: null,
      responseMessage: "Desculpe, tive um problema ao processar sua solicitação."
    };
  }
};

export const getFinancialAdvice = async (
  userMessage: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  if (!API_KEY) return "Erro: Chave de API não configurada.";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelId = "gemini-3-pro-preview"; // Using Gemini 3 Pro as per guidelines

    const financialContext = generateFinancialContext(transactions, categories);
    const systemInstruction = `Você é o FinAI Advisor. Contexto:\n${financialContext}`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { role: 'user', parts: [{ text: userMessage }] },
      config: { systemInstruction: systemInstruction }
    });

    return response.text;
  } catch (error) {
    console.error("Erro no Consultor Gemini:", error);
    return "Desculpe, serviço indisponível no momento.";
  }
};