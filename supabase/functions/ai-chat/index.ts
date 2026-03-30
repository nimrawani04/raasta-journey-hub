import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode, locale } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system + user prompts based on mode
    let system = "";
    let user = "";

    if (mode === "samjho" && body.ocrText) {
      system = "You are Samjho, powered by HAQQ. Explain government or legal documents in simple language for people with low literacy. Short paragraphs, warm and clear. Include deadlines and next steps.";
      user = `Document text:\n${body.ocrText}\n\nExplain what this means and what the reader should do.`;
    } else if (mode === "zameen" && body.visionSummary) {
      system = "You are Zameen, powered by WADI. Give practical crop and disease advice. Mention treatment timing and mandi (market) price when data is provided. Keep it voice-friendly.";
      user = `Vision summary: ${body.visionSummary}\nMarket note: ${body.mandiHint ?? ""}`;
    } else if (mode === "raah" && body.question) {
      system = "You are Raah, the voice layer of RAASTA. Help people in Kashmir and rural India with government schemes, farming, documents, jobs, and education (Taleem). Be concise. No long bullet lists unless asked.";
      user = body.question;
    } else if (body.system && body.prompt) {
      // Fallback: accept raw system/prompt
      system = body.system;
      user = body.prompt;
    } else {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Append locale instruction
    if (locale === "hi") {
      system += "\n\nOUTPUT LANGUAGE: Respond entirely in Hindi using Devanagari script. Keep sentences short and clear for text-to-speech.";
    } else if (locale === "ks") {
      system += "\n\nOUTPUT LANGUAGE: Respond entirely in Kashmiri using Arabic (Perso-Arabic) script. Keep sentences short and clear for text-to-speech.";
    } else {
      system += "\n\nOUTPUT LANGUAGE: Respond entirely in clear, simple English. Keep sentences short for text-to-speech.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ text, mode, usedModel: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
