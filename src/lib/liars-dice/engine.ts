export type LiarsDicePhase = "play" | "round-over" | "game-over";

export interface LiarsDicePlayerSpec {
  id: string;
  name: string;
  isHuman?: boolean;
}

export interface LiarsDiceBid {
  quantity: number;
  face: number;
  bidderId: string;
}

export interface LiarsDiceMove {
  kind: "bid" | "challenge";
  quantity?: number;
  face?: number;
}

export type LiarsDiceEventKind =
  | "round-start"
  | "bid"
  | "challenge"
  | "reveal"
  | "die-lost"
  | "eliminate"
  | "game-win";

export interface LiarsDiceGameEvent {
  id: string;
  kind: LiarsDiceEventKind;
  actorId: string;
  actorName: string;
  targetIds: string[];
  text: string;
  significant: boolean;
}

export interface LiarsDicePlayerView extends LiarsDicePlayerSpec {
  diceRemaining: number;
  active: boolean;
}

export interface LiarsDiceReveal {
  bid: LiarsDiceBid;
  challengerId: string;
  loserId: string;
  actualCount: number;
  dice: Record<string, number[]>;
}

export interface LiarsDiceSnapshot {
  phase: LiarsDicePhase;
  round: number;
  turn: number;
  currentPlayerId: string;
  currentBid: LiarsDiceBid | null;
  players: LiarsDicePlayerView[];
  humanDice: number[];
  totalDice: number;
  bidHistory: LiarsDiceBid[];
  lastReveal: LiarsDiceReveal | null;
  winnerId: string | null;
}

export interface LiarsDiceBotView {
  actorId: string;
  ownDice: number[];
  currentBid: LiarsDiceBid | null;
  totalDice: number;
  players: Array<{ id: string; diceRemaining: number; active: boolean }>;
  legalBids: Array<{ quantity: number; face: number }>;
  bidHistory: LiarsDiceBid[];
}

interface PlayerState extends LiarsDicePlayerSpec {
  diceRemaining: number;
  dice: number[];
}

const STARTING_DICE = 5;

export const LIARS_DICE_FACES = [1, 2, 3, 4, 5, 6] as const;

function binomialAtLeast(trials: number, successes: number, probability: number) {
  if (successes <= 0) return 1;
  if (successes > trials) return 0;
  let sum = 0;
  const combination = (n: number, k: number) => {
    let result = 1;
    for (let index = 1; index <= k; index += 1) result = result * (n - index + 1) / index;
    return result;
  };
  for (let hit = successes; hit <= trials; hit += 1) {
    sum += combination(trials, hit) * probability ** hit * (1 - probability) ** (trials - hit);
  }
  return Math.min(1, sum);
}

export function isLegalLiarsDiceBid(
  bid: Pick<LiarsDiceBid, "quantity" | "face">,
  current: LiarsDiceBid | null,
  totalDice: number,
) {
  if (!Number.isInteger(bid.quantity) || !Number.isInteger(bid.face)) return false;
  if (bid.quantity < 1 || bid.quantity > totalDice || bid.face < 1 || bid.face > 6) return false;
  if (!current) return true;
  if (current.face === 1 && bid.face === 1) return bid.quantity > current.quantity;
  if (current.face !== 1 && bid.face === 1) return bid.quantity >= Math.ceil(current.quantity / 2);
  if (current.face === 1 && bid.face !== 1) return bid.quantity >= current.quantity * 2 + 1;
  return bid.quantity > current.quantity || (bid.quantity === current.quantity && bid.face > current.face);
}

function effectiveOwnCount(dice: number[], face: number) {
  return dice.filter((die) => die === face || (face !== 1 && die === 1)).length;
}

export function chooseLiarsDiceBotMove(view: LiarsDiceBotView, random: () => number = Math.random): LiarsDiceMove {
  const ownCount = (face: number) => effectiveOwnCount(view.ownDice, face);
  const unknownDice = view.totalDice - view.ownDice.length;
  if (view.currentBid) {
    const known = ownCount(view.currentBid.face);
    const needed = view.currentBid.quantity - known;
    const probability = binomialAtLeast(unknownDice, needed, view.currentBid.face === 1 ? 1 / 6 : 1 / 3);
    const pressure = Math.min(0.12, view.bidHistory.length * 0.012);
    const challengeThreshold = 0.16 + pressure + random() * 0.12;
    if (probability < challengeThreshold) return { kind: "challenge" };
  }

  const candidates = view.legalBids.map((bid) => {
    const known = ownCount(bid.face);
    const needed = bid.quantity - known;
    const probability = binomialAtLeast(unknownDice, needed, bid.face === 1 ? 1 / 6 : 1 / 3);
    const ownSupport = known / Math.max(1, view.ownDice.length);
    const raiseCost = view.currentBid ? bid.quantity - view.currentBid.quantity : bid.quantity;
    const facePreference = bid.face === 1 ? -0.06 : ownSupport * 0.38;
    const bluff = random() < 0.1 ? random() * 0.24 : 0;
    return { bid, score: probability + facePreference + bluff - Math.max(0, raiseCost) * 0.035 };
  }).filter(({ score }) => score > 0.24);

  if (candidates.length === 0) {
    if (view.currentBid) return { kind: "challenge" };
    const bestFace = [2, 3, 4, 5, 6].sort((left, right) => ownCount(right) - ownCount(left) || right - left)[0];
    return { kind: "bid", quantity: Math.max(1, ownCount(bestFace)), face: bestFace };
  }
  candidates.sort((left, right) => right.score - left.score || left.bid.quantity - right.bid.quantity || left.bid.face - right.bid.face);
  const choice = candidates[Math.min(candidates.length - 1, Math.floor(random() * Math.min(3, candidates.length)))].bid;
  return { kind: "bid", quantity: choice.quantity, face: choice.face };
}

export class CompanionLiarsDiceEngine {
  readonly humanId: string;
  private readonly random: () => number;
  private readonly players: PlayerState[];
  private phase: LiarsDicePhase = "play";
  private round = 0;
  private turn = 0;
  private currentPlayerId = "";
  private currentBid: LiarsDiceBid | null = null;
  private bidHistory: LiarsDiceBid[] = [];
  private lastReveal: LiarsDiceReveal | null = null;
  private winnerId: string | null = null;
  private eventSequence = 0;

  constructor(specs: LiarsDicePlayerSpec[], random: () => number = Math.random) {
    if (specs.length !== 5) throw new Error("吹牛骰子需要正好五位玩家");
    if (new Set(specs.map((item) => item.id)).size !== specs.length) throw new Error("玩家标识不能重复");
    const humans = specs.filter((item) => item.isHuman);
    if (humans.length !== 1) throw new Error("吹牛骰子需要正好一位真人玩家");
    this.humanId = humans[0].id;
    this.random = random;
    this.players = specs.map((spec) => ({ ...spec, diceRemaining: STARTING_DICE, dice: [] }));
    this.startRound(this.humanId);
  }

  private player(id: string) {
    const player = this.players.find((item) => item.id === id);
    if (!player) throw new Error("找不到这名玩家");
    return player;
  }

  private activePlayers() {
    return this.players.filter((player) => player.diceRemaining > 0);
  }

  private nextActiveId(id: string) {
    const start = this.players.findIndex((player) => player.id === id);
    for (let offset = 1; offset <= this.players.length; offset += 1) {
      const candidate = this.players[(start + offset + this.players.length) % this.players.length];
      if (candidate.diceRemaining > 0) return candidate.id;
    }
    return id;
  }

  private roll(count: number) {
    return Array.from({ length: count }, () => Math.min(6, Math.floor(this.random() * 6) + 1));
  }

  private event(kind: LiarsDiceEventKind, actorId: string, text: string, targetIds: string[] = [], significant = false): LiarsDiceGameEvent {
    const actor = this.player(actorId);
    this.eventSequence += 1;
    return { id: `dice-${this.round}-${this.eventSequence}`, kind, actorId, actorName: actor.name, targetIds, text, significant };
  }

  private startRound(starterId: string) {
    this.round += 1;
    this.turn = 1;
    this.phase = "play";
    this.currentBid = null;
    this.bidHistory = [];
    this.lastReveal = null;
    this.winnerId = null;
    for (const player of this.activePlayers()) player.dice = this.roll(player.diceRemaining);
    this.currentPlayerId = this.player(starterId).diceRemaining > 0 ? starterId : this.nextActiveId(starterId);
  }

  legalBids() {
    if (this.phase !== "play") return [];
    const total = this.activePlayers().reduce((sum, player) => sum + player.diceRemaining, 0);
    const bids: Array<{ quantity: number; face: number }> = [];
    for (let quantity = 1; quantity <= total; quantity += 1) {
      for (const face of LIARS_DICE_FACES) {
        if (isLegalLiarsDiceBid({ quantity, face }, this.currentBid, total)) bids.push({ quantity, face });
      }
    }
    return bids;
  }

  legalMoves() {
    if (this.phase !== "play") return [];
    const bids: LiarsDiceMove[] = this.legalBids().map((bid) => ({ kind: "bid", ...bid }));
    return this.currentBid ? [...bids, { kind: "challenge" as const }] : bids;
  }

  snapshot(): LiarsDiceSnapshot {
    const totalDice = this.activePlayers().reduce((sum, player) => sum + player.diceRemaining, 0);
    return {
      phase: this.phase,
      round: this.round,
      turn: this.turn,
      currentPlayerId: this.currentPlayerId,
      currentBid: this.currentBid ? { ...this.currentBid } : null,
      players: this.players.map(({ dice: _dice, ...player }) => ({ ...player, active: player.diceRemaining > 0 })),
      humanDice: [...this.player(this.humanId).dice],
      totalDice,
      bidHistory: this.bidHistory.map((bid) => ({ ...bid })),
      lastReveal: this.lastReveal ? {
        ...this.lastReveal,
        bid: { ...this.lastReveal.bid },
        dice: Object.fromEntries(Object.entries(this.lastReveal.dice).map(([id, dice]) => [id, [...dice]])),
      } : null,
      winnerId: this.winnerId,
    };
  }

  private countBid(bid: LiarsDiceBid) {
    return this.activePlayers().flatMap((player) => player.dice)
      .filter((die) => die === bid.face || (bid.face !== 1 && die === 1)).length;
  }

  private applyMove(move: LiarsDiceMove) {
    if (this.phase !== "play") throw new Error("当前不能行动");
    const actor = this.player(this.currentPlayerId);
    if (move.kind === "bid") {
      const bid = { quantity: move.quantity ?? 0, face: move.face ?? 0, bidderId: actor.id };
      if (!isLegalLiarsDiceBid(bid, this.currentBid, this.snapshot().totalDice)) throw new Error("这个叫点没有压过上一手");
      this.currentBid = bid;
      this.bidHistory.push(bid);
      const event = this.event("bid", actor.id, `${actor.name}叫了${bid.quantity}个${bid.face}点。`);
      this.currentPlayerId = this.nextActiveId(actor.id);
      this.turn += 1;
      return [event];
    }
    if (!this.currentBid) throw new Error("还没有人叫点，不能质疑");
    const bid = { ...this.currentBid };
    const bidder = this.player(bid.bidderId);
    const actualCount = this.countBid(bid);
    const loser = actualCount >= bid.quantity ? actor : bidder;
    const dice = Object.fromEntries(this.activePlayers().map((player) => [player.id, [...player.dice]]));
    this.lastReveal = { bid, challengerId: actor.id, loserId: loser.id, actualCount, dice };
    const events = [
      this.event("challenge", actor.id, `${actor.name}质疑${bidder.name}的“${bid.quantity}个${bid.face}点”。`, [bidder.id], true),
      this.event("reveal", actor.id, `全桌开盅：实际有${actualCount}个${bid.face}点${bid.face === 1 ? "" : "（1点也算）"}。`, this.activePlayers().map((player) => player.id), true),
    ];
    loser.diceRemaining = Math.max(0, loser.diceRemaining - 1);
    events.push(this.event("die-lost", loser.id, `${loser.name}判断失误，失去一颗骰子，还剩${loser.diceRemaining}颗。`, [loser.id], true));
    if (loser.diceRemaining === 0) events.push(this.event("eliminate", loser.id, `${loser.name}失去最后一颗骰子，离开本局。`, [loser.id], true));
    const remaining = this.activePlayers();
    if (remaining.length === 1) {
      this.phase = "game-over";
      this.winnerId = remaining[0].id;
      events.push(this.event("game-win", remaining[0].id, `${remaining[0].name}成为最后留在桌上的人，赢下整场。`, [remaining[0].id], true));
    } else {
      this.phase = "round-over";
      this.currentPlayerId = loser.diceRemaining > 0 ? loser.id : this.nextActiveId(loser.id);
    }
    return events;
  }

  playHuman(move: LiarsDiceMove) {
    if (this.currentPlayerId !== this.humanId) throw new Error("还没轮到你");
    return this.applyMove(move);
  }

  private botView(actor: PlayerState): LiarsDiceBotView {
    return {
      actorId: actor.id,
      ownDice: [...actor.dice],
      currentBid: this.currentBid ? { ...this.currentBid } : null,
      totalDice: this.snapshot().totalDice,
      players: this.players.map((player) => ({ id: player.id, diceRemaining: player.diceRemaining, active: player.diceRemaining > 0 })),
      legalBids: this.legalBids(),
      bidHistory: this.bidHistory.map((bid) => ({ ...bid })),
    };
  }

  runBotTurn() {
    if (this.phase !== "play") return [];
    const actor = this.player(this.currentPlayerId);
    if (actor.id === this.humanId) return [];
    return this.applyMove(chooseLiarsDiceBotMove(this.botView(actor), this.random));
  }

  startNextRound() {
    if (this.phase !== "round-over") throw new Error("本轮还没有结束");
    const starter = this.currentPlayerId;
    this.startRound(starter);
    return [this.event("round-start", starter, `第${this.round}轮开始，${this.player(starter).name}先叫。`, [starter])];
  }

  isHumanTurn() {
    return this.phase === "play" && this.currentPlayerId === this.humanId;
  }
}
