import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, Category, AIRule } from "../types";

// Dynamic system instruction generator
const getSystemInstruction = (categories: Category[], userRules: AIRule[]) => {
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.name).join(', ');
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both').map(c => c.name).join(', ');
  
  const rulesText = userRules.length > 0 
    ? `HISTÓRICO DE CORREÇÕES DO USUÁRIO (Prioridade Alta):
       ${userRules.map(r => `- Se a descrição contiver "${r.keyword}", use a categoria "${r.category}".`).join('\n')}
      `
    : '';

  return `
Você é um assistente financeiro especializado chamado "FinAI Agent". 
Sua função é analisar mensagens de texto, imagens de comprovantes ou transcrições de áudio enviadas pelo usuário.

1. Identifique se o input contém informações sobre uma transação financeira.
2. Se SIM, extraia os dados para formato JSON estruturado.
3. Se NÃO, responda de forma educada e conversacional.
4. Se faltarem detalhes (ex: valor), pergunte ao usuário.

LISTA DE CATEGORIAS DISPONÍVEIS (Use APENAS estas):
- Categorias de Receita (Entrada): ${incomeCategories}
- Categorias de Despesa (Saída): ${expenseCategories}

Tipos possíveis: "income" (entrada), "expense" (saída).
Recorrências possíveis (recurrence): 'none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'.

PADRÕES DE RECORRÊNCIA:
- "Todo dia" -> daily
- "Toda semana" -> weekly
- "A cada 15 dias", "Quinzenal" -> biweekly
- "Todo mês", "Mensal", "Assinatura" -> monthly
- "A cada 3 meses" -> quarterly
- "A cada 6 meses" -> semiannual
- "Todo ano", "Anual", "IPTU" -> annual
- Se não especificado -> none

${rulesText}

REGRAS DE RETORNO JSON:
Se você identificar uma transação, o campo "isTransaction" deve ser true.
Preencha "description", "amount" (número positivo), "type", "category" e "recurrence".
O campo "category" deve ser uma string EXATA da lista acima. Se não tiver certeza, use a mais próxima ou "Outros".
Sempre forneça uma breve "responseMessage" conversacional.

Exemplo de output JSON:
{
  "isTransaction": boolean,
  "transactionDetails": {
      "description": string,
      "amount": number,
      "type": "income" | "expense",
      "category": string,
      "recurrence": "monthly"
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
                recurrence: { type: Type.STRING, enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'] }
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