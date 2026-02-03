/**
 * 游戏分析数据生成器
 * 从 GameState 解析并生成 GameAnalysisData
 */

import type { GameState, Player, Role, Alignment } from "@/types/game";
import { getSummaryModel } from "@/lib/api-keys";
import type {
  GameAnalysisData,
  TimelineEntry,
  NightEvent,
  DayEvent,
  PlayerSnapshot,
  RoundState,
  PersonalStats,
  PlayerReview,
  PlayerAward,
  VoteRecord,
  DayPhase,
  PlayerSpeech,
  DeathCause,
} from "@/types/analysis";
import { generateJSON } from "@/lib/llm";

const ROLE_ALIGNMENT: Record<Role, Alignment> = {
  Werewolf: "wolf",
  Seer: "village",
  Witch: "village",
  Hunter: "village",
  Guard: "village",
  Villager: "village",
};

interface EvaluationTagRule {
  tag: string;
  condition: (player: Player, state: GameState, stats: AnalysisContext) => boolean;
  priority: number;
}

interface AnalysisContext {
  humanPlayer: Player;
  totalDays: number;
  humanDeathDay: number | null;
  humanKills: number;
  humanSaves: number;
  humanChecks: { wolves: number; villagers: number };
  humanGuards: { success: number; total: number };
  voteAccuracy: number;
  wasFirstNightKilled: boolean;
  gotBadgeByJump: boolean;
  // 新增：女巫相关
  witchSavedWolf: boolean;       // 救了狼人
  witchPoisonedVillager: boolean; // 毒了好人
  sameSaveAndGuard: boolean;     // 同守同救（奶穿）
  // 新增：狼人相关
  selfKnifeFirstNight: boolean;  // 首夜自刀骗药
  survivedAfterCheck: boolean;   // 被查杀后抗推存活
  // 新增：猎人相关
  hunterShot: boolean;           // 是否开枪
}

const SEER_TAGS: EvaluationTagRule[] = [
  { tag: "天妒英才", condition: (_, __, ctx) => ctx.wasFirstNightKilled, priority: 100 },
  { tag: "洞悉之眼", condition: (_, __, ctx) => ctx.humanChecks.wolves >= 2, priority: 95 },
  { tag: "初露锋芒", condition: (_, __, ctx) => ctx.humanChecks.wolves === 1, priority: 90 },
];

const WITCH_TAGS: EvaluationTagRule[] = [
  { tag: "药物冲突", condition: (_, __, ctx) => ctx.sameSaveAndGuard, priority: 100 },
  { tag: "致命毒药", condition: (_, __, ctx) => ctx.humanKills >= 1, priority: 95 },
  { tag: "妙手回春", condition: (_, __, ctx) => ctx.humanSaves >= 1 && !ctx.witchSavedWolf, priority: 90 },
  { tag: "助纣为虐", condition: (_, __, ctx) => ctx.witchSavedWolf, priority: 85 },
  { tag: "误入歧途", condition: (_, __, ctx) => ctx.witchPoisonedVillager, priority: 80 },
];

const GUARD_TAGS: EvaluationTagRule[] = [
  { tag: "致命守护", condition: (_, __, ctx) => ctx.sameSaveAndGuard, priority: 100 },
  { tag: "铜墙铁壁", condition: (_, __, ctx) => ctx.humanGuards.success >= 2, priority: 95 },
  { tag: "坚实盾牌", condition: (_, __, ctx) => ctx.humanGuards.success === 1, priority: 90 },
  { tag: "生锈盾牌", condition: (_, __, ctx) => ctx.humanGuards.success === 0 && ctx.humanGuards.total > 0, priority: 80 },
];

const HUNTER_TAGS: EvaluationTagRule[] = [
  { tag: "一枪致命", condition: (p, state) => {
    const shot = Object.values(state.dayHistory || {}).find(d => d.hunterShot?.hunterSeat === p.seat);
    if (!shot?.hunterShot) return false;
    const target = state.players.find(pl => pl.seat === shot.hunterShot!.targetSeat);
    return target?.role === "Werewolf";
  }, priority: 100 },
  { tag: "擦枪走火", condition: (p, state) => {
    const shot = Object.values(state.dayHistory || {}).find(d => d.hunterShot?.hunterSeat === p.seat);
    if (!shot?.hunterShot) return false;
    const target = state.players.find(pl => pl.seat === shot.hunterShot!.targetSeat);
    return target?.role !== "Werewolf";
  }, priority: 90 },
  { tag: "仁慈之枪", condition: (_, __, ctx) => !ctx.hunterShot, priority: 80 },
];

const WOLF_TAGS: EvaluationTagRule[] = [
  { tag: "孤狼啸月", condition: (p, state) => {
    const wolves = state.players.filter(pl => pl.role === "Werewolf");
    const aliveWolves = wolves.filter(w => w.alive);
    return state.winner === "wolf" && aliveWolves.length === 1 && aliveWolves[0].seat === p.seat;
  }, priority: 100 },
  { tag: "完美猎杀", condition: (_, state) => {
    const wolves = state.players.filter(pl => pl.role === "Werewolf");
    return state.winner === "wolf" && wolves.every(w => w.alive);
  }, priority: 95 },
  { tag: "演技大师", condition: (_, __, ctx) => ctx.gotBadgeByJump, priority: 90 },
  { tag: "绝命赌徒", condition: (_, __, ctx) => ctx.selfKnifeFirstNight, priority: 88 },
  { tag: "绝地反击", condition: (_, __, ctx) => ctx.survivedAfterCheck, priority: 85 },
  { tag: "出师未捷", condition: (p, state) => {
    const firstCheck = state.nightHistory?.[1]?.seerResult;
    return firstCheck?.targetSeat === p.seat && firstCheck?.isWolf;
  }, priority: 80 },
  { tag: "嗜血猎手", condition: (_, state) => state.winner === "wolf", priority: 50 },
  { tag: "长夜难明", condition: (_, state) => state.winner === "village", priority: 40 },
];

const VILLAGER_TAGS: EvaluationTagRule[] = [
  { tag: "明察秋毫", condition: (_, __, ctx) => ctx.voteAccuracy >= 0.5, priority: 80 },
  { tag: "随波逐流", condition: (_, __, ctx) => ctx.voteAccuracy > 0.35 && ctx.voteAccuracy < 0.5, priority: 70 },
  { tag: "全场划水", condition: (_, __, ctx) => ctx.voteAccuracy <= 0.35, priority: 60 },
];

function getTagRulesForRole(role: Role): EvaluationTagRule[] {
  switch (role) {
    case "Seer": return [...SEER_TAGS, ...VILLAGER_TAGS];
    case "Witch": return [...WITCH_TAGS, ...VILLAGER_TAGS];
    case "Guard": return [...GUARD_TAGS, ...VILLAGER_TAGS];
    case "Hunter": return [...HUNTER_TAGS, ...VILLAGER_TAGS];
    case "Werewolf": return WOLF_TAGS;
    default: return VILLAGER_TAGS;
  }
}

function calculateVoteAccuracy(player: Player, state: GameState): number {
  const voteHistory = state.voteHistory || {};
  let totalVotes = 0;
  let correctVotes = 0;

  for (const dayVotes of Object.values(voteHistory)) {
    const playerVote = dayVotes[player.playerId];
    if (playerVote !== undefined) {
      totalVotes++;
      const target = state.players.find(p => p.seat === playerVote);
      if (target?.role === "Werewolf") {
        correctVotes++;
      }
    }
  }

  return totalVotes > 0 ? correctVotes / totalVotes : 0;
}

function buildAnalysisContext(humanPlayer: Player, state: GameState): AnalysisContext {
  const nightHistory = state.nightHistory || {};
  const dayHistory = state.dayHistory || {};
  const totalDays = state.day;
  
  let humanDeathDay: number | null = null;
  let humanKills = 0;
  let humanSaves = 0;
  let humanChecksWolves = 0;
  let humanChecksVillagers = 0;
  let humanGuardsSuccess = 0;
  let humanGuardsTotal = 0;
  let wasFirstNightKilled = false;
  let witchSavedWolf = false;
  let witchPoisonedVillager = false;
  let sameSaveAndGuard = false;
  let selfKnifeFirstNight = false;
  let survivedAfterCheck = false;
  let hunterShot = false;

  for (const [dayStr, nightData] of Object.entries(nightHistory)) {
    const day = parseInt(dayStr, 10);
    
    if (humanPlayer.role === "Witch") {
      if (nightData.witchSave) {
        humanSaves++;
        // 检查是否救了狼人
        if (nightData.wolfTarget !== undefined) {
          const savedTarget = state.players.find(p => p.seat === nightData.wolfTarget);
          if (savedTarget?.role === "Werewolf") {
            witchSavedWolf = true;
          }
        }
      }
      if (nightData.witchPoison !== undefined) {
        humanKills++;
        // 检查是否毒了好人
        const poisonedTarget = state.players.find(p => p.seat === nightData.witchPoison);
        if (poisonedTarget && poisonedTarget.role !== "Werewolf") {
          witchPoisonedVillager = true;
        }
      }
    }
    
    if (humanPlayer.role === "Seer" && nightData.seerResult) {
      if (nightData.seerResult.isWolf) humanChecksWolves++;
      else humanChecksVillagers++;
    }
    
    if (humanPlayer.role === "Guard" && nightData.guardTarget !== undefined) {
      humanGuardsTotal++;
      if (nightData.wolfTarget === nightData.guardTarget && !nightData.deaths?.some(d => d.seat === nightData.guardTarget)) {
        humanGuardsSuccess++;
      }
    }
    
    // 检查同守同救（奶穿）：守卫和女巫同时保护同一目标
    if (nightData.guardTarget !== undefined && nightData.witchSave && 
        nightData.wolfTarget === nightData.guardTarget) {
      sameSaveAndGuard = true;
    }
    
    if (day === 1 && nightData.deaths?.some(d => d.seat === humanPlayer.seat)) {
      wasFirstNightKilled = true;
      humanDeathDay = 1;
    }
    
    // 检查狼人首夜自刀骗药
    if (day === 1 && humanPlayer.role === "Werewolf") {
      if (nightData.wolfTarget === humanPlayer.seat && nightData.witchSave) {
        selfKnifeFirstNight = true;
      }
    }
  }

  // 检查狼人被查杀后是否抗推存活（好人被投出）
  if (humanPlayer.role === "Werewolf") {
    for (const [dayStr, nightData] of Object.entries(nightHistory)) {
      const day = parseInt(dayStr, 10);
      if (nightData.seerResult?.targetSeat === humanPlayer.seat && nightData.seerResult?.isWolf) {
        // 被查杀后，检查当天是否有好人被投出
        const dayData = dayHistory[day];
        if (dayData?.executed) {
          const executedPlayer = state.players.find(p => p.seat === dayData.executed!.seat);
          if (executedPlayer && executedPlayer.role !== "Werewolf") {
            survivedAfterCheck = true;
            break;
          }
        }
      }
    }
  }

  if (!humanPlayer.alive && !humanDeathDay) {
    for (const [dayStr, dayData] of Object.entries(dayHistory)) {
      if (dayData.executed?.seat === humanPlayer.seat) {
        humanDeathDay = parseInt(dayStr, 10);
        break;
      }
    }
  }

  // 检查猎人是否开枪
  if (humanPlayer.role === "Hunter") {
    for (const dayData of Object.values(dayHistory)) {
      if (dayData.hunterShot?.hunterSeat === humanPlayer.seat) {
        hunterShot = true;
        break;
      }
    }
  }

  const gotBadgeByJump = humanPlayer.role === "Werewolf" && state.badge.holderSeat === humanPlayer.seat;

  return {
    humanPlayer,
    totalDays,
    humanDeathDay,
    humanKills,
    humanSaves,
    humanChecks: { wolves: humanChecksWolves, villagers: humanChecksVillagers },
    humanGuards: { success: humanGuardsSuccess, total: humanGuardsTotal },
    voteAccuracy: calculateVoteAccuracy(humanPlayer, state),
    wasFirstNightKilled,
    gotBadgeByJump,
    witchSavedWolf,
    witchPoisonedVillager,
    sameSaveAndGuard,
    selfKnifeFirstNight,
    survivedAfterCheck,
    hunterShot,
  };
}

function evaluateTag(player: Player, state: GameState, ctx: AnalysisContext): string[] {
  const rules = getTagRulesForRole(player.role);
  const matchedTags = rules
    .filter(rule => rule.condition(player, state, ctx))
    .sort((a, b) => b.priority - a.priority);
  
  return matchedTags.length > 0 ? [matchedTags[0].tag] : ["待评估"];
}

function parseDeathCause(reason: string): DeathCause {
  switch (reason) {
    case "wolf": return "killed";
    case "poison": return "poisoned";
    default: return "killed";
  }
}

function buildPlayerSnapshots(state: GameState): PlayerSnapshot[] {
  return state.players.map(player => {
    let deathDay: number | undefined;
    let deathCause: DeathCause | undefined;

    // Check nightHistory for deaths
    for (const [dayStr, nightData] of Object.entries(state.nightHistory || {})) {
      const day = parseInt(dayStr, 10);
      
      // Check deaths array first
      const death = nightData.deaths?.find(d => d.seat === player.seat);
      if (death) {
        deathDay = day;
        deathCause = parseDeathCause(death.reason);
        break;
      }
      
      // Fallback: check wolfTarget if not saved by witch and not protected by guard
      if (!deathDay && nightData.wolfTarget === player.seat) {
        const wasSaved = nightData.witchSave === true;
        const wasProtected = nightData.guardTarget === player.seat;
        if (!wasSaved && !wasProtected) {
          deathDay = day;
          deathCause = "killed";
        }
      }
      
      // Check witch poison
      if (!deathDay && nightData.witchPoison === player.seat) {
        deathDay = day;
        deathCause = "poisoned";
      }
    }

    // Check dayHistory for executions and hunter shots
    if (!deathDay) {
      for (const [dayStr, dayData] of Object.entries(state.dayHistory || {})) {
        if (dayData.executed?.seat === player.seat) {
          deathDay = parseInt(dayStr, 10);
          deathCause = "exiled";
          break;
        }
        if (dayData.hunterShot?.targetSeat === player.seat) {
          deathDay = parseInt(dayStr, 10);
          deathCause = "shot";
          break;
        }
      }
    }

    // Normalize seat to 0-indexed for consistent handling
    // player.seat should always be 0-indexed from game-master initialization
    const normalizedSeat = player.seat;
    
    return {
      seat: normalizedSeat,
      name: player.displayName,
      avatar: player.avatarSeed || player.displayName,
      role: player.role,
      alignment: ROLE_ALIGNMENT[player.role],
      isAlive: player.alive,
      deathDay,
      deathCause,
      isSheriff: state.badge.holderSeat === player.seat,
      isHumanPlayer: player.isHuman,
    };
  });
}

function buildRoundStates(state: GameState, snapshots: PlayerSnapshot[]): RoundState[] {
  const rounds: RoundState[] = [];
  
  rounds.push({
    day: 0,
    phase: "night",
    sheriffSeat: undefined,
    aliveCount: {
      village: snapshots.filter(p => p.alignment === "village").length,
      wolf: snapshots.filter(p => p.alignment === "wolf").length,
    },
    players: snapshots.map(p => ({ ...p, isAlive: true, deathDay: undefined, deathCause: undefined })),
  });

  for (let day = 1; day <= state.day; day++) {
    const playersAtDay = snapshots.map(p => ({
      ...p,
      isAlive: !p.deathDay || p.deathDay > day,
      isSheriff: state.badge.holderSeat === p.seat,
    }));

    const aliveAtDay = playersAtDay.filter(p => p.isAlive);
    
    rounds.push({
      day,
      phase: "day",
      sheriffSeat: state.badge.holderSeat ?? undefined,
      aliveCount: {
        village: aliveAtDay.filter(p => p.alignment === "village").length,
        wolf: aliveAtDay.filter(p => p.alignment === "wolf").length,
      },
      players: playersAtDay,
    });
  }

  return rounds;
}

function parseSummaryBullets(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => String(item));
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.bullets && Array.isArray(obj.bullets)) {
      return obj.bullets.map((item: unknown) => String(item));
    }
    if (obj.summary && typeof obj.summary === "string") {
      return [obj.summary];
    }
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(item => String(item));
      if (parsed?.bullets && Array.isArray(parsed.bullets)) {
        return parsed.bullets.map((item: unknown) => String(item));
      }
      if (parsed?.summary && typeof parsed.summary === "string") {
        return [parsed.summary];
      }
    } catch {
      return [raw];
    }
  }
  return [];
}

function buildTimeline(state: GameState): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (let day = 1; day <= state.day; day++) {
    const nightData = state.nightHistory?.[day];
    const dayData = state.dayHistory?.[day];
    const summaryBullets = parseSummaryBullets(state.dailySummaries?.[day]);

    const nightEvents: NightEvent[] = [];
    
    if (nightData) {
      if (nightData.wolfTarget !== undefined) {
        nightEvents.push({
          type: "kill",
          source: "狼人",
          target: `${nightData.wolfTarget + 1}号`,
          blocked: nightData.guardTarget === nightData.wolfTarget,
        });
      }
      
      if (nightData.witchSave && nightData.wolfTarget !== undefined) {
        nightEvents.push({
          type: "save",
          source: "女巫",
          target: `${nightData.wolfTarget + 1}号`,
        });
      }
      
      if (nightData.witchPoison !== undefined) {
        nightEvents.push({
          type: "poison",
          source: "女巫",
          target: `${nightData.witchPoison + 1}号`,
        });
      }
      
      if (nightData.seerResult) {
        nightEvents.push({
          type: "check",
          source: "预言家",
          target: `${nightData.seerResult.targetSeat + 1}号`,
          result: nightData.seerResult.isWolf ? "狼人" : "好人",
        });
      }
      
      if (nightData.guardTarget !== undefined) {
        nightEvents.push({
          type: "guard",
          source: "守卫",
          target: `${nightData.guardTarget + 1}号`,
        });
      }
    }

    const dayEvents: DayEvent[] = [];
    
    if (dayData?.executed) {
      const voteHistory = state.voteHistory?.[day] || {};
      const votes: VoteRecord[] = Object.entries(voteHistory).map(([oderId, targetSeat]) => {
        const voter = state.players.find(p => p.playerId === oderId);
        return {
          voterSeat: (voter?.seat ?? -1) + 1,
          targetSeat: (targetSeat as number) + 1,
        };
      });

      dayEvents.push({
        type: "exile",
        target: `${dayData.executed.seat + 1}号`,
        voteCount: dayData.executed.votes,
        votes,
      });
    }

    // Build day phases for better organization
    const dayPhases: DayPhase[] = [];
    
    if (day === 1 && state.badge.holderSeat !== null) {
      const badgeVotes = state.badge.history?.[1] || {};
      const votes: VoteRecord[] = Object.entries(badgeVotes).map(([oderId, targetSeat]) => {
        const voter = state.players.find(p => p.playerId === oderId);
        return {
          voterSeat: (voter?.seat ?? -1) + 1,
          targetSeat: (targetSeat as number) + 1,
        };
      });

      // Election phase
      const candidates = state.badge.candidates || [];
      const electionSummary = candidates.length > 0
        ? `${candidates.map(s => `${s + 1}号`).join("、")}上警竞选，${state.badge.holderSeat + 1}号当选警长`
        : `${state.badge.holderSeat + 1}号当选警长`;
      
      dayPhases.push({
        type: "election",
        summary: electionSummary,
        event: {
          type: "badge",
          target: `${state.badge.holderSeat + 1}号`,
          votes,
        },
      });

      dayEvents.push({
        type: "badge",
        target: `${state.badge.holderSeat + 1}号`,
        votes,
      });
    }

    // Discussion phase with per-player speech summaries
    const speeches = extractSpeeches(state, day);
    const discussionSummary = dayData?.executed
      ? `各玩家发言讨论后，${dayData.executed.seat + 1}号被放逐`
      : "各玩家发言讨论";
    
    // 始终创建讨论阶段（即使没有 speeches），包含放逐事件
    const exileEvent = dayEvents.find(e => e.type === "exile");
    dayPhases.push({
      type: "discussion",
      summary: discussionSummary,
      speeches: speeches.length > 0 ? speeches : undefined,
      event: exileEvent,
    });

    entries.push({
      day,
      summary: summaryBullets.join("；") || `第${day}天`,
      nightEvents,
      dayEvents,
      dayPhases: dayPhases.length > 0 ? dayPhases : undefined,
      speeches,
    });
  }

  return entries;
}

function calculateRadarStats(player: Player, state: GameState, ctx: AnalysisContext): PersonalStats["radarStats"] {
  const survivalScore = ctx.humanDeathDay 
    ? Math.round((ctx.humanDeathDay / ctx.totalDays) * 100)
    : 100;

  const isWolf = player.role === "Werewolf";

  if (isWolf) {
    return {
      logic: 70,
      speech: 75,
      survival: survivalScore,
      skillOrHide: 80,
      voteOrTicket: Math.round((1 - ctx.voteAccuracy) * 100),
    };
  }

  let skillValue = 50;
  if (player.role === "Seer") {
    skillValue = ctx.humanChecks.wolves > 0 ? 90 : 60;
  } else if (player.role === "Witch") {
    skillValue = (ctx.humanSaves > 0 || ctx.humanKills > 0) ? 85 : 50;
  } else if (player.role === "Guard") {
    skillValue = ctx.humanGuards.success > 0 ? 90 : 40;
  }

  return {
    logic: 75,
    speech: 80,
    survival: survivalScore,
    skillOrHide: skillValue,
    voteOrTicket: Math.round(ctx.voteAccuracy * 100),
  };
}

function calculateTotalScore(radarStats: PersonalStats["radarStats"]): number {
  const weights = [0.25, 0.2, 0.15, 0.25, 0.15];
  const values = [radarStats.logic, radarStats.speech, radarStats.survival, radarStats.skillOrHide, radarStats.voteOrTicket];
  return Math.round(values.reduce((sum, v, i) => sum + v * weights[i], 0));
}

export async function generateGameAnalysis(
  state: GameState,
  model?: string,
  durationSeconds?: number
): Promise<GameAnalysisData> {
  const resolvedModel = model || getSummaryModel();
  const humanPlayer = state.players.find(p => p.isHuman);
  if (!humanPlayer) {
    throw new Error("No human player found in game state");
  }

  const snapshots = buildPlayerSnapshots(state);
  const roundStates = buildRoundStates(state, snapshots);
  const timeline = buildTimeline(state);
  const ctx = buildAnalysisContext(humanPlayer, state);

  const tags = evaluateTag(humanPlayer, state, ctx);
  const aiData = await generateAIAnalysisData(state, humanPlayer, resolvedModel);
  
  const baseRadarStats = calculateRadarStats(humanPlayer, state, ctx);
  const radarStats = {
    ...baseRadarStats,
    logic: aiData.speechScores?.logic ?? baseRadarStats.logic,
    speech: aiData.speechScores?.clarity ?? baseRadarStats.speech,
  };
  const totalScore = calculateTotalScore(radarStats);

  const personalStats: PersonalStats = {
    role: humanPlayer.role,
    userName: humanPlayer.displayName,
    avatar: humanPlayer.avatarSeed || humanPlayer.displayName,
    alignment: ROLE_ALIGNMENT[humanPlayer.role],
    tags,
    radarStats,
    highlightQuote: aiData.highlightQuote,
    totalScore,
  };

  return {
    gameId: state.gameId,
    timestamp: Date.now(),
    duration: durationSeconds ?? 0,
    playerCount: state.players.length,
    result: state.winner === "wolf" ? "wolf_win" : "village_win",
    awards: aiData.awards,
    timeline,
    players: snapshots,
    roundStates,
    personalStats,
    reviews: aiData.reviews,
  };
}

interface AIAnalysisResult {
  awards: {
    mvp: PlayerAward;
    svp: PlayerAward;
  };
  highlightQuote: string;
  reviews: PlayerReview[];
  speechScores: {
    logic: number;
    clarity: number;
  };
}

async function generateAIAnalysisData(
  state: GameState,
  humanPlayer: Player,
  model: string
): Promise<AIAnalysisResult> {
  const winnerSide = state.winner === "wolf" ? "狼人" : "好人";
  const loserSide = state.winner === "wolf" ? "好人" : "狼人";
  
  const humanAlignment = ROLE_ALIGNMENT[humanPlayer.role];
  const humanAlignmentText = humanAlignment === "wolf" ? "狼人阵营" : "好人阵营";
  
  // 明确区分队友和对手
  const allies = state.players.filter(p => 
    p.playerId !== humanPlayer.playerId && 
    ROLE_ALIGNMENT[p.role] === humanAlignment
  );
  const enemies = state.players.filter(p => 
    ROLE_ALIGNMENT[p.role] !== humanAlignment
  );
  
  const alliesText = allies.length > 0 
    ? allies.map(p => `${p.seat + 1}号 ${p.displayName}`).join("、")
    : "无";
  const enemiesText = enemies.length > 0
    ? enemies.map(p => `${p.seat + 1}号 ${p.displayName}`).join("、")
    : "无";

  const playersSummary = state.players.map(p => 
    `${p.seat + 1}号 ${p.displayName}（${p.role}${p.alive ? "" : "，已出局"}）`
  ).join("\n");

  const historyText = Object.entries(state.dailySummaries || {})
    .map(([day, bullets]) => `第${day}天：${bullets.join("；")}`)
    .join("\n");

  const humanMessages = state.messages
    .filter(m => m.playerName === humanPlayer.displayName && !m.isSystem)
    .map(m => m.content);
  
  const allHumanSpeeches = humanMessages.join("\n");

  const prompt = `你是狼人杀游戏分析师。请根据以下游戏信息生成分析数据。

## 游戏结果
${winnerSide}阵营获胜

## 玩家列表
${playersSummary}

## 被评价玩家信息
- 玩家：${humanPlayer.displayName}（${humanPlayer.seat + 1}号）
- 角色：${humanPlayer.role}
- 阵营：${humanAlignmentText}
- 队友（同阵营）：${alliesText}
- 对手（敌对阵营）：${enemiesText}

## 游戏历史
${historyText}

## 玩家（${humanPlayer.displayName}）的全部发言
${allHumanSpeeches || "（无发言记录）"}

请输出JSON格式的分析数据：
{
  "awards": {
    "mvp": {
      "playerId": "获胜方MVP的玩家ID",
      "playerName": "玩家名称",
      "reason": "简短评价（15字内）",
      "avatar": "与playerName相同",
      "role": "角色英文名"
    },
    "svp": {
      "playerId": "失败方SVP的玩家ID",
      "playerName": "玩家名称",
      "reason": "简短评价（15字内）",
      "avatar": "与playerName相同",
      "role": "角色英文名"
    }
  },
  "highlightQuote": "从玩家发言中选取最有逻辑或最精彩的一句话（原文）",
  "reviews": [
    {
      "fromPlayerId": "评价者ID",
      "fromCharacterName": "评价者名称",
      "avatar": "与fromCharacterName相同",
      "content": "以该角色口吻对${humanPlayer.displayName}的一句话评价（20字内）",
      "relation": "ally或enemy",
      "role": "评价者角色英文名"
    }
  ],
  "speechScores": {
    "logic": "0-100的整数，评估玩家发言的逻辑严密度",
    "clarity": "0-100的整数，评估玩家发言的表达清晰度"
  }
}

要求：
1. MVP从${winnerSide}阵营选，SVP从${loserSide}阵营选
2. reviews必须包含2条队友评价（ally，从「${alliesText}」中选择）和1条对手评价（enemy，从「${enemiesText}」中选择）
3. 【重要】队友是指同一阵营的玩家，对手是指敌对阵营的玩家。${humanAlignmentText}的队友只能是${humanAlignmentText}的其他成员！
4. highlightQuote必须是玩家的原话，如果没有精彩发言则编写一句符合其角色的台词
5. 角色名使用英文：Werewolf, Seer, Witch, Hunter, Guard, Villager
6. speechScores评分标准：
   - logic（逻辑严密度）：分析发言是否有逻辑漏洞、推理是否合理
   - clarity（发言清晰度）：分析表达是否清晰、是否容易理解
   - 如果无发言记录，两项均给50分`;

  try {
    const result = await generateJSON<AIAnalysisResult>({
      model,
      messages: [
        { role: "system", content: "你是专业的狼人杀游戏分析师，擅长评价玩家表现并生成有趣的复盘内容。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return result;
  } catch (error) {
    console.error("AI analysis generation failed:", error);
    return generateFallbackAIData(state, humanPlayer);
  }
}

function generateFallbackAIData(state: GameState, humanPlayer: Player): AIAnalysisResult {
  const winnerPlayers = state.players.filter(p => 
    (state.winner === "wolf" && p.role === "Werewolf") ||
    (state.winner === "village" && p.role !== "Werewolf")
  );
  const loserPlayers = state.players.filter(p => 
    (state.winner === "wolf" && p.role !== "Werewolf") ||
    (state.winner === "village" && p.role === "Werewolf")
  );

  const mvpPlayer = winnerPlayers.find(p => p.alive) || winnerPlayers[0];
  const svpPlayer = loserPlayers.find(p => p.alive) || loserPlayers[0];

  const humanAlignment = ROLE_ALIGNMENT[humanPlayer.role];
  
  // 基于阵营判断队友和对手，而非角色
  const allies = state.players.filter(p => 
    p.playerId !== humanPlayer.playerId && 
    ROLE_ALIGNMENT[p.role] === humanAlignment
  ).slice(0, 2);

  const enemies = state.players.filter(p => 
    ROLE_ALIGNMENT[p.role] !== humanAlignment
  ).slice(0, 1);

  return {
    awards: {
      mvp: {
        playerId: mvpPlayer?.playerId || "unknown",
        playerName: mvpPlayer?.displayName || "MVP",
        reason: state.winner === "wolf" ? "带领狼队获胜" : "守护村庄胜利",
        avatar: mvpPlayer?.displayName || "MVP",
        role: mvpPlayer?.role || "Villager",
      },
      svp: {
        playerId: svpPlayer?.playerId || "unknown",
        playerName: svpPlayer?.displayName || "SVP",
        reason: "虽败犹荣",
        avatar: svpPlayer?.displayName || "SVP",
        role: svpPlayer?.role || "Villager",
      },
    },
    highlightQuote: "这局游戏很精彩！",
    reviews: [
      ...allies.map(p => ({
        fromPlayerId: p.playerId,
        fromCharacterName: p.displayName,
        avatar: p.displayName,
        content: "和你配合很默契！",
        relation: "ally" as const,
        role: p.role,
      })),
      ...enemies.map(p => ({
        fromPlayerId: p.playerId,
        fromCharacterName: p.displayName,
        avatar: p.displayName,
        content: "你是个难缠的对手。",
        relation: "enemy" as const,
        role: p.role,
      })),
    ],
    speechScores: {
      logic: 50,
      clarity: 50,
    },
  };
}

export function extractSpeeches(state: GameState, day: number): PlayerSpeech[] {
  // Use dailySummaryFacts for AI-summarized per-player speech info
  const facts = state.dailySummaryFacts?.[day];
  if (facts && facts.length > 0) {
    // Group facts by speaker, prioritize key actions (claim, vote, suspicion)
    const speechMap = new Map<number, { key: string[]; other: string[] }>();
    const keyTypes = new Set(["claim", "vote", "suspicion", "alignment"]);
    
    for (const fact of facts) {
      if (fact.speakerSeat !== undefined && fact.speakerSeat !== null) {
        const seat = fact.speakerSeat + 1;
        if (!speechMap.has(seat)) {
          speechMap.set(seat, { key: [], other: [] });
        }
        const bucket = speechMap.get(seat)!;
        if (fact.type && keyTypes.has(fact.type)) {
          bucket.key.push(fact.fact);
        } else {
          bucket.other.push(fact.fact);
        }
      }
    }
    
    return Array.from(speechMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([seat, { key, other }]) => {
        // Prioritize key facts, limit to 2 items max for conciseness
        const selected = key.length > 0 ? key.slice(0, 2) : other.slice(0, 1);
        return {
          seat,
          content: selected.join("，") || "发言中",
        };
      });
  }
  
  // Fallback: no speeches if no summary facts (avoid showing raw verbose messages)
  return [];
}
