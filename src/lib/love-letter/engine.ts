/**
 * Classic four-player Love Letter rules engine.
 *
 * Rules follow the publisher's currently supported classic variant: remove the
 * Spy and Chancellor cards (and one Guard) from the 21-card edition, leaving
 * the familiar 16-card deck. Bot ideas are adapted from brucehow/loveletter's
 * MIT-licensed probability/priority agent, but operate only on a sanitized
 * information view so bots cannot inspect hidden hands.
 */

export type LoveLetterCardKind =
  | "guard"
  | "priest"
  | "baron"
  | "handmaid"
  | "prince"
  | "king"
  | "countess"
  | "princess";

export type LoveLetterPhase = "play" | "round-over" | "game-over";

export interface LoveLetterPlayerSpec {
  id: string;
  name: string;
  isHuman?: boolean;
}

export interface LoveLetterCard {
  id: string;
  kind: LoveLetterCardKind;
  value: number;
  name: string;
  effect: string;
}

export interface LoveLetterMove {
  cardId: string;
  targetId?: string;
  guess?: Exclude<LoveLetterCardKind, "guard">;
}

export interface LoveLetterPlayerView extends LoveLetterPlayerSpec {
  favor: number;
  active: boolean;
  protected: boolean;
  isCurrent: boolean;
  handCount: number;
  knownHand: LoveLetterCard | null;
  discards: LoveLetterCard[];
}

export interface LoveLetterSnapshot {
  players: LoveLetterPlayerView[];
  humanHand: LoveLetterCard[];
  currentPlayerId: string;
  phase: LoveLetterPhase;
  round: number;
  turn: number;
  deckCount: number;
  roundWinnerIds: string[];
  gameWinnerIds: string[];
  legalCardIds: string[];
  legalTargetIds: string[];
  pendingCardId: string | null;
  privateNotice: string | null;
}

export type LoveLetterEventKind =
  | "round-start"
  | "draw"
  | "play"
  | "reveal"
  | "protect"
  | "eliminate"
  | "swap"
  | "discard"
  | "round-win"
  | "game-win";

export interface LoveLetterGameEvent {
  id: string;
  kind: LoveLetterEventKind;
  actorId: string;
  actorName: string;
  text: string;
  targetIds: string[];
  significant: boolean;
  card?: LoveLetterCard;
}

interface PlayerState extends LoveLetterPlayerSpec {
  favor: number;
  active: boolean;
  protected: boolean;
  hand: LoveLetterCard[];
  discards: LoveLetterCard[];
}

export interface LoveLetterBotView {
  actorId: string;
  ownHand: LoveLetterCard[];
  opponents: Array<{
    id: string;
    favor: number;
    active: boolean;
    protected: boolean;
    knownCard: LoveLetterCardKind | null;
  }>;
  publicDiscards: LoveLetterCardKind[];
  legalMoves: LoveLetterMove[];
}

const CARD_DEFINITIONS: Record<LoveLetterCardKind, Omit<LoveLetterCard, "id"> & { count: number }> = {
  guard: { kind: "guard", value: 1, name: "侍卫", effect: "猜中一名玩家的手牌即可将其淘汰", count: 5 },
  priest: { kind: "priest", value: 2, name: "牧师", effect: "秘密查看一名玩家的手牌", count: 2 },
  baron: { kind: "baron", value: 3, name: "男爵", effect: "与一名玩家秘密比牌，点数较低者淘汰", count: 2 },
  handmaid: { kind: "handmaid", value: 4, name: "侍女", effect: "直到你的下回合前不受其他玩家影响", count: 2 },
  prince: { kind: "prince", value: 5, name: "王子", effect: "令一名玩家弃掉手牌并重新摸一张", count: 2 },
  king: { kind: "king", value: 6, name: "国王", effect: "与一名玩家交换手牌", count: 1 },
  countess: { kind: "countess", value: 7, name: "伯爵夫人", effect: "与国王或王子同手时必须打出", count: 1 },
  princess: { kind: "princess", value: 8, name: "公主", effect: "一旦打出或被弃掉，你立即淘汰", count: 1 },
};

export const LOVE_LETTER_CARD_KINDS = Object.keys(CARD_DEFINITIONS) as LoveLetterCardKind[];
export const LOVE_LETTER_GUESS_KINDS = LOVE_LETTER_CARD_KINDS.filter(
  (kind): kind is Exclude<LoveLetterCardKind, "guard"> => kind !== "guard",
);
export const LOVE_LETTER_WIN_FAVOR = 4;

export function loveLetterCardDefinition(kind: LoveLetterCardKind) {
  return CARD_DEFINITIONS[kind];
}

function copyCard(card: LoveLetterCard) {
  return { ...card };
}

function moveKey(move: LoveLetterMove) {
  return `${move.cardId}:${move.targetId ?? ""}:${move.guess ?? ""}`;
}

function weightedUnseen(view: LoveLetterBotView) {
  const counts = Object.fromEntries(
    LOVE_LETTER_CARD_KINDS.map((kind) => [kind, CARD_DEFINITIONS[kind].count]),
  ) as Record<LoveLetterCardKind, number>;
  for (const card of view.ownHand) counts[card.kind] -= 1;
  for (const kind of view.publicDiscards) counts[kind] -= 1;
  return counts;
}

/** Select a legal move without access to the engine's hidden hands or deck order. */
export function chooseLoveLetterBotMove(view: LoveLetterBotView, random: () => number = Math.random) {
  if (view.legalMoves.length === 0) throw new Error("机器人没有合法行动");
  const unseen = weightedUnseen(view);
  const actor = view.opponents.find((item) => item.id === view.actorId);
  const scores = view.legalMoves.map((move) => {
    const played = view.ownHand.find((card) => card.id === move.cardId)!;
    const kept = view.ownHand.find((card) => card.id !== move.cardId);
    const target = view.opponents.find((item) => item.id === move.targetId);
    let score = kept ? kept.value * 1.7 : 0;

    if (played.kind === "princess") score -= 1000;
    if (played.kind === "countess") score += kept && (kept.kind === "king" || kept.kind === "prince") ? 1000 : 1;
    if (played.kind === "handmaid") score += 10 + view.opponents.filter((item) => item.active && item.id !== view.actorId).length;
    if (played.kind === "priest") score += target?.knownCard ? 2 : 9 + (target?.favor ?? 0);
    if (played.kind === "guard") {
      const exact = target?.knownCard && target.knownCard !== "guard" && move.guess === target.knownCard;
      score += exact ? 100 : 8 + unseen[move.guess ?? "priest"] * 0.8 + (target?.favor ?? 0);
    }
    if (played.kind === "baron") {
      const knownValue = target?.knownCard ? CARD_DEFINITIONS[target.knownCard].value : null;
      score += knownValue === null
        ? (kept?.value ?? 0) >= 5 ? 12 : (kept?.value ?? 0) - 3
        : (kept?.value ?? 0) > knownValue ? 80 : (kept?.value ?? 0) === knownValue ? 2 : -80;
    }
    if (played.kind === "prince") {
      if (target?.knownCard === "princess") score += 120;
      else if (target?.knownCard) score += CARD_DEFINITIONS[target.knownCard].value * 4;
      else if (move.targetId === view.actorId) score += (kept?.value ?? 0) <= 2 ? 10 : -12;
      else score += 8 + (target?.favor ?? 0);
    }
    if (played.kind === "king") {
      const knownValue = target?.knownCard ? CARD_DEFINITIONS[target.knownCard].value : 4.5;
      score += knownValue - (kept?.value ?? 0) + (target?.favor ?? 0);
    }
    score += (actor?.favor ?? 0) * 0.1;
    score += random() * 0.35;
    return { move, score };
  });
  scores.sort((left, right) => right.score - left.score || moveKey(left.move).localeCompare(moveKey(right.move)));
  return scores[0].move;
}

export class CompanionLoveLetterEngine {
  private readonly specs: LoveLetterPlayerSpec[];
  private readonly humanId: string;
  private readonly random: () => number;
  private players: PlayerState[];
  private deck: LoveLetterCard[] = [];
  private setAside: LoveLetterCard | null = null;
  private currentPlayerIndex = 0;
  private phase: LoveLetterPhase = "play";
  private round = 1;
  private turn = 1;
  private cardSequence = 1;
  private eventSequence = 1;
  private roundWinnerIds: string[] = [];
  private gameWinnerIds: string[] = [];
  private privateNotices: Record<string, string | null> = {};
  private knowledge: Record<string, Record<string, LoveLetterCardKind | null>> = {};

  constructor(specs: LoveLetterPlayerSpec[], random: () => number = Math.random) {
    if (specs.length !== 4) throw new Error("经典情书需要正好四位玩家");
    const human = specs.find((player) => player.isHuman);
    if (!human) throw new Error("情书牌桌缺少真人玩家");
    if (new Set(specs.map((player) => player.id)).size !== specs.length) throw new Error("玩家标识不能重复");
    this.specs = specs.map((item) => ({ ...item }));
    this.humanId = human.id;
    this.random = random;
    this.players = this.specs.map((item) => ({
      ...item,
      favor: 0,
      active: true,
      protected: false,
      hand: [],
      discards: [],
    }));
    this.startRound(this.humanId);
  }

  private player(id: string) {
    const player = this.players.find((item) => item.id === id);
    if (!player) throw new Error("找不到这名玩家");
    return player;
  }

  private currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  private makeDeck() {
    const cards: LoveLetterCard[] = [];
    for (const kind of LOVE_LETTER_CARD_KINDS) {
      const definition = CARD_DEFINITIONS[kind];
      for (let index = 0; index < definition.count; index += 1) {
        cards.push({ id: `letter-r${this.round}-${this.cardSequence++}`, ...definition });
      }
    }
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.random() * (index + 1));
      [cards[index], cards[target]] = [cards[target], cards[index]];
    }
    return cards;
  }

  private clearKnowledgeOf(targetId: string) {
    for (const observer of Object.keys(this.knowledge)) this.knowledge[observer][targetId] = null;
  }

  private setKnowledge(observerId: string, targetId: string, card: LoveLetterCard | undefined) {
    this.knowledge[observerId] ??= {};
    this.knowledge[observerId][targetId] = card?.kind ?? null;
  }

  private draw(player: PlayerState, allowSetAside = false) {
    const card = this.deck.pop() ?? (allowSetAside ? this.setAside : null);
    if (!card) return null;
    if (card === this.setAside) this.setAside = null;
    player.hand.push(card);
    this.clearKnowledgeOf(player.id);
    return card;
  }

  private prepareTurn() {
    if (this.phase !== "play") return;
    const current = this.currentPlayer();
    current.protected = false;
    this.privateNotices[current.id] = null;
    const drawn = this.draw(current);
    if (!drawn) {
      this.finishRound();
      return;
    }
  }

  private startRound(firstPlayerId: string) {
    this.phase = "play";
    this.roundWinnerIds = [];
    this.privateNotices = Object.fromEntries(this.specs.map((item) => [item.id, null]));
    this.knowledge = Object.fromEntries(
      this.specs.map((observer) => [observer.id, Object.fromEntries(this.specs.map((target) => [target.id, null]))]),
    );
    this.players.forEach((player) => {
      player.active = true;
      player.protected = false;
      player.hand = [];
      player.discards = [];
    });
    this.deck = this.makeDeck();
    this.setAside = this.deck.pop() ?? null;
    this.players.forEach((player) => this.draw(player));
    this.currentPlayerIndex = Math.max(0, this.players.findIndex((player) => player.id === firstPlayerId));
    this.prepareTurn();
  }

  private event(
    kind: LoveLetterEventKind,
    actor: PlayerState,
    text: string,
    options: { targets?: string[]; significant?: boolean; card?: LoveLetterCard } = {},
  ): LoveLetterGameEvent {
    return {
      id: `letter-event-${this.eventSequence++}`,
      kind,
      actorId: actor.id,
      actorName: actor.name,
      text,
      targetIds: options.targets ?? [],
      significant: options.significant ?? false,
      card: options.card ? copyCard(options.card) : undefined,
    };
  }

  private availableTargets(actorId: string, kind: LoveLetterCardKind) {
    if (kind === "handmaid" || kind === "countess" || kind === "princess") return [];
    const others = this.players.filter((player) => player.active && player.id !== actorId && !player.protected);
    if (kind === "prince") return [actorId, ...others.map((player) => player.id)];
    return others.map((player) => player.id);
  }

  private playableCards(player: PlayerState) {
    const countess = player.hand.find((card) => card.kind === "countess");
    const forced = countess && player.hand.some((card) => card.kind === "king" || card.kind === "prince");
    return forced ? [countess] : [...player.hand];
  }

  private legalMovesFor(player: PlayerState) {
    const moves: LoveLetterMove[] = [];
    for (const card of this.playableCards(player)) {
      const targets = this.availableTargets(player.id, card.kind);
      if (card.kind === "guard") {
        if (targets.length === 0) moves.push({ cardId: card.id });
        else for (const targetId of targets) for (const guess of LOVE_LETTER_GUESS_KINDS) moves.push({ cardId: card.id, targetId, guess });
      } else if (card.kind === "priest" || card.kind === "baron" || card.kind === "king") {
        if (targets.length === 0) moves.push({ cardId: card.id });
        else targets.forEach((targetId) => moves.push({ cardId: card.id, targetId }));
      } else if (card.kind === "prince") {
        targets.forEach((targetId) => moves.push({ cardId: card.id, targetId }));
      } else {
        moves.push({ cardId: card.id });
      }
    }
    return moves;
  }

  legalMoves() {
    if (this.phase !== "play") return [];
    return this.legalMovesFor(this.currentPlayer()).map((move) => ({ ...move }));
  }

  snapshot(): LoveLetterSnapshot {
    const current = this.currentPlayer();
    const human = this.player(this.humanId);
    const legalMoves = current.id === this.humanId && this.phase === "play" ? this.legalMovesFor(current) : [];
    const legalCardIds = [...new Set(legalMoves.map((move) => move.cardId))];
    return {
      players: this.players.map((player) => ({
        id: player.id,
        name: player.name,
        isHuman: player.isHuman,
        favor: player.favor,
        active: player.active,
        protected: player.protected,
        isCurrent: this.phase === "play" && player.id === current.id,
        handCount: player.hand.length,
        knownHand: player.id === this.humanId
          ? player.hand[0] ? copyCard(player.hand[0]) : null
          : this.knowledge[this.humanId]?.[player.id]
            ? { id: `known-${player.id}`, ...CARD_DEFINITIONS[this.knowledge[this.humanId][player.id]!] }
            : null,
        discards: player.discards.map(copyCard),
      })),
      humanHand: human.hand.map(copyCard),
      currentPlayerId: current.id,
      phase: this.phase,
      round: this.round,
      turn: this.turn,
      deckCount: this.deck.length,
      roundWinnerIds: [...this.roundWinnerIds],
      gameWinnerIds: [...this.gameWinnerIds],
      legalCardIds,
      legalTargetIds: [...new Set(legalMoves.map((move) => move.targetId).filter((id): id is string => Boolean(id)))],
      pendingCardId: null,
      privateNotice: this.privateNotices[this.humanId] ?? null,
    };
  }

  private eliminate(player: PlayerState, actor: PlayerState, reason: string, events: LoveLetterGameEvent[]) {
    if (!player.active) return;
    player.active = false;
    player.protected = false;
    const discarded = player.hand.splice(0);
    player.discards.push(...discarded);
    this.clearKnowledgeOf(player.id);
    events.push(this.event("eliminate", actor, `${player.name}${reason}，本轮出局。`, {
      targets: [player.id],
      significant: true,
      card: discarded[0],
    }));
  }

  private resolveEffect(actor: PlayerState, played: LoveLetterCard, move: LoveLetterMove, events: LoveLetterGameEvent[]) {
    const target = move.targetId ? this.player(move.targetId) : null;
    const remaining = actor.hand[0];
    switch (played.kind) {
      case "guard": {
        if (!target || !move.guess) break;
        const guessed = CARD_DEFINITIONS[move.guess];
        events.push(this.event("reveal", actor, `${actor.name}猜${target.name}手里是${guessed.name}。`, { targets: [target.id], significant: true }));
        if (target.hand[0]?.kind === move.guess) this.eliminate(target, actor, "被侍卫猜中了手牌", events);
        break;
      }
      case "priest": {
        if (!target) break;
        this.setKnowledge(actor.id, target.id, target.hand[0]);
        this.privateNotices[actor.id] = `${target.name}的手牌是${target.hand[0]?.name ?? "未知"}。`;
        events.push(this.event("reveal", actor, `${actor.name}秘密查看了${target.name}的手牌。`, { targets: [target.id] }));
        break;
      }
      case "baron": {
        if (!target || !remaining || !target.hand[0]) break;
        if (remaining.value > target.hand[0].value) this.eliminate(target, actor, "与男爵比牌落败", events);
        else if (remaining.value < target.hand[0].value) this.eliminate(actor, actor, "与男爵比牌落败", events);
        else events.push(this.event("reveal", actor, `${actor.name}与${target.name}比牌平手，双方都留在本轮。`, { targets: [target.id], significant: true }));
        break;
      }
      case "handmaid":
        actor.protected = true;
        events.push(this.event("protect", actor, `${actor.name}受到侍女保护，直到下回合前不能被其他人指定。`, { significant: true }));
        break;
      case "prince": {
        if (!target) break;
        const discarded = target.hand.shift();
        if (discarded) {
          target.discards.push(discarded);
          this.clearKnowledgeOf(target.id);
          events.push(this.event("discard", actor, `${target.name}被王子要求弃掉了${discarded.name}。`, { targets: [target.id], significant: true, card: discarded }));
          if (discarded.kind === "princess") this.eliminate(target, actor, "弃掉了公主", events);
          else this.draw(target, true);
        }
        break;
      }
      case "king": {
        if (!target || !remaining || !target.hand[0]) break;
        const targetCard = target.hand[0];
        actor.hand[0] = targetCard;
        target.hand[0] = remaining;
        this.clearKnowledgeOf(actor.id);
        this.clearKnowledgeOf(target.id);
        this.setKnowledge(actor.id, target.id, remaining);
        this.setKnowledge(target.id, actor.id, targetCard);
        if (actor.id === this.humanId) this.privateNotices[actor.id] = `你从${target.name}手中换到了${targetCard.name}。`;
        if (target.id === this.humanId) this.privateNotices[target.id] = `${actor.name}与你交换手牌，你拿到了${remaining.name}。`;
        events.push(this.event("swap", actor, `${actor.name}与${target.name}交换了手牌。`, { targets: [target.id], significant: true }));
        break;
      }
      case "princess":
        this.eliminate(actor, actor, "打出了公主", events);
        break;
      case "countess":
        break;
    }
  }

  private advanceTurn() {
    if (this.phase !== "play") return;
    for (let offset = 1; offset <= this.players.length; offset += 1) {
      const index = (this.currentPlayerIndex + offset) % this.players.length;
      if (this.players[index].active) {
        this.currentPlayerIndex = index;
        this.turn += 1;
        this.prepareTurn();
        return;
      }
    }
  }

  private finishRound(events: LoveLetterGameEvent[] = []) {
    if (this.phase !== "play") return events;
    const active = this.players.filter((player) => player.active);
    const highest = Math.max(...active.map((player) => player.hand[0]?.value ?? -1));
    const winners = active.length === 1 ? active : active.filter((player) => (player.hand[0]?.value ?? -1) === highest);
    this.roundWinnerIds = winners.map((player) => player.id);
    winners.forEach((player) => { player.favor += 1; });
    const narrator = winners[0] ?? this.currentPlayer();
    events.push(this.event(
      "round-win",
      narrator,
      winners.length === 1
        ? `${winners[0].name}赢下第${this.round}轮，获得一枚好感标记。`
        : `${winners.map((player) => player.name).join("、")}并列赢下第${this.round}轮，各获得一枚好感标记。`,
      { targets: this.roundWinnerIds, significant: true },
    ));
    this.gameWinnerIds = this.players.filter((player) => player.favor >= LOVE_LETTER_WIN_FAVOR).map((player) => player.id);
    if (this.gameWinnerIds.length > 0) {
      this.phase = "game-over";
      events.push(this.event(
        "game-win",
        this.player(this.gameWinnerIds[0]),
        `${this.gameWinnerIds.map((id) => this.player(id).name).join("、")}集齐四枚好感标记，赢下整场游戏！`,
        { targets: this.gameWinnerIds, significant: true },
      ));
    } else {
      this.phase = "round-over";
    }
    return events;
  }

  private applyMove(move: LoveLetterMove) {
    if (this.phase !== "play") throw new Error("当前不能出牌");
    const actor = this.currentPlayer();
    const legal = this.legalMovesFor(actor).find((candidate) => moveKey(candidate) === moveKey(move));
    if (!legal) throw new Error("这不是当前可执行的行动");
    const cardIndex = actor.hand.findIndex((card) => card.id === move.cardId);
    const played = actor.hand.splice(cardIndex, 1)[0];
    actor.discards.push(played);
    this.clearKnowledgeOf(actor.id);
    const events = [this.event("play", actor, `${actor.name}打出了${played.name}。`, { card: played })];
    this.resolveEffect(actor, played, move, events);
    const activeCount = this.players.filter((player) => player.active).length;
    if (activeCount <= 1 || this.deck.length === 0) this.finishRound(events);
    else this.advanceTurn();
    return events;
  }

  playHuman(move: LoveLetterMove) {
    if (this.currentPlayer().id !== this.humanId) throw new Error("还没轮到你");
    return this.applyMove(move);
  }

  private botView(actor: PlayerState): LoveLetterBotView {
    return {
      actorId: actor.id,
      ownHand: actor.hand.map(copyCard),
      opponents: this.players.map((player) => ({
        id: player.id,
        favor: player.favor,
        active: player.active,
        protected: player.protected,
        knownCard: this.knowledge[actor.id]?.[player.id] ?? null,
      })),
      publicDiscards: this.players.flatMap((player) => player.discards.map((card) => card.kind)),
      legalMoves: this.legalMovesFor(actor).map((move) => ({ ...move })),
    };
  }

  runBotTurn() {
    const actor = this.currentPlayer();
    if (actor.id === this.humanId) return [];
    const move = chooseLoveLetterBotMove(this.botView(actor), this.random);
    return this.applyMove(move);
  }

  startNextRound() {
    if (this.phase !== "round-over") throw new Error("本轮还没有结束");
    const first = this.roundWinnerIds[Math.floor(this.random() * this.roundWinnerIds.length)] ?? this.humanId;
    this.round += 1;
    this.turn += 1;
    this.startRound(first);
    const actor = this.currentPlayer();
    return [this.event("round-start", actor, `第${this.round}轮开始，由${actor.name}先手。`, { significant: true })];
  }

  isHumanTurn() {
    return this.phase === "play" && this.currentPlayer().id === this.humanId;
  }
}
