import { NextRequest, NextResponse } from "next/server";
import { prepareTextForTts } from "@/lib/companion/speech-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function decodeAudio(value: string) {
  const payload = value.startsWith("data:") ? value.split(",").slice(1).join(",") : value;
  if (/^[0-9a-fA-F]+$/.test(payload) && payload.length % 2 === 0) return Buffer.from(payload, "hex");
  return Buffer.from(payload, "base64");
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-minimax-api-key")?.trim() || process.env.MINIMAX_API_KEY?.trim();
  const groupId = request.headers.get("x-minimax-group-id")?.trim() || process.env.MINIMAX_GROUP_ID?.trim();
  if (!apiKey || !groupId) {
    return NextResponse.json({ error: "未配置 MiniMax API Key 或 Group ID" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = prepareTextForTts(clean(body?.text, 500));
  const voiceId = clean(body?.voiceId, 100);
  if (!text || !voiceId) return NextResponse.json({ error: "缺少文本或音色" }, { status: 400 });

  const response = await fetch(`https://api.minimaxi.com/v1/t2a_v2?GroupId=${encodeURIComponent(groupId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_TTS_MODEL || "speech-2.8-turbo",
      text,
      stream: false,
      voice_setting: { voice_id: voiceId, speed: 1, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !result) {
    return NextResponse.json({ error: `MiniMax TTS 请求失败：HTTP ${response.status}` }, { status: 502 });
  }

  const baseResp = result.base_resp as { status_code?: number; status_msg?: string } | undefined;
  if (baseResp?.status_code && baseResp.status_code !== 0) {
    return NextResponse.json(
      { error: baseResp.status_msg || `MiniMax TTS 错误 ${baseResp.status_code}` },
      { status: 502 },
    );
  }

  const data = result.data as { audio?: unknown } | undefined;
  const encoded = typeof data?.audio === "string" ? data.audio : typeof result.audio === "string" ? result.audio : "";
  if (!encoded) return NextResponse.json({ error: "MiniMax TTS 未返回音频" }, { status: 502 });

  const audio = decodeAudio(encoded);
  return new NextResponse(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.length),
      "Cache-Control": "no-store",
    },
  });
}
