import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SILICONFLOW_STT_URL = "https://api.siliconflow.cn/v1/audio/transcriptions";
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function decodeBase64Audio(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.includes(",") ? value.split(",").slice(1).join(",") : value;
  try {
    return Buffer.from(normalized, "base64");
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-siliconflow-api-key")?.trim() || process.env.SILICONFLOW_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "未配置硅基流动 API Key" }, { status: 401 });

  let audio: Buffer | null = null;
  let filename = "voice.wav";
  let mime = "audio/wav";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "此内部路由仅接受 JSON base64 音频" },
      { status: 415 },
    );
  } else {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    audio = decodeBase64Audio(body?.audio);
    const format = typeof body?.format === "string" ? body.format.replace(/[^a-z0-9]/gi, "") : "wav";
    filename = `voice.${format || "wav"}`;
    mime = format === "mp3" ? "audio/mpeg" : format === "ogg" ? "audio/ogg" : "audio/wav";
  }

  if (!audio?.length) return NextResponse.json({ error: "没有收到有效音频" }, { status: 400 });
  if (audio.length > MAX_AUDIO_BYTES) return NextResponse.json({ error: "音频过大，请控制在 12MB 内" }, { status: 413 });

  const upstreamForm = new FormData();
  upstreamForm.append("file", new Blob([new Uint8Array(audio)], { type: mime }), filename);
  upstreamForm.append("model", "FunAudioLLM/SenseVoiceSmall");

  const response = await fetch(SILICONFLOW_STT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstreamForm,
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as { text?: unknown; message?: unknown } | null;
  if (!response.ok) {
    return NextResponse.json(
      { error: typeof result?.message === "string" ? result.message : `硅基流动请求失败：HTTP ${response.status}` },
      { status: response.status },
    );
  }

  const text = typeof result?.text === "string" ? result.text.trim() : "";
  if (!text) return NextResponse.json({ error: "没有识别出文字" }, { status: 422 });
  return NextResponse.json({ text }, { headers: { "Cache-Control": "no-store" } });
}
