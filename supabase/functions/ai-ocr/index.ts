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
    const type = formData.get("type") as string | null;

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

    const systemPrompt = type === "marksheet"
      ? "You are an OCR assistant. Extract all text from this marksheet/report card image. Include: student name, class/grade, subjects with marks, percentage, board/institution name, year. Format clearly."
      : "You are an OCR assistant. Extract all text from this document image exactly as it appears. Preserve the structure and formatting. Include any official notices, dates, deadlines, and important information.";

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
        max_tokens: 2000,
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
      const errText = await response.text();
      console.error("OCR error:", response.status, errText);
      return new Response(JSON.stringify({ 
        text: type === "marksheet"
          ? "[Demo OCR marksheet] Class 12, Science stream. Subjects: English 82, Urdu 78, Physics 76, Chemistry 80, Biology 77. Aggregate ~78%. Board: JKBOSE. Year: 2024."
          : "[Demo OCR] Government notice: Land records must be submitted by the 15th of this month.",
        demo: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ text, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-ocr error:", e);
    return new Response(JSON.stringify({ 
      text: "[Demo OCR] Government notice: Land records must be submitted by the 15th of this month.",
      demo: true,
      error: e instanceof Error ? e.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
