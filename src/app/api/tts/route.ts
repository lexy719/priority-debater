/**
 * POST /api/tts — ElevenLabs text-to-speech for the tribunal.
 *
 * Each chamber seat maps to a distinct ElevenLabs voice so the panel sounds
 * like five different people, not one narrator. When ELEVENLABS_API_KEY is
 * absent (or the upstream call fails) we return 503 with { fallback: true } so
 * the client transparently drops back to the browser SpeechSynthesis voice —
 * the page never goes silent because a key is missing.
 *
 * Voice IDs below are ElevenLabs' public preset voices; swap any for a custom
 * voice id from your account to fine-tune the cast.
 */

import { NextResponse } from "next/server";
import { requireAuth, guardFailResponse } from "@/lib/credits/server";

export const runtime = "nodejs";

// personaId → ElevenLabs voice id + per-voice delivery settings.
const VOICE_MAP: Record<string, { voiceId: string; stability: number; similarity: number }> = {
  // Investor — cold, precise.
  vk: { voiceId: "21m00Tcm4TlvDq8ikWAM", stability: 0.55, similarity: 0.75 }, // Rachel
  // Customer — blunt, grounded.
  mr: { voiceId: "pNInz6obpgDQGcFmaJgB", stability: 0.45, similarity: 0.8 }, // Adam
  // Operator — measured, even.
  ht: { voiceId: "ErXwobaYiN019PkySvjV", stability: 0.6, similarity: 0.75 }, // Antoni
  // Adversary — low, deliberate, lethal.
  lv: { voiceId: "AZnzlk1XvdvUeBnXmlld", stability: 0.35, similarity: 0.85 }, // Domi
  // Mentor — warm, unhurried.
  es: { voiceId: "TxGEqnHWrfWFTfGW9XjX", stability: 0.5, similarity: 0.7 }, // Josh
};

const MODEL_ID = "eleven_turbo_v2_5"; // low-latency, good quality
const MAX_CHARS = 600; // keep turns snappy and cost bounded

export async function POST(req: Request) {
  // Voice plays inside an already-paid debate session — require login (no extra
  // charge). A 401 here makes the client fall back to the browser voice.
  const auth = await requireAuth();
  if (!auth.ok) return guardFailResponse(auth);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // No key configured — tell the client to use its local fallback voice.
    return NextResponse.json({ fallback: true, reason: "no_key" }, { status: 503 });
  }

  let personaId = "";
  let text = "";
  try {
    const body = (await req.json()) as { personaId?: string; text?: string };
    personaId = body.personaId ?? "";
    text = (body.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const voice = VOICE_MAP[personaId];
  if (!voice || !text) {
    return NextResponse.json({ error: "missing_voice_or_text" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}?optimize_streaming_latency=2`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: voice.stability,
            similarity_boost: voice.similarity,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!res.ok || !res.body) {
      // Quota, auth, or upstream error — fall back rather than fail loudly.
      return NextResponse.json({ fallback: true, reason: `upstream_${res.status}` }, { status: 503 });
    }

    return new Response(res.body, {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ fallback: true, reason: "fetch_failed" }, { status: 503 });
  }
}
