
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, AIRule } from "../types";

// The API key must be obtained exclusively from process.env.API_KEY
// Always use new GoogleGenAI({apiKey: process.env.API_KEY})
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
    
    // Improved System Instruction for better transaction recognition
    // Use ai.models.generateContent directly with model name
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: parts.length > 0 ? parts : [{ text: "Análise de transação financeira" }] },
      config: {
        systemInstruction: `Você é o FinAI, um assistente financeiro altamente inteligente. 
        Seu objetivo é identificar se o usuário está relatando um gasto, ganho ou transferência.
        
        CRITÉRIOS DE RECONHECIMENTO:
        - Frases como "Gastei X com Y", "Recebi X de Z", "Paguei a conta de W" são transações.
        - Se for uma transação, defina isTransaction como true.
        - Categorize com base na lista: ${JSON.stringify(availableCategories.map(c => c.name))}.
        - Caso não tenha certeza da categoria, escolha a mais próxima ou "Outros".
        - Se for apenas um cumprimento ou dúvida geral, isTransaction é false.

        RETORNE APENAS JSON:
        { 
          "isTransaction": boolean, 
          "transactionDetails": { 
            "description": string, 
            "amount": number, 
            "type": "income"|"expense", 
            "category": string 
          }, 
          "responseMessage": string (Uma resposta amigável confirmando ou negando) 
        }`,
        responseMimeType: "application/json",
      }
    });

    // Access .text property instead of calling .text()
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return { isTransaction: false, responseMessage: "Desculpe, tive um problema ao processar isso. Pode repetir?" };
  }
};

export const getFinancialAdvice = async (
  prompt: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  try {
    // Adding summary to context for better reasoning
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const context = `
      RESUMO FINANCEIRO:
      - Saldo Atual: R$ ${balance.toFixed(2)}
      - Total Receitas: R$ ${totalIncome.toFixed(2)}
      - Total Despesas: R$ ${totalExpense.toFixed(2)}
      - Últimos Lançamentos: ${JSON.stringify(transactions.slice(0, 5))}
      - Categorias Disponíveis: ${JSON.stringify(categories.map(c => c.name))}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ text: `${context}\n\nPergunta do Usuário: ${prompt}` }],
      config: {
        systemInstruction: "Você é um consultor financeiro de elite. Analise os dados fornecidos e responda de forma direta, técnica e motivacional em Português do Brasil. Use emojis para facilitar a leitura.",
      }
    });

    // Access .text property instead of calling .text()
    return response.text;
  } catch (error) {
    console.error("Advice Error:", error);
    return "Não consegui acessar seus dados financeiros para dar um conselho agora. Tente novamente em instantes.";
  }
};
