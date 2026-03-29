import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: "Missing image file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = await file.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(bytes));
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const systemPrompt = `You are an agricultural expert AI assistant for farmers in Kashmir and rural India. Analyze this crop/plant image and provide:

1. IDENTIFICATION: What crop/plant is this? What part is shown?
2. HEALTH ASSESSMENT: Any signs of disease, pest damage, or nutritional deficiency?
3. DIAGNOSIS: If issues found, what is the likely cause?
4. URGENCY: How urgent is treatment? (immediate, within days, can wait)

Be concise and practical. Use simple language.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Vision error:", response.status);
      return new Response(JSON.stringify({
        summary: "early_fungal_spots",
        mandiHint: "Sopore mandi - apple ~Rs.42/kg (demo)",
        demo: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({
      summary,
      mandiHint: "Check local mandi for current prices. Sopore, Baramulla, and Srinagar markets have regular updates.",
      success: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-vision error:", e);
    return new Response(JSON.stringify({
      summary: "early_fungal_spots",
      mandiHint: "Sopore mandi - apple ~Rs.42/kg (demo)",
      demo: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
