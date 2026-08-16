import type { LoveLetterGameEvent } from "@/lib/love-letter/engine";

export type LoveLetterDialogueIntent =
  | "quick-reaction"
  | "flirty-complaint"
  | "show-off"
  | "comfort-player"
  | "challenge-player"
  | "answer-player"
  | "callback";

export interface LoveLetterRelationshipMemory {
  warmth: number;
  rivalry: number;
  callbacks: string[];
  lastIntent?: LoveLetterDialogueIntent;
}

export type LoveLetterRelationshipMemories = Record<string, LoveLetterRelationshipMemory>;

const INTENT_GUIDES: Record<LoveLetterDialogueIntent, string> = {
  "quick-reaction": "像坐在桌边脱口而出，只回应眼前最值得说的一点",
  "flirty-complaint": "因为很在意玩家而嘴上抱怨，潜台词是想让玩家多关注或哄一下",
  "show-off": "为自己刚才猜中、保住手牌或赢下回合得意，并自然向玩家邀功",
  "comfort-player": "接住玩家刚才的出局或倒霉，关心要具体，不能说万能安慰话",
  "challenge-player": "和玩家较劲、放一句短短的狠话或追问，不刻薄也不复盘规则",
  "answer-player": "先直接回答玩家当前说的话，再自然联系牌桌",
  callback: "回扣最近只发生在你和玩家之间的一件小事，让人感觉你真的记得",
};

const CHARACTER_CUES: Record<string, string> = {
  "lin-xia": "温柔地偏心玩家，担心和喜欢常从一个具体细节露出来；偶尔含蓄确认玩家是否也在意你。",
  "su-yao": "嘴硬暗恋玩家，被猜中或忽略会酸一下；损完通常会漏出半句关心。",
  "gu-qinglan": "克制地喜欢玩家，偏心藏在记住弃牌、及时提醒和很轻的维护里，不撒娇。",
  "tang-guo": "明着喜欢玩家，敢吃醋、邀功和要关注；直球像熟人打闹，不背情话。",
  "chen-hang": "你是玩家的好兄弟，负责接梗和拆台，关键时刻护着他，绝不暧昧。",
  "xiao-man": "你是玩家的成年亲妹妹，只能兄妹拌嘴与家人关心，严禁暧昧。",
  "shen-ning": "你是玩家的成年亲姐姐，关心具体、有边界，只有亲情，严禁暧昧。",
};

function clamp(value: number) {
  return Math.max(0, Math.min(5, value));
}

function remember(memory: LoveLetterRelationshipMemory, text: string) {
  const concise = Array.from(text.trim()).slice(0, 64).join("");
  if (!concise) return;
  memory.callbacks = [concise, ...memory.callbacks.filter((item) => item !== concise)].slice(0, 3);
}

export function createLoveLetterRelationshipMemories(characterIds: string[]): LoveLetterRelationshipMemories {
  return Object.fromEntries(characterIds.map((id) => [id, { warmth: 2, rivalry: 1, callbacks: [] }]));
}

export function rememberLoveLetterEvents(
  memories: LoveLetterRelationshipMemories,
  events: LoveLetterGameEvent[],
  humanId: string,
) {
  for (const event of events) {
    for (const [characterId, memory] of Object.entries(memories)) {
      const direct = (event.actorId === characterId && event.targetIds.includes(humanId))
        || (event.actorId === humanId && event.targetIds.includes(characterId));
      if (direct) {
        memory.warmth = clamp(memory.warmth + 1);
        memory.rivalry = clamp(memory.rivalry + 1);
        remember(memory, event.text);
      } else if (event.significant && (event.actorId === characterId || event.actorId === humanId)) {
        remember(memory, event.text);
      }
    }
  }
}

export function rememberLoveLetterPlayerLine(
  memories: LoveLetterRelationshipMemories,
  responderIds: string[],
  text: string,
) {
  for (const id of responderIds) {
    const memory = memories[id];
    if (!memory) continue;
    memory.warmth = clamp(memory.warmth + 1);
    remember(memory, `玩家刚对你说：“${Array.from(text).slice(0, 40).join("")}”`);
  }
}

export function chooseLoveLetterEventIntent(characterId: string, event: LoveLetterGameEvent, humanId: string): LoveLetterDialogueIntent {
  if (event.kind === "game-win" || event.kind === "round-win") return event.targetIds.includes(characterId) ? "show-off" : event.targetIds.includes(humanId) ? "challenge-player" : "quick-reaction";
  if (event.kind === "eliminate") {
    if (event.targetIds.includes(characterId) && event.actorId === humanId) return "flirty-complaint";
    if (event.targetIds.includes(humanId)) return characterId === "su-yao" || characterId === "chen-hang" ? "challenge-player" : "comfort-player";
    if (event.actorId === characterId) return "show-off";
  }
  if (event.actorId === characterId) return "show-off";
  if (event.actorId === humanId) return characterId === "tang-guo" || characterId === "su-yao" ? "challenge-player" : "quick-reaction";
  return "quick-reaction";
}

export function chooseLoveLetterChatIntent(characterId: string, text: string): LoveLetterDialogueIntent {
  if (/[?？]|为什么|觉得|是不是|会不会|怎么/.test(text)) return "answer-player";
  if (/出局|猜错|倒霉|输了|气|难受/.test(text)) return characterId === "su-yao" || characterId === "chen-hang" ? "challenge-player" : "comfort-player";
  if (/刚才|上轮|还记得|又/.test(text)) return "callback";
  return characterId === "tang-guo" || characterId === "su-yao" ? "challenge-player" : "answer-player";
}

export function describeLoveLetterSpeech(
  characterId: string,
  intent: LoveLetterDialogueIntent,
  memory?: LoveLetterRelationshipMemory,
) {
  const warmth = (memory?.warmth ?? 2) >= 4 ? "你和玩家这一局已经有明显默契" : "你和玩家很熟，互动自然";
  const rivalry = (memory?.rivalry ?? 1) >= 3 ? "你们正在明显较劲" : "胜负心只是轻轻带着";
  const callbacks = memory?.callbacks.length ? memory.callbacks.map((item) => `- ${item}`).join("\n") : "- 暂无适合回扣的小事";
  return [
    `本次说话动机：${INTENT_GUIDES[intent]}。`,
    `人物在本游戏里的表现：${CHARACTER_CUES[characterId] ?? "像认识很久的朋友一样自然回应玩家。"}`,
    `关系手感：${warmth}，${rivalry}。`,
    `最近共同片段：\n${callbacks}`,
    memory?.lastIntent === intent ? "上一句用了相似动机，这次必须换开头和表达方式。" : "",
  ].filter(Boolean).join("\n");
}

export function markLoveLetterSpeech(
  memories: LoveLetterRelationshipMemories,
  characterId: string,
  intent: LoveLetterDialogueIntent,
) {
  if (memories[characterId]) memories[characterId].lastIntent = intent;
}

