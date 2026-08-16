/**
 * Local Aeroplane Chess engine.
 *
 * The state model, exact-finish rule, capture/return-to-base flow, bonus turns,
 * and heuristic bot selection are adapted from the MIT-licensed projects:
 * - avirati/ludo (React + Redux + TypeScript)
 * - RoJac88/ludo-js (vanilla JS local bots)
 *
 * The compact progress representation and Chinese Flying Chess colour-jump /
 * shortcut rules are the integration layer used by this companion prototype.
 */

export type AeroplaneColor = "red" | "blue" | "yellow" | "green";
export type AeroplaneEventKind = "roll" | "takeoff" | "move" | "jump" | "capture" | "finish" | "pass" | "win";
export type AeroplanePhase = "roll" | "move" | "over";

export const AEROPLANE_SHORTCUT = {
  entryProgress: 18,
  exitProgress: 30,
  distance: 12,
} as const;

export const AEROPLANE_COLOR_ORDER: AeroplaneColor[] = ["red", "blue", "yellow", "green"];
export const AEROPLANE_START_OFFSETS: Record<AeroplaneColor, number> = { red: 0, blue: 13, yellow: 26, green: 39 };

export interface AeroplaneShortcutRoute {
  color: AeroplaneColor;
  entryTrackIndex: number;
  exitTrackIndex: number;
}

export const AEROPLANE_SHORTCUT_ROUTES: AeroplaneShortcutRoute[] = AEROPLANE_COLOR_ORDER.map((color) => ({
  color,
  entryTrackIndex: (AEROPLANE_START_OFFSETS[color] + AEROPLANE_SHORTCUT.entryProgress) % 52,
  exitTrackIndex: (AEROPLANE_START_OFFSETS[color] + AEROPLANE_SHORTCUT.exitProgress) % 52,
}));

/** The shortcut owner overrides the ring's repeating base colour at its two marked endpoints. */
export function aeroplaneTrackCellColor(trackIndex: number) {
  const shortcutRoute = AEROPLANE_SHORTCUT_ROUTES.find((route) => (
    route.entryTrackIndex === trackIndex || route.exitTrackIndex === trackIndex
  ));
  return shortcutRoute?.color ?? AEROPLANE_COLOR_ORDER[trackIndex % AEROPLANE_COLOR_ORDER.length];
}

export interface AeroplanePlayerSpec {
  id: string;
  name: string;
  color: AeroplaneColor;
  isHuman?: boolean;
}

export interface AeroplaneTokenView {
  id: string;
  number: number;
  progress: number;
  status: "hangar" | "track" | "home-lane" | "finished";
  trackIndex: number | null;
  canMove: boolean;
}

export interface AeroplanePlayerView extends AeroplanePlayerSpec {
  isCurrent: boolean;
  finishedCount: number;
  airborneCount: number;
  tokens: AeroplaneTokenView[];
}

export interface AeroplaneSnapshot {
  players: AeroplanePlayerView[];
  currentPlayerId: string;
  phase: AeroplanePhase;
  dice: number | null;
  turn: number;
  winnerId: string | null;
  legalTokenIds: string[];
  sixStreak: number;
}

export interface AeroplaneGameEvent {
  id: string;
  kind: AeroplaneEventKind;
  actorId: string;
  actorName: string;
  text: string;
  targetIds: string[];
  significant: boolean;
  dice?: number;
  tokenId?: string;
  jumpType?: "colour" | "shortcut";
}

interface TokenState {
  id: string;
  playerId: string;
  number: number;
  /** -1 = hangar, 0..50 = public track, 51..55 = home lane, 56 = finished. */
  progress: number;
}

const TRACK_LENGTH = 52;
const FINISH_PROGRESS = 56;
const HOME_LANE_START = 51;

function tokenStatus(progress: number): AeroplaneTokenView["status"] {
  if (progress < 0) return "hangar";
  if (progress >= FINISH_PROGRESS) return "finished";
  if (progress >= HOME_LANE_START) return "home-lane";
  return "track";
}

function trackIndexFor(color: AeroplaneColor, progress: number) {
  if (progress < 0 || progress >= HOME_LANE_START) return null;
  return (AEROPLANE_START_OFFSETS[color] + progress) % TRACK_LENGTH;
}

function colourIndexAt(trackIndex: number) {
  return trackIndex % AEROPLANE_COLOR_ORDER.length;
}

export class CompanionAeroplaneEngine {
  private readonly specs: AeroplanePlayerSpec[];
  private readonly humanId: string;
  private readonly random: () => number;
  private tokens: TokenState[];
  private currentPlayerIndex = 0;
  private phase: AeroplanePhase = "roll";
  private dice: number | null = null;
  private winnerId: string | null = null;
  private turn = 1;
  private sixStreak = 0;
  private eventSequence = 1;

  constructor(specs: AeroplanePlayerSpec[], random: () => number = Math.random) {
    if (specs.length !== 4) throw new Error("飞行棋需要正好四位玩家");
    const human = specs.find((player) => player.isHuman);
    if (!human) throw new Error("飞行棋缺少真人玩家");
    if (new Set(specs.map((player) => player.id)).size !== 4) throw new Error("玩家标识不能重复");
    if (new Set(specs.map((player) => player.color)).size !== 4) throw new Error("四位玩家需要使用不同颜色");
    this.specs = specs.map((player) => ({ ...player }));
    this.humanId = human.id;
    this.random = random;
    this.tokens = this.specs.flatMap((player) => Array.from({ length: 4 }, (_, index) => ({
      id: `${player.id}-plane-${index + 1}`,
      playerId: player.id,
      number: index + 1,
      progress: -1,
    })));
  }

  private currentSpec() {
    return this.specs[this.currentPlayerIndex];
  }

  private tokensFor(playerId: string) {
    return this.tokens.filter((token) => token.playerId === playerId);
  }

  private canTokenMove(token: TokenState, dice: number) {
    if (token.progress < 0) return dice === 6;
    if (token.progress >= FINISH_PROGRESS) return false;
    return token.progress + dice <= FINISH_PROGRESS;
  }

  private legalTokens(playerId = this.currentSpec().id, dice = this.dice) {
    if (!dice) return [];
    return this.tokensFor(playerId).filter((token) => this.canTokenMove(token, dice));
  }

  private makeEvent(
    kind: AeroplaneEventKind,
    actor: AeroplanePlayerSpec,
    text: string,
    options: Partial<Pick<AeroplaneGameEvent, "targetIds" | "significant" | "dice" | "tokenId" | "jumpType">> = {},
  ): AeroplaneGameEvent {
    return {
      id: `flight-event-${Date.now()}-${this.eventSequence++}`,
      kind,
      actorId: actor.id,
      actorName: actor.name,
      text,
      targetIds: options.targetIds ?? [],
      significant: options.significant ?? false,
      dice: options.dice,
      tokenId: options.tokenId,
      jumpType: options.jumpType,
    };
  }

  private advanceTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.specs.length;
    this.phase = "roll";
    this.dice = null;
    this.sixStreak = 0;
    this.turn += 1;
  }

  private keepTurn(resetSixStreak: boolean) {
    this.phase = "roll";
    this.dice = null;
    if (resetSixStreak) this.sixStreak = 0;
    this.turn += 1;
  }

  private applyFlightRules(
    token: TokenState,
    events: AeroplaneGameEvent[],
    actor: AeroplanePlayerSpec,
    settleLanding: () => void,
  ) {
    if (token.progress <= 0 || token.progress >= HOME_LANE_START) return;

    // Traditional colour jump: land on your own colour and fly four spaces.
    const landedTrack = trackIndexFor(actor.color, token.progress)!;
    const ownColourIndex = AEROPLANE_COLOR_ORDER.indexOf(actor.color);
    if (colourIndexAt(landedTrack) === ownColourIndex && token.progress + 4 < HOME_LANE_START) {
      token.progress += 4;
      events.push(this.makeEvent("jump", actor, `${actor.name}的${token.number}号飞机踩中同色格，向前跳了4格。`, {
        significant: true,
        tokenId: token.id,
        jumpType: "colour",
      }));
      settleLanding();
    }

    // One clearly visible cross-board shortcut per route.
    if (token.progress === AEROPLANE_SHORTCUT.entryProgress) {
      token.progress = AEROPLANE_SHORTCUT.exitProgress;
      events.push(this.makeEvent("jump", actor, `${actor.name}的${token.number}号飞机穿过中央航线，一口气飞了${AEROPLANE_SHORTCUT.distance}格。`, {
        significant: true,
        tokenId: token.id,
        jumpType: "shortcut",
      }));
      settleLanding();
    }
  }

  private captureAtLanding(token: TokenState, actor: AeroplanePlayerSpec) {
    const landing = trackIndexFor(actor.color, token.progress);
    if (landing === null) return [] as TokenState[];
    const victims = this.tokens.filter((candidate) => {
      if (candidate.playerId === actor.id) return false;
      const owner = this.specs.find((player) => player.id === candidate.playerId)!;
      return trackIndexFor(owner.color, candidate.progress) === landing;
    });
    victims.forEach((victim) => { victim.progress = -1; });
    return victims;
  }

  private previewMove(token: TokenState, dice: number) {
    let progress = token.progress < 0 ? 0 : token.progress + dice;
    let jump = false;
    const landingProgresses = [progress];
    if (progress > 0 && progress < HOME_LANE_START) {
      const owner = this.specs.find((player) => player.id === token.playerId)!;
      const track = trackIndexFor(owner.color, progress)!;
      if (colourIndexAt(track) === AEROPLANE_COLOR_ORDER.indexOf(owner.color) && progress + 4 < HOME_LANE_START) {
        progress += 4;
        landingProgresses.push(progress);
        jump = true;
      }
      if (progress === AEROPLANE_SHORTCUT.entryProgress) {
        progress = AEROPLANE_SHORTCUT.exitProgress;
        landingProgresses.push(progress);
        jump = true;
      }
    }
    const owner = this.specs.find((player) => player.id === token.playerId)!;
    const landings = new Set(landingProgresses.map((value) => trackIndexFor(owner.color, value)).filter((value): value is number => value !== null));
    const captures = this.tokens.filter((candidate) => {
      if (candidate.playerId === token.playerId) return false;
      const candidateOwner = this.specs.find((player) => player.id === candidate.playerId)!;
      const candidateTrack = trackIndexFor(candidateOwner.color, candidate.progress);
      return candidateTrack !== null && landings.has(candidateTrack);
    }).length;
    return { progress, captures, jump, finish: progress === FINISH_PROGRESS };
  }

  /** Heuristic local bot adapted from ludo-js: finish/capture first, then launch/jump/progress. */
  private chooseBotToken(legal: TokenState[], dice: number) {
    return [...legal].sort((a, b) => {
      const score = (token: TokenState) => {
        const preview = this.previewMove(token, dice);
        let value = preview.progress;
        if (preview.finish) value += 1000;
        value += preview.captures * 650;
        if (token.progress < 0) value += 210;
        if (preview.jump) value += 150;
        if (preview.progress >= HOME_LANE_START) value += 120;
        return value;
      };
      return score(b) - score(a) || a.number - b.number;
    })[0];
  }

  snapshot(): AeroplaneSnapshot {
    const current = this.currentSpec();
    const legal = this.phase === "move" ? new Set(this.legalTokens().map((token) => token.id)) : new Set<string>();
    return {
      players: this.specs.map((spec) => {
        const tokens = this.tokensFor(spec.id);
        return {
          ...spec,
          isCurrent: spec.id === current.id,
          finishedCount: tokens.filter((token) => token.progress === FINISH_PROGRESS).length,
          airborneCount: tokens.filter((token) => token.progress >= 0 && token.progress < FINISH_PROGRESS).length,
          tokens: tokens.map((token) => ({
            id: token.id,
            number: token.number,
            progress: token.progress,
            status: tokenStatus(token.progress),
            trackIndex: trackIndexFor(spec.color, token.progress),
            canMove: legal.has(token.id),
          })),
        };
      }),
      currentPlayerId: current.id,
      phase: this.phase,
      dice: this.dice,
      turn: this.turn,
      winnerId: this.winnerId,
      legalTokenIds: [...legal],
      sixStreak: this.sixStreak,
    };
  }

  rollCurrentPlayer(): AeroplaneGameEvent[] {
    if (this.phase !== "roll" || this.winnerId) return [];
    const actor = this.currentSpec();
    const rolled = Math.min(6, Math.max(1, Math.floor(this.random() * 6) + 1));
    this.dice = rolled;
    const events = [this.makeEvent("roll", actor, `${actor.name}掷出了${rolled}点。`, { dice: rolled })];

    if (rolled === 6) this.sixStreak += 1;
    else this.sixStreak = 0;

    if (this.sixStreak >= 3) {
      events.push(this.makeEvent("pass", actor, `${actor.name}连续第三次掷出6点，本次作废并交出回合。`, { significant: true, dice: rolled }));
      this.advanceTurn();
      return events;
    }

    const legal = this.legalTokens(actor.id, rolled);
    if (legal.length === 0) {
      events.push(this.makeEvent("pass", actor, `${actor.name}没有能走的飞机。`));
      if (rolled === 6) this.keepTurn(false);
      else this.advanceTurn();
      return events;
    }

    this.phase = "move";
    return events;
  }

  moveCurrentToken(tokenId: string): AeroplaneGameEvent[] {
    if (this.phase !== "move" || !this.dice || this.winnerId) return [];
    const actor = this.currentSpec();
    const token = this.legalTokens().find((candidate) => candidate.id === tokenId);
    if (!token) throw new Error("这架飞机现在不能移动");

    const rolled = this.dice;
    const events: AeroplaneGameEvent[] = [];
    const victims: TokenState[] = [];
    const settleLanding = () => { victims.push(...this.captureAtLanding(token, actor)); };
    if (token.progress < 0) {
      token.progress = 0;
      events.push(this.makeEvent("takeoff", actor, `${actor.name}让${token.number}号飞机起飞。`, {
        significant: true,
        dice: rolled,
        tokenId: token.id,
      }));
      settleLanding();
    } else {
      token.progress += rolled;
      events.push(this.makeEvent("move", actor, `${actor.name}的${token.number}号飞机前进${rolled}格。`, {
        dice: rolled,
        tokenId: token.id,
      }));
      settleLanding();
      this.applyFlightRules(token, events, actor, settleLanding);
    }

    if (victims.length > 0) {
      const targetIds = [...new Set(victims.map((victim) => victim.playerId))];
      const targetNames = targetIds.map((id) => this.specs.find((player) => player.id === id)?.name).filter(Boolean).join("、");
      events.push(this.makeEvent("capture", actor, `${actor.name}撞回了${targetNames}的${victims.length}架飞机。`, {
        targetIds,
        significant: true,
        dice: rolled,
        tokenId: token.id,
      }));
    }

    const finished = token.progress === FINISH_PROGRESS;
    if (finished) {
      events.push(this.makeEvent("finish", actor, `${actor.name}的${token.number}号飞机抵达终点。`, {
        significant: true,
        dice: rolled,
        tokenId: token.id,
      }));
    }

    const hasWon = this.tokensFor(actor.id).every((candidate) => candidate.progress === FINISH_PROGRESS);
    if (hasWon) {
      this.winnerId = actor.id;
      this.phase = "over";
      this.dice = null;
      events.push(this.makeEvent("win", actor, `${actor.name}率先让四架飞机全部到达终点，赢下这一局。`, {
        significant: true,
      }));
      return events;
    }

    const bonusTurn = rolled === 6 || victims.length > 0 || finished;
    if (bonusTurn) this.keepTurn(rolled !== 6);
    else this.advanceTurn();
    return events;
  }

  /** Roll and choose a local heuristic move for whoever owns the current turn. */
  runAutomatedTurn(): AeroplaneGameEvent[] {
    if (this.winnerId) return [];
    const events = this.rollCurrentPlayer();
    if (this.phase !== "move" || !this.dice) return events;
    const token = this.chooseBotToken(this.legalTokens(), this.dice);
    return token ? [...events, ...this.moveCurrentToken(token.id)] : events;
  }

  isHumanTurn() {
    return this.currentSpec().id === this.humanId;
  }
}
