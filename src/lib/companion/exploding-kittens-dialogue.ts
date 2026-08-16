import type { EKGameEvent } from "@/lib/exploding-kittens/engine";

export type EKDialogueIntent =
  | "explosion-taunt"
  | "lucky-escape"
  | "steal-brag"
  | "deny-reaction"
  | "comfort-player"
  | "challenge-player"
  | "answer-player"
  | "callback"
  | "gloat";

export interface EKRelationshipMemory {
  warmth: number;
  rivalry: number;
  callbacks: string[];
  lastIntent?: EKDialogueIntent;
}

export type EKRelationshipMemories = Record<string, EKRelationshipMemory>;

const INTENTS: Record<EKDialogueIntent, string> = {
  "explosion-taunt": "抓住别人刚出局的瞬间，明着得意或幸灾乐祸，但要带点心虚或玩笑感",
  "lucky-escape": "为自己刚躲过爆炸猫、刚拆弹或刚塞回炸弹而得意，也想拉玩家一起庆幸",
  "steal-brag": "为刚偷到、索要或猫牌得手而邀功，顺便挑逗或暗示玩家下一张还是你的",
  "deny-reaction": "对刚被否决或被偷的牌表达不服或反扑，针对具体那张牌或对方",
  "comfort-player": "接住玩家刚被偷、刚被攻击或被多回合压制的不爽，关心要带具体细节",
  "challenge-player": "和玩家较劲、挑事、追问或放狠话，攻击连环或拿牌堆紧逼时更明显",
  "answer-player": "先直接回答玩家正在说的话，再顺手联系当前牌桌",
  callback: "回扣最近只发生在你和玩家之间的一次偷牌、出局或攻击，让人感觉你真的记得",
  gloat: "为自己即将赢下或刚要淘汰最后一人而得意，但别讲到规则",
};

const CUES: Record<string, string> = {
  "lin-xia": "暗恋玩家，偏心藏在替他担心、记住他刚偷到的牌和轻声维护里；他自己踩到炸弹会很心疼。",
  "su-yao": "嘴硬暗恋玩家，被偷会酸、攻击连环会烦躁；玩家被偷会想安慰但嘴上先损半句。",
  "gu-qinglan": "克制地喜欢玩家，用冷静判断、记住牌堆大小和关键时刻护他表达偏心，不撒娇。",
  "tang-guo": "明着喜欢玩家，敢贴脸庆祝、抢他牌堆的牌、邀功；玩家被偷会心疼但也想偷回来。",
  "chen-hang": "玩家的好兄弟，接梗、拆台、敢互偷，关键时刻护着他；绝不暧昧。",
  "xiao-man": "玩家的成年亲妹妹，只能兄妹斗嘴和家人关心，敢拿他踩炸弹的事开玩笑；严禁暧昧。",
  "shen-ning": "玩家的成年亲姐姐，稳稳接住输赢并提醒他别上头，只有具体亲情关心；严禁暧昧。",
};

function trim(text: string) {
  return Array.from(text.trim()).slice(0, 64).join("");
}

function remember(memory: EKRelationshipMemory, text: string) {
  const line = trim(text);
  if (line) memory.callbacks = [line, ...memory.callbacks.filter((item) => item !== line)].slice(0, 3);
}

export function createEKRelationshipMemories(ids: string[]): EKRelationshipMemories {
  return Object.fromEntries(ids.map((id) => [id, { warmth: 2, rivalry: 1, callbacks: [] }]));
}

export function rememberEKEvents(memories: EKRelationshipMemories, events: EKGameEvent[], humanId: string) {
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

export function rememberEKPlayerLine(memories: EKRelationshipMemories, ids: string[], text: string) {
  for (const id of ids) {
    const memory = memories[id];
    if (!memory) continue;
    memory.warmth = Math.min(5, memory.warmth + 1);
    remember(memory, `玩家刚对你说：“${Array.from(text).slice(0, 40).join("")}”`);
  }
}

export function chooseEKEventIntent(characterId: string, event: EKGameEvent, humanId: string): EKDialogueIntent {
  if (event.kind === "game-win") return event.actorId === characterId ? "gloat" : event.actorId === humanId ? "challenge-player" : "explosion-taunt";
  if (event.kind === "explode") {
    if (event.targetIds.includes(characterId)) return "comfort-player";
    if (event.actorId === humanId) return characterId === "su-yao" || characterId === "chen-hang" ? "challenge-player" : "comfort-player";
    if (event.actorId === characterId) return "lucky-escape";
  }
  if (event.kind === "attack") {
    if (event.targetIds.includes(humanId)) return "challenge-player";
    if (event.actorId === characterId) return "challenge-player";
  }
  if (event.kind === "favor" || event.kind === "cat-combo") {
    if (event.targetIds.includes(humanId)) return characterId === "su-yao" || characterId === "tang-guo" ? "deny-reaction" : "comfort-player";
    if (event.actorId === characterId) return "steal-brag";
  }
  if (event.kind === "defuse") {
    if (event.actorId === humanId) return "comfort-player";
    if (event.actorId === characterId) return "lucky-escape";
  }
  if (event.kind === "nope") {
    if (event.actorId === characterId) return "deny-reaction";
    if (event.actorId === humanId) return "challenge-player";
  }
  if (event.actorId === characterId) return "steal-brag";
  if (event.actorId === humanId) return "answer-player";
  return "answer-player";
}

export function chooseEKChatIntent(characterId: string, text: string): EKDialogueIntent {
  if (/[?？]|为什么|是不是|觉得|怎么|会不会|敢不敢/.test(text)) return "answer-player";
  if (/刚才|上一轮|上次|还记得|又/.test(text)) return "callback";
  if (/偷|抢|被|否决|炸|踩|赢|输|惨/.test(text)) return "challenge-player";
  if (characterId === "tang-guo" || characterId === "su-yao") return "challenge-player";
  return "answer-player";
}

export function describeEKSpeech(characterId: string, intent: EKDialogueIntent, memory?: EKRelationshipMemory) {
  return [
    `本次说话动机：${INTENTS[intent]}。`,
    `人物在炸弹猫里的表现：${CUES[characterId] ?? "像熟悉玩家很久的朋友一样自然说话。"}`,
    `关系状态：${(memory?.warmth ?? 2) >= 4 ? "和玩家已经明显亲近" : "和玩家很熟"}，${(memory?.rivalry ?? 1) >= 3 ? "正在明显较劲" : "胜负心轻轻带着"}。`,
    `最近共同片段：\n${memory?.callbacks.length ? memory.callbacks.map((item) => `- ${item}`).join("\n") : "- 暂无"}`,
    memory?.lastIntent === intent ? "上一句用了同类动机，这次必须换开头和表达。" : "",
  ].filter(Boolean).join("\n");
}

export function markEKSpeech(memories: EKRelationshipMemories, characterId: string, intent: EKDialogueIntent) {
  if (memories[characterId]) memories[characterId].lastIntent = intent;
}
