
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- FUNÇÃO AUXILIAR: CHAMAR OPENAI ---
async function analyzeWithOpenAI(apiKey: string, text: string, categories: string): Promise<any> {
    const prompt = `
      Atue como um interpretador bancário. Analise: "${text}".
      Categorias: ${categories}.
      
      Regras:
      - "Gastei 50 no mercado" -> type="expense", category="Alimentação".
      - "Recebi 1000" -> type="income".
      - Se não for financeiro, "isTransaction": false.
      
      JSON PURO: 
      { "isTransaction": boolean, "description": string, "amount": number, "type": "income"|"expense", "category": "string" }
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Você retorna apenas JSON." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
}

// --- FUNÇÃO AUXILIAR: CHAMAR GEMINI ---
async function analyzeWithGemini(apiKey: string, text: string, categories: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Atue como um interpretador bancário. Analise: "${text}".
      Categorias: ${categories}.
      
      Regras:
      - "Gastei 50 no mercado" -> type="expense", category="Alimentação".
      - "Recebi 1000" -> type="income".
      - Se não for financeiro, "isTransaction": false.
      
      JSON PURO (sem markdown): 
      { "isTransaction": boolean, "description": string, "amount": number, "type": "income"|"expense", "category": "string" }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    const cleanJson = response.text?.replace(/```json|```/g, "").trim() || "{}";
    return JSON.parse(cleanJson);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (Deno as any).env.get('SUPABASE_URL') ?? '';
    const supabaseKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Suporte Híbrido: Verifica ambas as chaves
    const geminiKey = (Deno as any).env.get('GEMINI_API_KEY');
    const openAiKey = (Deno as any).env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials");
    }

    if (!geminiKey && !openAiKey) {
        throw new Error("Nenhuma chave de IA (Gemini ou OpenAI) configurada nos Secrets.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    
    // Ignorar mensagens próprias
    if (body.fromMe) return new Response(JSON.stringify({ ignored: true }), { headers: corsHeaders });

    // Extração de texto (compatível com Z-API e outros)
    let text = body.text?.message || body.text || body.message || body.conversation || "";

    if (!text) return new Response(JSON.stringify({ msg: "No text" }), { headers: corsHeaders });

    // Buscar categorias para contexto
    const { data: categoriesData } = await supabaseClient.from('categories').select('name').limit(20);
    const categoryList = categoriesData?.map((c: any) => c.name).join(', ') || "Outros";

    let analysis;
    
    // Lógica de Prioridade: Gemini (Rápido/Barato) -> OpenAI (Fallback/Potente)
    try {
        if (geminiKey) {
            console.log("Usando Gemini...");
            analysis = await analyzeWithGemini(geminiKey, text, categoryList);
        } else if (openAiKey) {
            console.log("Usando OpenAI...");
            analysis = await analyzeWithOpenAI(openAiKey, text, categoryList);
        }
    } catch (aiError: any) {
        console.error("Erro na IA principal:", aiError);
        // Fallback reverso simples
        if (geminiKey && openAiKey) {
             console.log("Tentando fallback para OpenAI...");
             analysis = await analyzeWithOpenAI(openAiKey, text, categoryList);
        } else {
             throw aiError;
        }
    }

    if (analysis && analysis.isTransaction) {
        const { data: orgs } = await supabaseClient.from('organizations').select('id').limit(1);
        const orgId = orgs?.[0]?.id;

        if (orgId) {
            await supabaseClient.from('transactions').insert({
                description: analysis.description,
                amount: analysis.amount,
                type: analysis.type,
                category: analysis.category || 'Outros',
                date: new Date().toISOString(),
                is_paid: true,
                source: 'whatsapp_bot',
                organization_id: orgId
            });
            console.log("Transação salva via Webhook");
        }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
