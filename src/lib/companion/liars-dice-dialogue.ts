import type { LiarsDiceGameEvent } from "@/lib/liars-dice/engine";

export type LiarsDiceDialogueIntent =
  | "bluff-tease"
  | "callout"
  | "caught-reaction"
  | "victory-brag"
  | "comfort-player"
  | "answer-player"
  | "callback";

export interface LiarsDiceRelationshipMemory {
  warmth: number;
  rivalry: number;
  callbacks: string[];
  lastIntent?: LiarsDiceDialogueIntent;
}

export type LiarsDiceRelationshipMemories = Record<string, LiarsDiceRelationshipMemory>;

const INTENTS: Record<LiarsDiceDialogueIntent, string> = {
  "bluff-tease": "围绕刚才那次叫点虚张声势地逗玩家，别讲概率课",
  callout: "抓住玩家或自己刚才的质疑结果，短促地较劲或追问",
  "caught-reaction": "谎被拆穿或质疑失败后真实地嘴硬、认栽或记仇",
  "victory-brag": "为自己开盅占便宜、让别人掉骰或存活而向玩家邀功",
  "comfort-player": "接住玩家掉骰或出局的情绪，用本轮具体细节关心",
  "answer-player": "先回答玩家正在说的话，再顺手联系当前叫点",
  callback: "回扣最近你和玩家之间一次叫点或互相质疑，让人感觉你记得",
};

const CUES: Record<string, string> = {
  "lin-xia": "暗恋玩家，偏心藏在替他缓一口气、记住他刚才的叫点和轻声维护里；被他质疑会有一点委屈。",
  "su-yao": "嘴硬暗恋玩家，爱激他加码，也会因他更关注别人而吃味；输给他后嘴上不服却很在意。",
  "gu-qinglan": "克制地喜欢玩家，用冷静判断、记住叫点轨迹和关键时刻护他表达偏心，不撒娇。",
  "tang-guo": "明着喜欢玩家，敢贴脸诈唬、邀功和要关注；玩家质疑她时会把胜负说得像两个人的赌约。",
  "chen-hang": "玩家的好兄弟，接梗、拆台、敢互骗，关键时刻护着他；绝不暧昧。",
  "xiao-man": "玩家的成年亲妹妹，只能兄妹斗嘴和家人关心，敢拿他平时撒谎的习惯开玩笑；严禁暧昧。",
  "shen-ning": "玩家的成年亲姐姐，稳稳接住输赢并提醒他别上头，只有具体亲情关心；严禁暧昧。",
};

function trim(text: string) {
  return Array.from(text.trim()).slice(0, 64).join("");
}

function remember(memory: LiarsDiceRelationshipMemory, text: string) {
  const line = trim(text);
  if (line) memory.callbacks = [line, ...memory.callbacks.filter((item) => item !== line)].slice(0, 3);
}

export function createLiarsDiceRelationshipMemories(ids: string[]): LiarsDiceRelationshipMemories {
  return Object.fromEntries(ids.map((id) => [id, { warmth: 2, rivalry: 1, callbacks: [] }]));
}

export function rememberLiarsDiceEvents(memories: LiarsDiceRelationshipMemories, events: LiarsDiceGameEvent[], humanId: string) {
  for (const event of events) {
    for (const [id, memory] of Object.entries(memories)) {
      const direct = (event.actorId === id && event.targetIds.includes(humanId)) || (event.actorId === humanId && event.targetIds.includes(id));
      if (direct) {
        memory.warmth = Math.min(5, memory.warmth + 1);
        memory.rivalry = Math.min(5, memory.rivalry + 1);
        remember(memory, event.text);
      } else if (event.significant && (event.actorId === id || event.actorId === humanId)) {
        remember(memory, event.text);
      }
    }
  }
}

export function rememberLiarsDicePlayerLine(memories: LiarsDiceRelationshipMemories, ids: string[], text: string) {
  for (const id of ids) {
    const memory = memories[id];
    if (!memory) continue;
    memory.warmth = Math.min(5, memory.warmth + 1);
    remember(memory, `玩家刚对你说：“${Array.from(text).slice(0, 40).join("")}”`);
  }
}

export function chooseLiarsDiceEventIntent(characterId: string, event: LiarsDiceGameEvent, humanId: string): LiarsDiceDialogueIntent {
  if (event.kind === "game-win") return event.actorId === characterId ? "victory-brag" : event.actorId === humanId ? "callout" : "bluff-tease";
  if (event.kind === "eliminate" || event.kind === "die-lost") {
    if (event.actorId === humanId) return characterId === "su-yao" || characterId === "chen-hang" ? "callout" : "comfort-player";
    if (event.actorId === characterId) return "caught-reaction";
  }
  if (event.kind === "challenge") return event.actorId === characterId ? "callout" : "bluff-tease";
  if (event.kind === "bid") return event.actorId === characterId ? "bluff-tease" : "callout";
  return "bluff-tease";
}

export function chooseLiarsDiceChatIntent(text: string): LiarsDiceDialogueIntent {
  if (/[?？]|为什么|是不是|觉得|怎么|敢不敢/.test(text)) return "answer-player";
  if (/刚才|上一轮|还记得|又/.test(text)) return "callback";
  if (/骗|吹牛|假的|不信|开/.test(text)) return "callout";
  return "answer-player";
}

export function describeLiarsDiceSpeech(characterId: string, intent: LiarsDiceDialogueIntent, memory?: LiarsDiceRelationshipMemory) {
  return [
    `本次说话动机：${INTENTS[intent]}。`,
    `人物在吹牛骰子里的表现：${CUES[characterId] ?? "像熟悉玩家很久的朋友一样自然说话。"}`,
    `关系状态：${(memory?.warmth ?? 2) >= 4 ? "和玩家已经明显亲近" : "和玩家很熟"}，${(memory?.rivalry ?? 1) >= 3 ? "正在明显较劲" : "胜负心轻轻带着"}。`,
    `最近共同片段：\n${memory?.callbacks.length ? memory.callbacks.map((item) => `- ${item}`).join("\n") : "- 暂无"}`,
    memory?.lastIntent === intent ? "上一句用了同类动机，这次必须换开头和表达。" : "",
  ].filter(Boolean).join("\n");
}

export function markLiarsDiceSpeech(memories: LiarsDiceRelationshipMemories, characterId: string, intent: LiarsDiceDialogueIntent) {
  if (memories[characterId]) memories[characterId].lastIntent = intent;
}
