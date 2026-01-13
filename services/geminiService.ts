import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, Category, AIRule, Transaction } from "../types";

// Helper to summarize financial data for the AI context
const generateFinancialContext = (transactions: Transaction[], categories: Category[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter current month data
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

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  monthlyTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  // Pending debts
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
    
    GASTOS POR CATEGORIA (Mês Atual):
    ${Object.entries(expensesByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

    SITUAÇÃO DE DÍVIDAS:
    - Contas em Atraso: ${overdueTransactions.length} (Total: R$ ${overdueTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)})
    - Total a Pagar (Pendente): R$ ${pendingPayables.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
    
    METAS/ORÇAMENTOS DEFINIDOS:
    ${categories.filter(c => c.budgetLimit).map(c => `- ${c.name}: Teto de R$ ${c.budgetLimit}`).join('\n')}
  `;
};

// Dynamic system instruction generator for Transaction Parsing
const getSystemInstruction = (categories: Category[], userRules: AIRule[]) => {
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.name).join(', ');
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both').map(c => c.name).join(', ');
  
  const rulesText = userRules.length > 0 
    ? `APRENDIZADO HISTÓRICO E CORREÇÕES DO USUÁRIO (Prioridade CRÍTICA):
       O usuário já corrigiu categorizações no passado. Você DEVE respeitar estas regras acima de qualquer outra lógica:
       ${userRules.map(r => `- Se a descrição contiver "${r.keyword}" (ou variações próximas), CLASSIFIQUE COMO: "${r.category}".`).join('\n')}
      `
    : 'Nenhum padrão histórico de correção aprendido ainda.';

  return `
Você é um assistente financeiro inteligente "FinAI Agent". 
Sua função é analisar inputs de texto ou imagem e extrair dados para JSON estruturado de forma precisa.

INTELIGÊNCIA DE CATEGORIZAÇÃO (Siga esta ordem de prioridade):
1. **MEMÓRIA DE CORREÇÕES (Regras do Usuário):** Verifique a seção abaixo. Se o input corresponder a uma regra aprendida, aplique a categoria imediatamente.
2. **PADRÕES DE MERCADO:** Se não houver regra específica, use associações comuns:
   - Apps de Transporte (Uber, 99) -> Transporte
   - Apps de Comida (iFood, Rappi) -> Alimentação
   - Streaming (Netflix, Spotify, Youtube) -> Lazer/Assinaturas
   - Supermercados (Carrefour, Pão de Açúcar) -> Alimentação
3. **INFERÊNCIA CONTEXTUAL:** Analise o contexto. "Almoço com cliente" pode ser "Trabalho" ou "Alimentação". Prefira as categorias listadas abaixo.

${rulesText}

LISTA DE CATEGORIAS VÁLIDAS:
- Receitas: ${incomeCategories}
- Despesas: ${expenseCategories}

REGRAS DE NEGÓCIO:
- Se o usuário disser "Vou pagar", "Lembrete", "Vence dia X", defina "isPaid": false e preencha "dueDate" (formato YYYY-MM-DD).
- Se o usuário disser "Gastei", "Paguei", "Comprei", "Pix para", defina "isPaid": true e "dueDate": null.
- Detecte recorrências: daily, weekly, biweekly, monthly, quarterly, semiannual, annual.

Exemplo de output JSON:
{
  "isTransaction": boolean,
  "transactionDetails": {
      "description": string,
      "amount": number,
      "type": "income" | "expense",
      "category": string,
      "recurrence": "monthly",
      "dueDate": "YYYY-MM-DD" (se for conta futura),
      "isPaid": boolean
  } | null,
  "responseMessage": string
}
`;
};

// Helper to convert Blob/File to Base64
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

// 1. Transaction Parser Function (Existing)
export const analyzeFinancialInput = async (
  textInput: string | null,
  mediaFile: File | null,
  availableCategories: Category[],
  userRules: AIRule[] = []
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-flash-latest";
    const parts: any[] = [];

    if (mediaFile) {
      const base64Data = await fileToGenerativePart(mediaFile);
      parts.push({
        inlineData: {
          mimeType: mediaFile.type,
          data: base64Data
        }
      });
    }

    if (textInput) {
      parts.push({ text: textInput });
    } else if (!mediaFile) {
        parts.push({ text: "Analise este anexo financeiro." });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: getSystemInstruction(availableCategories, userRules),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isTransaction: { type: Type.BOOLEAN },
            transactionDetails: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: [TransactionType.INCOME, TransactionType.EXPENSE] },
                category: { type: Type.STRING },
                recurrence: { type: Type.STRING, enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'] },
                dueDate: { type: Type.STRING, description: "ISO Date YYYY-MM-DD for future bills" },
                isPaid: { type: Type.BOOLEAN, description: "True if already paid, False if pending" }
              }
            },
            responseMessage: { type: Type.STRING }
          }
        }
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
      responseMessage: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua chave de API ou tente novamente."
    };
  }
};

// 2. Financial Advisor Function (New)
export const getFinancialAdvice = async (
  userMessage: string,
  transactions: Transaction[],
  categories: Category[]
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview"; // Using a smarter model for reasoning

    const financialContext = generateFinancialContext(transactions, categories);

    const systemInstruction = `
      Você é um Consultor Financeiro Pessoal de Elite chamado "FinAI Advisor".
      
      SEU OBJETIVO:
      Analisar os dados financeiros fornecidos e responder à pergunta do usuário com insights valiosos, dicas práticas e alertas.
      Seja direto, profissional, mas empático. Use emojis moderadamente.
      
      CONTEXTO ATUAL DO USUÁRIO (Dados Reais do Sistema):
      ${financialContext}
      
      DIRETRIZES:
      1. Se o saldo for negativo, sugira cortes imediatos nas categorias de maior gasto.
      2. Se houver dívidas atrasadas, priorize o pagamento delas na sua resposta.
      3. Se o usuário perguntar "Como estou?", faça um diagnóstico completo baseando-se na Receita vs Despesa.
      4. Compare os gastos com os tetos (budgets) definidos nas categorias, se houver.
      5. NÃO invente dados. Use apenas o resumo fornecido.
      6. Formate a resposta usando Markdown (negrito para valores, listas para dicas).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: [{ text: userMessage }]
      },
      config: {
        systemInstruction: systemInstruction,
        // No JSON schema here, we want natural language conversation
      }
    });

    return response.text;

  } catch (error) {
    console.error("Erro no Consultor Gemini:", error);
    return "Desculpe, não consegui analisar seus dados financeiros no momento. Tente novamente mais tarde.";
  }
};