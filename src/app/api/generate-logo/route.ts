import OpenAI from "openai";

const MAX_PROMPT_LEN = 4000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 2 * 60 * 1000;
const RATE_MAX = 12;

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

async function generateWithOpenAI(prompt: string): Promise<{ dataUrl: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for logo generation.");
  }
  const openai = new OpenAI({ apiKey: key });
  const img = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1536",
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
 * POST { prompt: string, provider?: "openai" | "gemini" | "auto" }
 * Returns { url?: string, dataUrl?: string } — use whichever is set.
 */
export async function POST(request: Request) {
  if (!checkRateLimit(getClientId(request))) {
    return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: { prompt?: string; provider?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = String(body.prompt || "")
    .trim()
    .slice(0, MAX_PROMPT_LEN);
  if (!prompt) {
    return Response.json({ error: "prompt is required." }, { status: 400 });
  }

  const providerRaw = String(body.provider || "auto").toLowerCase();
  const hasOpenAI = !!process.env.OPENAI_API_KEY?.trim();
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();

  let provider = providerRaw;
  if (provider === "auto") {
    const prefer = process.env.LOGO_IMAGE_PROVIDER?.trim().toLowerCase();
    if (hasGemini && !hasOpenAI) provider = "gemini";
    else if (hasOpenAI && !hasGemini) provider = "openai";
    else if (hasOpenAI && hasGemini) {
      // Default: OpenAI (DALL·E 3) when both keys exist — set LOGO_IMAGE_PROVIDER=gemini to prefer Gemini.
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

  try {
    if (provider === "openai") {
      const { dataUrl } = await generateWithOpenAI(prompt);
      return Response.json({ dataUrl });
    }
    if (provider === "gemini") {
      const { dataUrl } = await generateWithGemini(prompt);
      return Response.json({ dataUrl });
    }
    return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image generation failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
