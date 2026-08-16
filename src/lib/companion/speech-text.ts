import type { Role } from "@/types/game";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove a model-generated speaker label that the message card already shows. */
export function stripSpeakerPrefix(text: string, speakerName?: string, zeroBasedSeat?: number) {
  let result = String(text ?? "").trim();
  if (!result) return result;

  result = result.replace(/^[“"'`\s]+/, "");
  const seat = typeof zeroBasedSeat === "number" ? zeroBasedSeat + 1 : null;
  const escapedName = speakerName?.trim() ? escapeRegExp(speakerName.trim()) : "";
  const prefixes: RegExp[] = [];

  // Keep the common plain-name form independent from localized character classes.
  // Unicode escapes also avoid the Windows console encoding changing this fallback.
  if (escapedName) prefixes.push(new RegExp(`^${escapedName}\\s*(?:\\uFF1A|:)\\s*`, "i"));

  if (seat !== null && escapedName) {
    prefixes.push(new RegExp(`^${seat}\\s*号(?:玩家)?\\s*${escapedName}\\s*[：:]\\s*`, "i"));
  }
  if (escapedName) prefixes.push(new RegExp(`^${escapedName}\\s*[：:]\\s*`, "i"));
  if (seat !== null) prefixes.push(new RegExp(`^${seat}\\s*号(?:玩家)?\\s*[：:]\\s*`, "i"));

  for (const prefix of prefixes) result = result.replace(prefix, "");
  return result.replace(/^[“"']|[”"']$/g, "").trim();
}

export function stripStageDirections(text: string) {
  return String(text ?? "")
    .replace(/（[^（）]*）|\([^()]*\)|【[^【】]*】|\[[^\[\]]*\]/g, " ")
    .replace(/\s+([，。！？；：,.!?;:])/g, "$1")
    .replace(/([，。！？；：,.!?;:])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Final display safeguard when a model ignores the spoken-only prompt. */
export function cleanGeneratedSpeech(
  text: string,
  speakerName?: string,
  zeroBasedSeat?: number,
  maxCharacters = 160,
) {
  // Models often put a stage direction before their own name. Remove it first so
  // the now-leading speaker label can be matched reliably.
  const cleaned = stripSpeakerPrefix(stripStageDirections(text), speakerName, zeroBasedSeat);
  const characters = Array.from(cleaned);
  if (characters.length <= maxCharacters) return cleaned;
  const clipped = characters.slice(0, Math.max(1, maxCharacters)).join("");
  const lastStop = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("！"), clipped.lastIndexOf("？"));
  if (lastStop >= Math.floor(maxCharacters * 0.55)) return clipped.slice(0, lastStop + 1);
  return `${clipped.replace(/[，、；：,.!?]?$/, "")}……`;
}

/** Text sent to TTS should sound spoken, not read stage directions or protocol labels aloud. */
export function prepareTextForTts(text: string) {
  return stripStageDirections(String(text ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^[“"'`\s]*\d+\s*号(?:玩家)?\s*[^：:\n]{0,20}[：:]\s*/i, "")
  );
}

export interface VoteResultRow {
  targetSeat: number;
  targetName: string;
  voterSeats: number[];
  voteCount: number;
}

export interface ParsedVoteResult {
  title: string;
  results: VoteResultRow[];
}

export interface RoleRevealRow {
  seat: number;
  name: string;
  role: Role;
  isHuman: boolean;
}

export interface ParsedRoleReveal {
  title: string;
  players: RoleRevealRow[];
}

const VALID_ROLES = new Set<Role>([
  "Villager",
  "Werewolf",
  "Seer",
  "Witch",
  "Hunter",
  "Guard",
  "Idiot",
  "WhiteWolfKing",
]);

/** Parse the game-over protocol without exposing player ids or model settings. */
export function parseRoleRevealMessage(text: string): ParsedRoleReveal | null {
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("[ROLE_REVEAL]")) return null;
  try {
    const parsed = JSON.parse(raw.slice("[ROLE_REVEAL]".length)) as Record<string, unknown>;
    const source = Array.isArray(parsed.players) ? parsed.players : [];
    const players = source.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const seat = Number(row.seat);
      const role = row.role;
      if (!Number.isInteger(seat) || seat < 0 || typeof role !== "string" || !VALID_ROLES.has(role as Role)) return [];
      return [{
        seat,
        name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `${seat + 1}号玩家`,
        role: role as Role,
        isHuman: row.isHuman === true,
      }];
    }).sort((a, b) => a.seat - b.seat);
    if (players.length === 0) return null;
    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "身份揭晓",
      players,
    };
  } catch {
    return null;
  }
}

export function parseVoteResultMessage(text: string): ParsedVoteResult | null {
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("[VOTE_RESULT]")) return null;
  try {
    const parsed = JSON.parse(raw.slice("[VOTE_RESULT]".length)) as Record<string, unknown>;
    const source = Array.isArray(parsed.results) ? parsed.results : [];
    const results = source.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const targetSeat = Number(row.targetSeat);
      const voteCount = Number(row.voteCount);
      if (!Number.isFinite(targetSeat) || !Number.isFinite(voteCount)) return [];
      return [{
        targetSeat,
        targetName: typeof row.targetName === "string" ? row.targetName : "",
        voterSeats: Array.isArray(row.voterSeats)
          ? row.voterSeats.map(Number).filter(Number.isFinite)
          : [],
        voteCount,
      }];
    });
    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "投票详情",
      results,
    };
  } catch {
    return null;
  }
}
