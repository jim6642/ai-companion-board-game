import { COMPANION_CHARACTERS, type CompanionCharacter } from "./characters";

export interface DirectorMessage {
  speakerId: string;
  text: string;
}

export interface DirectorMemory {
  silenceTurns: Record<string, number>;
  lastSpeakers: string[];
}

export interface DirectorDecision {
  selected: Array<{ character: CompanionCharacter; reason: string; score: number }>;
  skipped: CompanionCharacter[];
  note: string;
  nextMemory: DirectorMemory;
}

const MAX_SPOTLIGHTS = 3;
const MIN_SPOTLIGHTS = 2;

function textHash(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function createDirectorMemory(): DirectorMemory {
  return {
    silenceTurns: Object.fromEntries(COMPANION_CHARACTERS.map((character) => [character.id, 0])),
    lastSpeakers: [],
  };
}

export function directTableTurn(
  playerText: string,
  history: DirectorMessage[],
  memory: DirectorMemory,
): DirectorDecision {
  const normalized = playerText.trim();
  const lastAiMessage = [...history].reverse().find((message) => message.speakerId !== "human");
  const seed = textHash(`${normalized}:${history.length}`);

  const scored = COMPANION_CHARACTERS.map((character, index) => {
    let score = (memory.silenceTurns[character.id] ?? 0) * 8;
    const reasons: string[] = [];

    if (normalized.includes(character.name)) {
      score += 120;
      reasons.push("被玩家点名");
    }
    if (/[?？]|为什么|怎么看|觉得|怀疑|站边|投谁/.test(normalized)) {
      score += 14;
      reasons.push("问题需要回应");
    }
    if (lastAiMessage?.speakerId === character.id) {
      score += 22;
      reasons.push("延续刚才的话题");
    }
    if (memory.lastSpeakers.includes(character.id)) {
      score -= 24;
    }

    score += (seed + index * 17) % 19;
    return {
      character,
      score,
      reason: reasons[0] ?? ((memory.silenceTurns[character.id] ?? 0) >= 2 ? "沉默较久，有新镜头" : "对当前话题有反应"),
    };
  });

  const directMentions = scored.filter((item) => normalized.includes(item.character.name));
  const targetCount = Math.min(
    MAX_SPOTLIGHTS,
    Math.max(MIN_SPOTLIGHTS, directMentions.length, normalized.length > 35 ? 3 : 2),
  );
  const selected = scored.sort((a, b) => b.score - a.score).slice(0, targetCount);
  const selectedIds = new Set(selected.map((item) => item.character.id));
  const skipped = COMPANION_CHARACTERS.filter((character) => !selectedIds.has(character.id));
  const nextSilenceTurns = Object.fromEntries(
    COMPANION_CHARACTERS.map((character) => [
      character.id,
      selectedIds.has(character.id) ? 0 : (memory.silenceTurns[character.id] ?? 0) + 1,
    ]),
  );

  return {
    selected,
    skipped,
    note: skipped.length > 0 ? `其余 ${skipped.length} 人没有新增信息，本轮快速跳过。` : "所有人都有必要回应。",
    nextMemory: {
      silenceTurns: nextSilenceTurns,
      lastSpeakers: selected.map((item) => item.character.id),
    },
  };
}

