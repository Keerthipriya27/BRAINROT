// Image Prediction API
// POST { image: "data:image/...;base64,..." | "https://..." }
// Returns structured JSON predictions (caption, labels, colors, detected text).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an image prediction API. Analyze the provided image and respond with STRICT JSON only (no markdown, no commentary). Schema:
{
  "caption": "one concise sentence describing the image",
  "labels": [{"label": "string", "confidence": 0.0-1.0}],  // 5-10 items, sorted desc by confidence
  "categories": ["high-level category", ...],              // 1-4 broad categories
  "dominant_colors": ["#rrggbb", ...],                     // 3-5 hex colors
  "detected_text": "any text visible in the image, or empty string",
  "nsfw": false,
  "safe_for_work": true
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const started = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    let image: string | undefined = body.image ?? body.imageBase64 ?? body.imageUrl ?? body.url;
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'image' (base64 data URL or https URL)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a plain http(s) URL is provided, fetch & convert to data URL for the model.
    if (/^https?:\/\//i.test(image)) {
      const r = await fetch(image);
      if (!r.ok) throw new Error(`Failed to fetch image URL (${r.status})`);
      const ct = r.headers.get("content-type") || "image/jpeg";
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      image = `data:${ct};base64,${btoa(bin)}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [
            { type: "text", text: "Predict labels and metadata for this image. Return JSON only." },
            { type: "image_url", image_url: { url: image } },
          ]},
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Prediction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let predictions: Record<string, unknown> = {};
    try { predictions = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      predictions = m ? JSON.parse(m[0]) : { raw };
    }

    return new Response(JSON.stringify({
      success: true,
      model: "google/gemini-2.5-flash",
      processing_time_ms: Date.now() - started,
      predictions,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
