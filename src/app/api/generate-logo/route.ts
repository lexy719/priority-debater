import OpenAI from "openai";

const MAX_PROMPT_LEN = 4000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 2 * 60 * 1000;
const RATE_MAX = 25;

const VALID_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024"]);

function getClientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  if (!entry) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

const DEFAULT_GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

async function generateWithOpenAI(
  prompt: string,
  size: "1024x1024" | "1024x1536" | "1536x1024" = "1024x1024",
): Promise<{ dataUrl: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for logo generation.");
  }
  const openai = new OpenAI({ apiKey: key });
  const img = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size,
    quality: "high",
  });
  const b64 = img.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data.");
  return { dataUrl: `data:image/png;base64,${b64}` };
}

async function generateWithGemini(prompt: string): Promise<{ dataUrl: string }> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Use a Google AI Studio key for Nano Banana / Gemini image models.",
    );
  }
  const model = DEFAULT_GEMINI_IMAGE_MODEL.replace(/^models\//, "");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let msg = `Gemini image error (${res.status})`;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  let data: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid response from Gemini.");
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) throw new Error("Gemini returned no image parts.");

  for (const part of parts) {
    const p = part as {
      inlineData?: { mimeType?: string; data?: string };
      inline_data?: { mime_type?: string; data?: string };
    };
    const b64 = p.inlineData?.data ?? p.inline_data?.data;
    const mime = p.inlineData?.mimeType ?? p.inline_data?.mime_type ?? "image/png";
    if (b64) {
      return { dataUrl: `data:${mime};base64,${b64}` };
    }
  }

  throw new Error("Gemini returned no inline image data. Try another model in GEMINI_IMAGE_MODEL.");
}

/**
 * POST { prompt: string | string[], provider?: "openai" | "gemini" | "auto", count?: 1-4, size?: string }
 *
 * Single generation (count=1 or omitted):
 *   Returns { dataUrl: string }
 *
 * Multi generation (count>1):
 *   `prompt` may be a single string (reused for all) or an array of strings (one per variant).
 *   Returns { results: Array<{ dataUrl: string } | { error: string }> }
 */
export async function POST(request: Request) {
  if (!checkRateLimit(getClientId(request))) {
    return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: { prompt?: string | string[]; provider?: string; count?: number; size?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // --- Validate count ---
  const count = Math.max(1, Math.min(4, Math.floor(Number(body.count) || 1)));

  // --- Validate size ---
  const sizeRaw = String(body.size || "1024x1024").trim();
  const size = VALID_SIZES.has(sizeRaw)
    ? (sizeRaw as "1024x1024" | "1024x1536" | "1536x1024")
    : "1024x1024";

  // --- Resolve prompts ---
  const rawPrompt = body.prompt;
  let prompts: string[];

  if (Array.isArray(rawPrompt)) {
    prompts = rawPrompt.map((p) => String(p || "").trim().slice(0, MAX_PROMPT_LEN));
  } else {
    const single = String(rawPrompt || "").trim().slice(0, MAX_PROMPT_LEN);
    prompts = Array.from({ length: count }, () => single);
  }

  // Ensure we have exactly `count` prompts (pad or trim)
  if (prompts.length < count) {
    const last = prompts[prompts.length - 1] || "";
    while (prompts.length < count) prompts.push(last);
  } else if (prompts.length > count) {
    prompts = prompts.slice(0, count);
  }

  if (!prompts[0]) {
    return Response.json({ error: "prompt is required." }, { status: 400 });
  }

  // --- Resolve provider ---
  const providerRaw = String(body.provider || "auto").toLowerCase();
  const hasOpenAI = !!process.env.OPENAI_API_KEY?.trim();
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();

  let provider = providerRaw;
  if (provider === "auto") {
    const prefer = process.env.LOGO_IMAGE_PROVIDER?.trim().toLowerCase();
    if (hasGemini && !hasOpenAI) provider = "gemini";
    else if (hasOpenAI && !hasGemini) provider = "openai";
    else if (hasOpenAI && hasGemini) {
      provider = prefer === "gemini" ? "gemini" : "openai";
    } else if (hasGemini) provider = "gemini";
    else if (hasOpenAI) provider = "openai";
    else {
      return Response.json(
        {
          error:
            "No image provider configured. Set OPENAI_API_KEY (DALL·E 3) and/or GEMINI_API_KEY (Nano Banana / Gemini image).",
        },
        { status: 503 },
      );
    }
  }

  if (provider !== "openai" && provider !== "gemini") {
    return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  // --- Gemini: only supports count=1 ---
  if (provider === "gemini" && count > 1) {
    // Fall back: generate only the first prompt with Gemini, return single result
    try {
      const { dataUrl } = await generateWithGemini(prompts[0]);
      return Response.json({ dataUrl });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Image generation failed.";
      return Response.json({ error: message }, { status: 502 });
    }
  }

  // --- Single generation (backward compatible) ---
  if (count === 1) {
    try {
      if (provider === "openai") {
        const { dataUrl } = await generateWithOpenAI(prompts[0], size);
        return Response.json({ dataUrl });
      }
      // gemini
      const { dataUrl } = await generateWithGemini(prompts[0]);
      return Response.json({ dataUrl });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Image generation failed.";
      return Response.json({ error: message }, { status: 502 });
    }
  }

  // --- Multi generation (OpenAI only at this point) ---
  const settled = await Promise.allSettled(
    prompts.map((p) => generateWithOpenAI(p, size)),
  );

  const results = settled.map((r) => {
    if (r.status === "fulfilled") {
      return { dataUrl: r.value.dataUrl };
    }
    return { error: r.reason instanceof Error ? r.reason.message : "Image generation failed." };
  });

  return Response.json({ results });
}
