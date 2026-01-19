import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Configuração de Ambiente (Deno Native)
    // Fix: Cast Deno to any to avoid TypeScript errors when Deno types are not fully loaded in the editor context
    const supabaseUrl = (Deno as any).env.get('SUPABASE_URL') ?? '';
    const supabaseKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const geminiKey = (Deno as any).env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials in Edge Function Secrets");
    }
    if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is not set in Edge Function Secrets");
    }

    // Initialize Supabase Client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Webhook Payload:", JSON.stringify(body));

    let text = "";
    const messageData = body;

    // Ignorar mensagens enviadas por mim mesmo (Loop prevention)
    if (messageData.fromMe) {
       return new Response(JSON.stringify({ message: "Ignored (from me)" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Estratégia de extração de texto (Z-API e similares)
    if (messageData.text && messageData.text.message) {
        text = messageData.text.message; 
    } else if (typeof messageData.text === 'string') {
        text = messageData.text;
    } else if (messageData.message) {
        text = messageData.message;
    } else if (messageData.conversation) {
        text = messageData.conversation;
    }

    if (!text) {
       return new Response(JSON.stringify({ message: "No text found to process" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const { data: categoriesData } = await supabaseClient.from('categories').select('name').limit(20);
    const categoryList = categoriesData?.map((c: any) => c.name).join(', ') || "Alimentação, Transporte, Lazer, Contas, Receita, Outros";

    const prompt = `
      Atue como um interpretador bancário. Analise esta mensagem de WhatsApp: "${text}".
      
      Seu objetivo é extrair dados de uma transação financeira, se houver.
      Categorias sugeridas: ${categoryList}.
      
      Regras:
      - Se o usuário disser "Gastei 50 no mercado", type="expense", category="Alimentação".
      - Se disser "Recebi 1000", type="income".
      - Se não for transação financeira clara, "isTransaction": false.
      
      Retorne JSON PURO (sem markdown): 
      { "isTransaction": boolean, "description": string, "amount": number, "type": "income"|"expense", "category": "string" }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    
    const cleanJson = response.text?.replace(/```json|```/g, "").trim() || "{}";
    
    let analysis;
    try {
        analysis = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Falha ao parsear JSON da IA:", cleanJson);
        return new Response(JSON.stringify({ error: "AI Parsing Error" }), { headers: corsHeaders, status: 500 });
    }

    if (analysis.isTransaction) {
        // Busca organização. Em produção, buscar via telefone do usuário na tabela profiles.
        const { data: orgs } = await supabaseClient.from('organizations').select('id').limit(1);
        const orgId = orgs?.[0]?.id;

        if (orgId) {
            const { error: insertError } = await supabaseClient.from('transactions').insert({
                description: analysis.description,
                amount: analysis.amount,
                type: analysis.type,
                category: analysis.category || 'Outros',
                date: new Date().toISOString(),
                is_paid: true,
                source: 'whatsapp_bot',
                organization_id: orgId
            });

            if (insertError) {
                console.error("Erro ao inserir:", insertError);
                throw insertError;
            }
            console.log("Transação salva:", analysis);
        } else {
            console.error("Nenhuma organização encontrada para salvar a transação.");
        }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});