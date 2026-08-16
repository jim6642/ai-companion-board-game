import { NextRequest, NextResponse } from "next/server";
import { getCompanionCharacter } from "@/lib/companion/characters";
import {
  AEROPLANE_INTENT_GUIDES,
  describeAeroplaneRelationshipMemory,
  getAeroplaneDialogueProfile,
  pickAeroplaneExamples,
  type AeroplaneDialogueIntent,
  type AeroplaneRelationshipMemory,
} from "@/lib/companion/aeroplane-dialogue";
import {
  getCompanionModeExample,
  getCompanionModeRules,
  getCompanionModeScene,
  type CompanionPromptMode,
} from "@/lib/companion/mode-prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MINIMAX_CHAT_URL = "https://api.minimaxi.com/v1/chat/completions";
const MINIMAX_TIMEOUT_MS = 30_000;
const MAX_HISTORY_ITEMS = 14;
const MAX_SELECTED_CHARACTERS = 3;

interface HistoryItem {
  speakerId: string;
  speakerName: string;
  text: string;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeModelLine(text: string, characterName: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/[（(][^）)\n]{0,40}[）)]/g, "")
    .replace(new RegExp(`^${characterName}[：:]\\s*`), "")
    .replace(/^[“"]|[”"]$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function clipNaturalLine(text: string, maxCharacters: number) {
  const characters = Array.from(text);
  if (characters.length <= maxCharacters) return text;
  const clipped = characters.slice(0, maxCharacters).join("");
  const lastStop = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("！"), clipped.lastIndexOf("？"));
  if (lastStop >= Math.floor(maxCharacters * 0.55)) return clipped.slice(0, lastStop + 1);
  return `${clipped.replace(/[，、；：,.!?]?$/, "")}……`;
}

function parseAeroplaneMemory(value: unknown): AeroplaneRelationshipMemory | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const validIntents = new Set(Object.keys(AEROPLANE_INTENT_GUIDES));
  const lastIntent = typeof source.lastIntent === "string" && validIntents.has(source.lastIntent)
    ? source.lastIntent as AeroplaneDialogueIntent
    : undefined;
  return {
    warmth: Math.max(0, Math.min(5, Number(source.warmth) || 0)),
    rivalry: Math.max(0, Math.min(5, Number(source.rivalry) || 0)),
    callbacks: Array.isArray(source.callbacks)
      ? source.callbacks.map((item) => cleanText(item, 72)).filter(Boolean).slice(0, 3)
      : [],
    lastIntent,
  };
}

function relationshipRule(relation: string, characterId: string) {
  if (relation === "younger-sister" || relation === "older-sister") {
    return "你与玩家是有血缘关系的成年兄妹，只允许自然亲情、关心和拌嘴。严禁恋爱、暧昧或性暗示。";
  }
  if (relation === "brother") {
    return "你与玩家是多年好兄弟，可以损友式互动和互相维护，但不要暧昧。";
  }
  const crushStyle: Record<string, string> = {
    "lin-xia": "你暗恋玩家已久，温柔关心时常藏不住，偶尔会含蓄地确认玩家是否也在意你。",
    "su-yao": "你暗恋玩家却嘴硬，被忽略会吃醋，关心常表现成追问、损一句再补一句维护。",
    "gu-qinglan": "你克制地暗恋玩家，平时理性，只有维护、记住细节和偶尔直球时会露馅。",
    "tang-guo": "你在明恋玩家，可以自然直球、邀约、吃醋和争取玩家注意，不必假装只是普通朋友。",
  };
  return `${crushStyle[characterId] || "你明显喜欢玩家。"} 好感要在一段对话中持续可感，但不要每句话都夸赞，也不要因此无脑站边。`;
}

function buildPrompt(
  characterId: string,
  mode: CompanionPromptMode,
  playerText: string,
  history: HistoryItem[],
  speechIntent?: AeroplaneDialogueIntent,
  relationshipMemory?: AeroplaneRelationshipMemory,
) {
  const character = getCompanionCharacter(characterId);
  if (!character) return null;

  const place = getCompanionModeScene(mode);
  const recentHistory = history
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => `${cleanText(item.speakerName, 20)}：${cleanText(item.text, 260)}`)
    .join("\n");
  const aeroplaneIntent = speechIntent ?? "quick-reaction";
  const aeroplaneProfile = getAeroplaneDialogueProfile(character.id);
  const aeroplaneExamples = pickAeroplaneExamples(character.id, aeroplaneIntent, playerText);
  const lengthRoll = Array.from(`${character.id}:${playerText}`).reduce((sum, item) => sum + (item.codePointAt(0) ?? 0), 0) % 20;
  const lengthGuide = lengthRoll < 3
    ? "这次只说2到8个字，像脱口而出的极短反应"
    : lengthRoll < 14
      ? "这次只说一句8到24字的短话"
      : "这次说一句或两小句，总共20到45字";

  const system = [
    `你是${character.name}，${character.age}岁。`,
    `人物性格：${character.archetype}。`,
    `语言习惯：${character.speakingStyle}。`,
    mode === "table" ? `狼人杀桌上风格：${character.tableStyle}。` : "",
    relationshipRule(character.relation, character.id),
    `当前场景：${place}。`,
    "回复必须像真实语音聊天：只输出一句或两句自然中文，不写名字前缀，不写括号动作，不解释设定。",
    "可以吐槽观点，但不得辱骂、人身攻击或用难听词贬低玩家。傲娇要表现为嘴硬、追问和隐约关心。",
    "你可以自然聊到历史中明确存在、或玩家主动提起的其他游戏往事；要把它当作共同回忆，不能把往事里的规则、身份和局势当成当前这局的信息，也不能编造不存在的共同经历。",
    ...getCompanionModeRules(mode),
    mode === "aeroplane" ? `你没说出口的当下态度：${aeroplaneProfile.privateAttitude}` : "",
    mode === "aeroplane" ? `说话节奏：${aeroplaneProfile.rhythm}` : "",
    mode === "aeroplane" ? `尤其避免：${aeroplaneProfile.avoid}` : "",
    mode === "aeroplane" ? "不要使用“加油”“没关系”“游戏还没结束”“运气不错”“继续保持”这类脱离具体事件也成立的万能话。" : "",
    mode === "aeroplane" ? "事实纪律：当前触发中明确写出的公开事件和核实标签优先于最近对话。没有核实标签时，不得自行声称谁领先、落后、临近终点、面临撞机或位于某个格子。" : "",
    mode === "aeroplane" ? "下方风格示例只用于模仿人物口吻，不是当前棋局事实，绝不能照搬其中的局势。" : "",
    mode === "aeroplane" ? "" : mode === "table" ? "回复控制在20到70个中文字。" : "回复控制在20到100个中文字。",
  ].join("\n");

  const modeExample = getCompanionModeExample(mode);
  const exampleMessages = mode === "aeroplane"
    ? aeroplaneExamples.flatMap((example) => [
        { role: "sample_message_user", name: "非当前局势的风格示例", content: example.situation },
        { role: "sample_message_ai", name: character.name, content: example.line },
      ])
    : [
        { role: "sample_message_user", name: "玩家", content: modeExample.user },
        {
          role: "sample_message_ai",
          name: character.name,
          content: modeExample.assistant,
        },
      ];

  const finalTask = mode === "aeroplane"
    ? [
        `本次发言动机：${AEROPLANE_INTENT_GUIDES[aeroplaneIntent]}。`,
        describeAeroplaneRelationshipMemory(relationshipMemory),
        relationshipMemory?.lastIntent === aeroplaneIntent
          ? "上一句已经用了相似动机，这次必须换一种开头和表达方式。"
          : "可以自然回扣共同片段，但没有合适回扣就不要硬提。",
        `${lengthGuide}。`,
        `当前触发：${playerText}`,
        `只输出${character.name}现在真正会说出口的话。不要总结，不要解释，不要生成动作。`,
      ].join("\n\n")
    : `玩家刚刚说：${playerText}\n\n请只给出${character.name}现在会说的话。`;

  return {
    character,
    messages: [
      { role: "system", name: character.name, content: system },
      {
        role: "user_system",
        name: "玩家",
        content: "玩家是这群人的共同朋友，也是你长期认识的人。玩家喜欢自然、有来有回的交流。",
      },
      { role: "group", name: place, content: place },
      ...exampleMessages,
      {
        role: "user",
        name: "玩家",
        content: `最近对话：\n${recentHistory || "（这是本轮第一句话）"}\n\n${finalTask}`,
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-minimax-api-key")?.trim() || process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "未配置 MiniMax API Key" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "请求格式错误" }, { status: 400 });

  const playerText = cleanText(body.playerText, 600);
  const mode = body.mode === "private"
    || body.mode === "lobby"
    || body.mode === "uno"
    || body.mode === "aeroplane"
    || body.mode === "love-letter"
    || body.mode === "liars-dice"
    ? body.mode
    : "table";
  const characterIds = Array.isArray(body.characterIds)
    ? [...new Set(body.characterIds.map((id) => cleanText(id, 60)).filter(Boolean))].slice(0, MAX_SELECTED_CHARACTERS)
    : [];
  const history: HistoryItem[] = Array.isArray(body.history)
    ? body.history
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .slice(-MAX_HISTORY_ITEMS)
        .map((item) => ({
          speakerId: cleanText(item.speakerId, 60),
          speakerName: cleanText(item.speakerName, 30),
          text: cleanText(item.text, 300),
        }))
    : [];
  const speechIntents = body.speechIntents && typeof body.speechIntents === "object"
    ? body.speechIntents as Record<string, unknown>
    : {};
  const relationshipMemories = body.relationshipMemories && typeof body.relationshipMemories === "object"
    ? body.relationshipMemories as Record<string, unknown>
    : {};
  const validAeroplaneIntents = new Set(Object.keys(AEROPLANE_INTENT_GUIDES));

  if (!playerText || characterIds.length === 0) {
    return NextResponse.json({ error: "缺少玩家发言或回应角色" }, { status: 400 });
  }

  const prompts = characterIds.map((id) => {
    const rawIntent = speechIntents[id];
    const intent = typeof rawIntent === "string" && validAeroplaneIntents.has(rawIntent)
      ? rawIntent as AeroplaneDialogueIntent
      : undefined;
    return buildPrompt(id, mode, playerText, history, intent, parseAeroplaneMemory(relationshipMemories[id]));
  }).filter(Boolean);
  if (prompts.length === 0) return NextResponse.json({ error: "没有有效角色" }, { status: 400 });

  const replies = await Promise.all(
    prompts.map(async (prompt) => {
      const response = await fetch(MINIMAX_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.MINIMAX_CHAT_MODEL || "M2-her",
          messages: prompt!.messages,
          temperature: 0.9,
          top_p: 0.95,
          max_completion_tokens: mode === "table" ? 180 : 240,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(MINIMAX_TIMEOUT_MS),
      });

      const result = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok) {
        const error = result && typeof result.error === "object" ? JSON.stringify(result.error) : `HTTP ${response.status}`;
        throw new Error(`MiniMax 请求失败：${error}`);
      }

      const choices = Array.isArray(result?.choices) ? result.choices : [];
      const first = choices[0] as { message?: { content?: unknown } } | undefined;
      const sanitized = sanitizeModelLine(cleanText(first?.message?.content, 800), prompt!.character.name);
      const text = mode === "aeroplane" ? clipNaturalLine(sanitized, 70) : sanitized;
      if (!text) throw new Error("MiniMax 返回了空内容");

      return { characterId: prompt!.character.id, text };
    }),
  ).catch((error: unknown) => ({ error: error instanceof Error ? error.message : "MiniMax 请求失败" }));

  if (!Array.isArray(replies)) {
    return NextResponse.json(replies, { status: 502 });
  }

  return NextResponse.json({ replies }, { headers: { "Cache-Control": "no-store" } });
}
