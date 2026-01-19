import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";
import process from "node:process";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Client
    const supabaseClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    const body = await req.json();
    console.log("Webhook Payload:", JSON.stringify(body));

    let text = "";
    const messageData = body;

    if (messageData.fromMe) {
       return new Response(JSON.stringify({ message: "Ignored (from me)" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

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

    // Initialize Gemini AI with new SDK
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is not set");
    }
    
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

    // Use Gemini 3 Flash Preview as per guidelines for basic text tasks
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