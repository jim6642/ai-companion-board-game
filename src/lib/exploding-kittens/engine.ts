/**
 * Exploding Kittens (炸弹猫) rules engine.
 *
 * Implements the classic 54-card deck with 4 Exploding Kittens, 6 Defuse, and
 * 8 different action card types (Attack, See the Future, Shuffle, Skip, Nope,
 * Favor, plus 5 cat card kinds × 4). The match ends when only one player
 * remains; an eliminated player is anyone who draws an Exploding Kitten
 * without a Defuse in hand.
 *
 * Bot decisions follow a simple safety-first heuristic: keep at least one
 * Defuse when low on cards, peek before drawing, and use Attack only when
 * another player is closer to elimination. The strategy intentionally avoids
 * peeking at hidden hands so the snapshot stays consistent with what the
 * LLM dialogue layer is allowed to know.
 */

export type EKCardKind =
  | "exploding-kitten"
  | "defuse"
  | "attack"
  | "see-future"
  | "shuffle"
  | "skip"
  | "nope"
  | "favor"
  | "cat";

export type EKCatKind = "potato" | "taco" | "rainbow" | "beard" | "watermelon";

export type EKPhase = "play" | "game-over";

export interface EKPlayerSpec {
  id: string;
  name: string;
  isHuman?: boolean;
}

export interface EKCard {
  id: string;
  kind: EKCardKind;
  catKind?: EKCatKind;
  name: string;
  effect: string;
  symbol: string;
  tone: string;
}

export type EKActionKind = "see-future" | "shuffle" | "favor" | "cat-combo" | "nope" | "attack" | "skip";

export interface EKAction {
  id: string;
  kind: EKActionKind;
  actorId: string;
  cardIds: string[];
  targetId?: string;
  comboSize?: number;
  namedKind?: EKCardKind;
  resolved: boolean;
  cancelled: boolean;
  nopeChain: number;
}

export interface EKPlayerView extends EKPlayerSpec {
  alive: boolean;
  handCount: number;
  hasDefuse: boolean;
  isCurrent: boolean;
  attackCount: number;
}

export interface EKBotView {
  actorId: string;
  ownHand: EKCard[];
  players: Array<{
    id: string;
    name: string;
    alive: boolean;
    handCount: number;
  }>;
  deckCount: number;
  discardPile: EKCard[];
  attackCarry: number;
  lastPeek: EKCard[];
}

export interface EKLegalAction {
  kind: "play-card" | "draw";
  cardId?: string;
  cardKind?: EKCardKind;
  actionKind?: EKActionKind;
  catKind?: EKCatKind;
  /** for 3-of-a-kind cat combo: the named card kind to demand */
  namedKind?: EKCardKind;
  /** target player id (for favor / cat combo) */
  targetId?: string;
  /** size of a cat combo (2 = steal random, 3 = demand, 5 = take from discard) */
  comboSize?: 2 | 3 | 5;
  /** if true, this action would end the turn without drawing */
  endsWithoutDraw: boolean;
}

export interface EKSnapshot {
  phase: EKPhase;
  currentPlayerId: string;
  turn: number;
  attackCarry: number;
  players: EKPlayerView[];
  humanHand: EKCard[];
  deckCount: number;
  discardPile: EKCard[];
  pendingAction: EKAction | null;
  /** visible top cards if the human just used See the Future */
  humanPeek: EKCard[] | null;
  /** ids the human could play right now (paired with their play action shape) */
  legalActions: EKLegalAction[];
  canDraw: boolean;
  /** ids of the cards the human must pick from when reinserting an Exploding Kitten */
  defuseInsertionOptions: number[];
  winnerId: string | null;
  /** last 12 events, newest first, for the chat feed */
  recentEvents: EKGameEvent[];
  needsDefuseInsertion: { kittenId: string; maxIndex: number } | null;
}

export type EKEventKind =
  | "round-start"
  | "play"
  | "nope"
  | "see-future"
  | "shuffle"
  | "favor"
  | "cat-combo"
  | "insert-kitten"
  | "defuse"
  | "draw"
  | "skip"
  | "attack"
  | "explode"
  | "game-win";

export interface EKGameEvent {
  id: string;
  kind: EKEventKind;
  actorId: string;
  actorName: string;
  targetIds: string[];
  text: string;
  significant: boolean;
  /** private peek only visible to the actor (and the human UI) */
  privatePeek?: EKCard[];
  cards?: EKCard[];
}

const CAT_NAMES: Record<EKCatKind, { name: string; effect: string; symbol: string; tone: string }> = {
  potato: { name: "土豆猫", effect: "猫牌组合专用", symbol: "🥔", tone: "#fde68a" },
  taco: { name: "卷饼猫", effect: "猫牌组合专用", symbol: "🌮", tone: "#fcd34d" },
  rainbow: { name: "彩虹猫", effect: "猫牌组合专用", symbol: "🌈", tone: "#f9a8d4" },
  beard: { name: "胡须猫", effect: "猫牌组合专用", symbol: "🐱", tone: "#cbd5e1" },
  watermelon: { name: "西瓜猫", effect: "猫牌组合专用", symbol: "🍉", tone: "#86efac" },
};

const CARD_DEFINITIONS: Record<Exclude<EKCardKind, "cat">, { count: number; name: string; effect: string; symbol: string; tone: string }> = {
  "exploding-kitten": { count: 4, name: "爆炸猫", effect: "抽到就炸，除非你有拆弹", symbol: "💥", tone: "#f87171" },
  "defuse": { count: 6, name: "拆弹", effect: "化解一次爆炸，并把炸弹塞回牌堆", symbol: "🧯", tone: "#34d399" },
  "attack": { count: 4, name: "攻击", effect: "结束本回合不抽牌，下家连玩 2 回合", symbol: "⚔️", tone: "#fb923c" },
  "see-future": { count: 5, name: "预见未来", effect: "偷看牌堆顶 3 张牌（不放回去）", symbol: "🔮", tone: "#a78bfa" },
  "shuffle": { count: 4, name: "洗牌", effect: "把牌堆洗一遍", symbol: "🔀", tone: "#60a5fa" },
  "skip": { count: 4, name: "跳过", effect: "结束本回合不抽牌", symbol: "⏭️", tone: "#94a3b8" },
  "nope": { count: 4, name: "否决", effect: "撤销任意一张动作牌（不能撤销拆弹）", symbol: "🚫", tone: "#f472b6" },
  "favor": { count: 4, name: "索要", effect: "指定一名玩家，对方随机给你 1 张牌", symbol: "🎁", tone: "#fbbf24" },
};

const CAT_KINDS: EKCatKind[] = ["potato", "taco", "rainbow", "beard", "watermelon"];

export const EK_CAT_KINDS = CAT_KINDS;
export const EK_PLAYER_RANGE = { min: 2, max: 5 } as const;
export const EK_MAX_NOPE_DEPTH = 4;

function makeId(prefix: string, counter: { value: number }) {
  counter.value += 1;
  return `${prefix}-${counter.value}`;
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck() {
  const cards: EKCard[] = [];
  let counter = 0;
  const idFactory = (prefix: string) => `${prefix}-${++counter}`;
  for (const kind of Object.keys(CARD_DEFINITIONS) as Array<Exclude<EKCardKind, "cat">>) {
    const def = CARD_DEFINITIONS[kind];
    for (let i = 0; i < def.count; i += 1) {
      cards.push({ id: idFactory(`ek-${kind}`), kind, name: def.name, effect: def.effect, symbol: def.symbol, tone: def.tone });
    }
  }
  for (const catKind of CAT_KINDS) {
    const def = CAT_NAMES[catKind];
    for (let i = 0; i < 4; i += 1) {
      cards.push({ id: idFactory(`ek-cat-${catKind}`), kind: "cat", catKind, name: def.name, effect: def.effect, symbol: def.symbol, tone: def.tone });
    }
  }
  return cards;
}

interface PlayerState extends EKPlayerSpec {
  alive: boolean;
  hand: EKCard[];
  attackCount: number;
}

export class CompanionExplodingKittensEngine {
  private readonly specs: EKPlayerSpec[];
  private readonly humanId: string;
  private readonly random: () => number;
  private readonly idCounter = { value: 0 };
  private players: PlayerState[];
  private deck: EKCard[];
  private discardPile: EKCard[];
  private phase: EKPhase = "play";
  private currentPlayerId = "";
  private turn = 0;
  private attackCarry = 1;
  private pendingAction: EKAction | null = null;
  private humanPeek: EKCard[] | null = null;
  private winnerId: string | null = null;
  private needsDefuseInsertion: { kittenId: string; maxIndex: number } | null = null;
  private recentEvents: EKGameEvent[] = [];
  private playedThisTurn: EKCardKind[] = [];
  private playedAttackThisTurn = false;
  private playedSkipThisTurn = false;
  private needsDraw = true;

  constructor(specs: EKPlayerSpec[], random: () => number = Math.random) {
    if (specs.length < EK_PLAYER_RANGE.min || specs.length > EK_PLAYER_RANGE.max) {
      throw new Error(`炸弹猫需要 ${EK_PLAYER_RANGE.min}-${EK_PLAYER_RANGE.max} 位玩家`);
    }
    if (new Set(specs.map((p) => p.id)).size !== specs.length) throw new Error("玩家标识不能重复");
    const human = specs.find((p) => p.isHuman);
    if (!human) throw new Error("炸弹猫牌桌缺少真人玩家");
    this.specs = specs.map((s) => ({ ...s }));
    this.humanId = human.id;
    this.random = random;
    this.players = specs.map((s) => ({ ...s, alive: true, hand: [], attackCount: 0 }));
    this.discardPile = [];
    this.deck = [];
    this.startMatch();
  }

  private newId(prefix: string) {
    return makeId(prefix, this.idCounter);
  }

  private pushEvent(event: EKGameEvent) {
    this.recentEvents = [event, ...this.recentEvents].slice(0, 12);
  }

  private player(id: string): PlayerState {
    const p = this.players.find((x) => x.id === id);
    if (!p) throw new Error(`找不到玩家 ${id}`);
    return p;
  }

  private alivePlayers() {
    return this.players.filter((p) => p.alive);
  }

  private nextPlayerId(id: string) {
    const start = this.players.findIndex((p) => p.id === id);
    for (let offset = 1; offset <= this.players.length; offset += 1) {
      const candidate = this.players[(start + offset) % this.players.length];
      if (candidate.alive) return candidate.id;
    }
    return id;
  }

  private startMatch() {
    this.turn = 0;
    this.attackCarry = 1;
    this.pendingAction = null;
    this.humanPeek = null;
    this.winnerId = null;
    this.needsDefuseInsertion = null;
    this.recentEvents = [];
    this.playedThisTurn = [];
    this.playedAttackThisTurn = false;
    this.playedSkipThisTurn = false;
    this.needsDraw = true;

    const fullDeck = buildDeck();
    const ekCards = fullDeck.filter((c) => c.kind === "exploding-kitten");
    const defuseCards = fullDeck.filter((c) => c.kind === "defuse");
    const nonDanger = fullDeck.filter((c) => c.kind !== "exploding-kitten" && c.kind !== "defuse");

    const shuffled = shuffle(nonDanger, this.random);
    const playerCount = this.players.length;
    this.players.forEach((p) => {
      p.hand = shuffled.splice(0, 4);
    });

    this.deck = shuffled;

    // 1 defuse per player into their hand
    this.players.forEach((p, index) => {
      p.hand.push(defuseCards[index]);
    });

    // (playerCount - 1) EK into the deck
    const eksToInsert = ekCards.slice(0, playerCount - 1);
    this.deck.push(...eksToInsert);
    this.deck = shuffle(this.deck, this.random);

    // remaining EK (4 - (N-1)) are removed from the game entirely
    // remaining Defuse (6 - N) stay out of the deck (per official rules)

    this.currentPlayerId = this.players[0].id;
    this.phase = "play";

    this.pushEvent({
      id: this.newId("ek-event"),
      kind: "round-start",
      actorId: this.currentPlayerId,
      actorName: this.player(this.currentPlayerId).name,
      targetIds: [],
      text: `炸弹猫开局。${this.players.map((p) => p.name).join("、")}同桌，最后活着的人获胜。`,
      significant: true,
    });
  }

  restart() {
    this.startMatch();
  }

  private drawCards(count: number, opts: { fromTop?: boolean } = {}): EKCard[] {
    const drawn: EKCard[] = [];
    for (let i = 0; i < count; i += 1) {
      if (this.deck.length === 0) break;
      const card = opts.fromTop === false ? this.deck.shift()! : this.deck.pop()!;
      drawn.push(card);
    }
    return drawn;
  }

  private topCards(count: number) {
    return this.deck.slice(-count).reverse();
  }

  private describeCard(card: EKCard) {
    if (card.kind === "cat") {
      return `${card.symbol} ${card.name}`;
    }
    return `${card.symbol} ${card.name}`;
  }

  private canUseNope(actorId: string): boolean {
    if (actorId !== this.humanId) return false;
    return this.player(actorId).hand.some((c) => c.kind === "nope");
  }

  private canBotNope(actorId: string): boolean {
    if (actorId === this.humanId) return false;
    return this.player(actorId).hand.some((c) => c.kind === "nope");
  }

  private findCatCombo(hand: EKCard[]): { size: 2 | 3 | 5; cards: EKCard[] } | null {
    if (hand.length < 2) return null;
    const counts = new Map<EKCatKind, EKCard[]>();
    for (const card of hand) {
      if (card.kind !== "cat" || !card.catKind) continue;
      const list = counts.get(card.catKind) ?? [];
      list.push(card);
      counts.set(card.catKind, list);
    }
    for (const cards of counts.values()) {
      if (cards.length >= 2) return { size: 2, cards: cards.slice(0, 2) };
    }
    const differentCats = new Set<EKCatKind>();
    const collected: EKCard[] = [];
    for (const card of hand) {
      if (card.kind !== "cat" || !card.catKind) continue;
      if (differentCats.has(card.catKind)) continue;
      differentCats.add(card.catKind);
      collected.push(card);
      if (differentCats.size === 5) return { size: 5, cards: collected };
    }
    for (const cards of counts.values()) {
      if (cards.length >= 3) return { size: 3, cards: cards.slice(0, 3) };
    }
    return null;
  }

  private legalActionsFor(player: PlayerState): EKLegalAction[] {
    if (player.id !== this.currentPlayerId) return [];
    if (this.needsDefuseInsertion || this.pendingAction) return [];
    const actions: EKLegalAction[] = [];
    for (const card of player.hand) {
      if (card.kind === "exploding-kitten" || card.kind === "defuse") continue;
      if (card.kind === "nope") continue;
      if (card.kind === "attack") {
        actions.push({ kind: "play-card", cardId: card.id, cardKind: card.kind, endsWithoutDraw: true });
        continue;
      }
      if (card.kind === "skip") {
        actions.push({ kind: "play-card", cardId: card.id, cardKind: card.kind, endsWithoutDraw: true });
        continue;
      }
      if (card.kind === "see-future" || card.kind === "shuffle") {
        actions.push({ kind: "play-card", cardId: card.id, cardKind: card.kind, endsWithoutDraw: false });
        continue;
      }
      if (card.kind === "favor") {
        const targets = this.alivePlayers().filter((p) => p.id !== player.id && p.hand.length > 0).map((p) => p.id);
        if (targets.length === 0) {
          actions.push({ kind: "play-card", cardId: card.id, cardKind: card.kind, endsWithoutDraw: false });
        } else {
          for (const targetId of targets) {
            actions.push({ kind: "play-card", cardId: card.id, cardKind: card.kind, targetId, endsWithoutDraw: false });
          }
        }
        continue;
      }
      if (card.kind === "cat") {
        const combo = this.findCatCombo(player.hand);
        if (combo) {
          if (combo.size === 5) {
            actions.push({ kind: "play-card", cardId: combo.cards[0].id, cardKind: card.kind, catKind: card.catKind, comboSize: 5, endsWithoutDraw: false });
            continue;
          }
          const targets = this.alivePlayers().filter((p) => p.id !== player.id && p.hand.length > 0).map((p) => p.id);
          if (combo.size === 3) {
            for (const targetId of targets) {
              for (const namedKind of ["defuse", "attack", "see-future", "shuffle", "skip", "nope", "favor", "exploding-kitten", "cat"] as EKCardKind[]) {
                if (namedKind === "cat") continue;
                actions.push({ kind: "play-card", cardId: combo.cards[0].id, cardKind: card.kind, catKind: card.catKind, comboSize: 3, targetId, namedKind, endsWithoutDraw: false });
              }
            }
          } else if (combo.size === 2) {
            for (const targetId of targets) {
              actions.push({ kind: "play-card", cardId: combo.cards[0].id, cardKind: card.kind, catKind: card.catKind, comboSize: 2, targetId, endsWithoutDraw: false });
            }
          }
        }
      }
    }
    if (this.needsDraw && !this.playedAttackThisTurn && !this.playedSkipThisTurn) {
      actions.push({ kind: "draw", endsWithoutDraw: false });
    }
    return actions;
  }

  private evaluateNopeChain(action: EKAction): { finalAction: EKAction; nopes: EKGameEvent[] } {
    const nopeEvents: EKGameEvent[] = [];
    let current: EKAction = { ...action };
    let depth = 0;
    // Each bot's decision to play a Nope is now a strategic call based on
    // the original action and the bot's own state (hand, peeks, target).
    // At even depth the action is "live" and a Nope cancels it, so a bot
    // plays a Nope when it wants the action to be cancelled. At odd depth
    // the action is already cancelled and a Nope re-Nopes (revives) it, so
    // a bot plays a Nope when it wants the action to come back. The
    // original action itself is the only thing the bot reasons about — it
    // does not track the chain mid-flight.
    while (depth < EK_MAX_NOPE_DEPTH) {
      const aliveOthers = this.alivePlayers().filter((p) => p.id !== current.actorId);
      const candidates: Array<{ player: PlayerState; motivation: number }> = [];
      for (const p of aliveOthers) {
        if (!p.hand.some((c) => c.kind === "nope")) continue;
        const cancelPreference = this.botCancelPreference(p, action);
        // At depth 0 the action is live, so a Nope fires when cancelPreference
        // is high. At depth 1 the action is cancelled, so a Nope fires when
        // cancelPreference is low (we want the original to come back).
        const threshold = depth % 2 === 0 ? cancelPreference : 1 - cancelPreference;
        if (this.random() < threshold) {
          candidates.push({ player: p, motivation: this.random() });
        }
      }
      if (candidates.length === 0) {
        current.resolved = true;
        current.cancelled = false;
        return { finalAction: current, nopes: nopeEvents };
      }
      candidates.sort((a, b) => b.motivation - a.motivation);
      const nopePlayer = candidates[0].player;
      const idx = nopePlayer.hand.findIndex((c) => c.kind === "nope");
      const [nopeCard] = nopePlayer.hand.splice(idx, 1);
      this.discardPile.push(nopeCard);
      const event: EKGameEvent = {
        id: this.newId("ek-event"),
        kind: "nope",
        actorId: nopePlayer.id,
        actorName: nopePlayer.name,
        targetIds: [current.actorId],
        text: `${nopePlayer.name}打出了否决，撤销${this.player(current.actorId).name}的动作。`,
        significant: true,
        cards: [nopeCard],
      };
      this.pushEvent(event);
      nopeEvents.push(event);
      current = {
        id: this.newId("ek-action"),
        kind: "nope",
        actorId: nopePlayer.id,
        cardIds: [nopeCard.id],
        resolved: false,
        cancelled: false,
        nopeChain: depth + 1,
      };
      depth += 1;
    }
    current.resolved = true;
    current.cancelled = false;
    return { finalAction: current, nopes: nopeEvents };
  }

  /**
   * Strategic preference (0..1) for a bot wanting the original action to
   * be cancelled. High = the bot wants the Nope. Low = the bot would
   * rather let the action go through. Pure heuristic, no extra RNG.
   */
  private botCancelPreference(bot: PlayerState, originalAction: EKAction): number {
    const view = this.botView(bot);
    const target = originalAction.targetId ? this.player(originalAction.targetId) : null;
    switch (originalAction.kind) {
      case "favor":
        if (target?.id === bot.id && bot.hand.length > 0) {
          return 0.95;
        }
        return 0.05;
      case "cat-combo": {
        const size = originalAction.comboSize ?? 2;
        if (target?.id !== bot.id) return 0.1;
        if (size === 2) return 0.95;
        if (size === 3) {
          if (originalAction.namedKind && bot.hand.some((c) => c.kind === originalAction.namedKind)) {
            return 0.9;
          }
          return 0.2;
        }
        return 0.1;
      }
      case "attack": {
        const nextId = this.nextPlayerId(originalAction.actorId);
        return nextId === bot.id ? 0.9 : 0.2;
      }
      case "skip": {
        if (view.lastPeek[0]?.kind === "exploding-kitten") {
          // We peeked and saw an EK on top — force the actor to draw it.
          return 0.9;
        }
        // No peek: mostly let the skip through; mild counter-pressure if
        // the deck is small and we don't want the next player to draw.
        if (view.deckCount <= 4) {
          return this.nextPlayerId(originalAction.actorId) === bot.id ? 0.3 : 0.4;
        }
        return 0.1;
      }
      case "shuffle": {
        if (view.lastPeek.length === 0) return 0.1;
        const topIsEk = view.lastPeek[0]?.kind === "exploding-kitten";
        return topIsEk ? 0.85 : 0.8;
      }
      case "see-future":
        return 0.1;
      case "nope":
        // Re-Nope: the previous Nope is being countered. Bot's "cancel
        // preference" for the ORIGINAL action decides whether to revive.
        return 0.1;
    }
    return 0.1;
  }

  private resolveAction(action: EKAction): EKGameEvent[] {
    const events: EKGameEvent[] = [];
    const actor = this.player(action.actorId);
    const cards = action.cardIds
      .map((id) => actor.hand.find((c) => c.id === id))
      .filter((c): c is EKCard => Boolean(c));
    if (cards.length === 0) return events;

    // Remove the played cards from hand and add to discard
    for (const card of cards) {
      const idx = actor.hand.findIndex((c) => c.id === card.id);
      if (idx >= 0) actor.hand.splice(idx, 1);
      this.discardPile.push(card);
      this.playedThisTurn.push(card.kind);
      if (card.kind === "attack") this.playedAttackThisTurn = true;
      if (card.kind === "skip") this.playedSkipThisTurn = true;
    }

    // Emit a generic "play" event up front so the chat can show the action
    const summaryCards = cards.map((c) => this.describeCard(c)).join("、");
    const playEvent: EKGameEvent = {
      id: this.newId("ek-event"),
      kind: "play",
      actorId: actor.id,
      actorName: actor.name,
      targetIds: action.targetId ? [action.targetId] : [],
      text: action.kind === "cat-combo"
        ? `${actor.name}凑齐了 ${action.comboSize ?? 2} 张猫牌。`
        : `${actor.name}打出了 ${summaryCards}。`,
      significant: false,
      cards,
    };
    this.pushEvent(playEvent);
    events.push(playEvent);

    switch (action.kind) {
      case "see-future": {
        const peek = this.topCards(3);
        if (actor.id === this.humanId) this.humanPeek = peek;
        const event: EKGameEvent = {
          id: this.newId("ek-event"),
          kind: "see-future",
          actorId: actor.id,
          actorName: actor.name,
          targetIds: [],
          text: `${actor.name}预见了牌堆顶部 3 张牌。`,
          significant: false,
          privatePeek: peek,
          cards,
        };
        events.push(event);
        this.pushEvent(event);
        break;
      }
      case "shuffle": {
        this.deck = shuffle(this.deck, this.random);
        if (actor.id === this.humanId) this.humanPeek = null;
        const event: EKGameEvent = {
          id: this.newId("ek-event"),
          kind: "shuffle",
          actorId: actor.id,
          actorName: actor.name,
          targetIds: [],
          text: `${actor.name}把牌堆洗了一遍。`,
          significant: false,
          cards,
        };
        events.push(event);
        this.pushEvent(event);
        break;
      }
      case "favor": {
        if (action.targetId) {
          const target = this.player(action.targetId);
          if (target.hand.length > 0) {
            const stolenIndex = Math.floor(this.random() * target.hand.length);
            const stolen = target.hand.splice(stolenIndex, 1)[0];
            actor.hand.push(stolen);
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "favor",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [target.id],
              text: `${actor.name}向${target.name}索要了一张牌（${this.describeCard(stolen)}）。`,
              significant: true,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          }
        }
        break;
      }
      case "cat-combo": {
        const size = action.comboSize ?? 2;
        if (size === 2 && action.targetId) {
          const target = this.player(action.targetId);
          if (target.hand.length > 0) {
            const idx = Math.floor(this.random() * target.hand.length);
            const stolen = target.hand.splice(idx, 1)[0];
            actor.hand.push(stolen);
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "cat-combo",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [target.id],
              text: `${actor.name}用 2 张${cards[0]?.name ?? "猫牌"}随机偷了${target.name}一张牌。`,
              significant: true,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          }
        } else if (size === 3 && action.targetId && action.namedKind) {
          const target = this.player(action.targetId);
          const namedCard = target.hand.find((c) => c.kind === action.namedKind);
          if (namedCard) {
            target.hand = target.hand.filter((c) => c.id !== namedCard.id);
            actor.hand.push(namedCard);
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "cat-combo",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [target.id],
              text: `${actor.name}用 3 张${cards[0]?.name ?? "猫牌"}点名要${target.name}手里的${CARD_DEFINITIONS[action.namedKind as Exclude<EKCardKind, "cat">]?.name ?? action.namedKind}，${target.name}只能交出来。`,
              significant: true,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          } else {
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "cat-combo",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [target.id],
              text: `${actor.name}用 3 张${cards[0]?.name ?? "猫牌"}点名要${target.name}的一张牌，但对方没有。`,
              significant: true,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          }
        } else if (size === 5) {
          if (this.discardPile.length > 0) {
            const idx = Math.floor(this.random() * this.discardPile.length);
            const taken = this.discardPile.splice(idx, 1)[0];
            actor.hand.push(taken);
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "cat-combo",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [],
              text: `${actor.name}用 5 张不同的猫牌从弃牌堆里挑了 1 张（${this.describeCard(taken)}）。`,
              significant: true,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          } else {
            const event: EKGameEvent = {
              id: this.newId("ek-event"),
              kind: "cat-combo",
              actorId: actor.id,
              actorName: actor.name,
              targetIds: [],
              text: `${actor.name}想用 5 张猫牌拿弃牌堆的牌，但弃牌堆是空的。`,
              significant: false,
              cards,
            };
            events.push(event);
            this.pushEvent(event);
          }
        }
        break;
      }
      case "nope":
        // Already resolved at evaluation
        break;
    }

    // If the card was Attack or Skip, emit a dedicated event so the chat
    // makes the "no-draw / no-draw-on-next" effect clear.
    if (cards.some((c) => c.kind === "attack")) {
      const ev: EKGameEvent = {
        id: this.newId("ek-event"),
        kind: "attack",
        actorId: actor.id,
        actorName: actor.name,
        targetIds: [this.nextPlayerId(actor.id)],
        text: `${actor.name}打出攻击，下家要连玩两回合（第一回合也不能抽牌）。`,
        significant: true,
      };
      this.pushEvent(ev);
      events.push(ev);
    }
    if (cards.some((c) => c.kind === "skip")) {
      const ev: EKGameEvent = {
        id: this.newId("ek-event"),
        kind: "skip",
        actorId: actor.id,
        actorName: actor.name,
        targetIds: [],
        text: `${actor.name}用跳过结束回合，本回合不抽牌。`,
        significant: false,
      };
      this.pushEvent(ev);
      events.push(ev);
    }

    if (actor.id === this.humanId) {
      // Keep peek visible after non-shuffle actions, except after shuffle
      if (action.kind !== "shuffle") {
        // peek persists; human can clear it
      }
    }
    return events;
  }

  /** Apply a player action, running the full Nope chain. */
  private applyPlayerAction(action: EKAction) {
    const { finalAction, nopes } = this.evaluateNopeChain(action);
    if (finalAction.cancelled) return nopes;
    if (finalAction.kind === "nope") {
      // Chain ended on a Nope, the prior action is cancelled — nothing to resolve
      return nopes;
    }
    return [...nopes, ...this.resolveAction(finalAction)];
  }

  playCard(action: Omit<EKAction, "id" | "resolved" | "cancelled" | "nopeChain">) {
    if (this.phase !== "play") throw new Error("对局已结束");
    const actor = this.player(action.actorId);
    if (actor.id !== this.currentPlayerId) throw new Error("还没轮到你");
    if (this.needsDefuseInsertion) throw new Error("请先处理爆炸猫");
    if (this.pendingAction) throw new Error("当前有动作等待处理");
    const fullAction: EKAction = { ...action, id: this.newId("ek-action"), resolved: false, cancelled: false, nopeChain: 0 };
    const events = this.applyPlayerAction(fullAction);
    this.afterAction();
    return events;
  }

  playNope(): EKGameEvent[] {
    // Used by the human page when the human wants to Nope a bot's action
    if (this.phase !== "play" || !this.pendingAction) throw new Error("当前没有可以否决的动作");
    if (!this.canUseNope(this.humanId)) throw new Error("你没有否决牌");
    const human = this.player(this.humanId);
    const idx = human.hand.findIndex((c) => c.kind === "nope");
    if (idx < 0) throw new Error("你没有否决牌");
    const [nopeCard] = human.hand.splice(idx, 1);
    this.discardPile.push(nopeCard);
    const event: EKGameEvent = {
      id: this.newId("ek-event"),
      kind: "nope",
      actorId: this.humanId,
      actorName: human.name,
      targetIds: [this.pendingAction.actorId],
      text: `${human.name}打出了否决，撤销${this.player(this.pendingAction.actorId).name}的动作。`,
      significant: true,
      cards: [nopeCard],
    };
    this.pushEvent(event);
    this.pendingAction = null;
    this.afterAction();
    return [event];
  }

  /** When the current player is a bot and is the only one allowed to act. */
  runBotTurn(): EKGameEvent[] {
    if (this.phase !== "play") return [];
    const actor = this.player(this.currentPlayerId);
    if (actor.id === this.humanId) return [];
    if (this.needsDefuseInsertion) {
      // The bot drew an Exploding Kitten and defused it. The bot must
      // reinsert the kitten into the deck on its own; otherwise the game
      // deadlocks because no caller will invoke insertExplodingKitten for
      // the bot and the human can't (they're not the current player).
      return this.botInsertExplodingKitten();
    }
    const events: EKGameEvent[] = [];

    if (this.pendingAction) {
      // Bot has no async Nope ability in this simplified engine; resolve the pending action
      // by evaluating the bot Nope chain right now.
      const actionEvents = this.applyPlayerAction(this.pendingAction);
      events.push(...actionEvents);
      this.afterAction();
      return events;
    }

    const view = this.botView(actor);
    const move = chooseEKBotMove(view, this.random);
    if (move.kind === "draw") {
      events.push(...this.drawForActor());
    } else {
      const fullAction: EKAction = {
        id: this.newId("ek-action"),
        kind: move.actionKind,
        actorId: actor.id,
        cardIds: move.cardIds,
        targetId: move.targetId,
        comboSize: move.comboSize,
        namedKind: move.namedKind,
        resolved: false,
        cancelled: false,
        nopeChain: 0,
      };
      const actionEvents = this.applyPlayerAction(fullAction);
      events.push(...actionEvents);
      this.afterAction();
    }
    return events;
  }

  /**
   * Bot auto-resolves a pending Defuse insertion by picking a random
   * position. The bot slightly prefers the top of the deck (so the next
   * player is more likely to draw it, just like a hostile human would),
   * but it stays inside [0, maxIndex] so we never insert past the bottom.
   */
  private botInsertExplodingKitten(): EKGameEvent[] {
    if (!this.needsDefuseInsertion) return [];
    const maxIndex = this.needsDefuseInsertion.maxIndex;
    // 60% top, 40% anywhere else — bots are "hostile" by default
    const position = this.random() < 0.6
      ? 0
      : Math.floor(this.random() * (maxIndex + 1));
    return this.insertExplodingKitten(this.currentPlayerId, position);
  }

  draw(): EKGameEvent[] {
    if (this.phase !== "play") throw new Error("对局已结束");
    if (this.needsDefuseInsertion) throw new Error("请先处理爆炸猫");
    if (this.currentPlayerId !== this.humanId) throw new Error("还没轮到你");
    return this.drawForActor();
  }

  private drawForActor(): EKGameEvent[] {
    if (this.phase !== "play") return [];
    if (this.playedAttackThisTurn || this.playedSkipThisTurn) {
      this.endTurn();
      return [];
    }
    const actor = this.player(this.currentPlayerId);
    if (this.deck.length === 0) {
      // Empty deck: shuffle discard back
      this.deck = shuffle(this.discardPile, this.random);
      this.discardPile = [];
    }
    const drawn = this.deck.pop();
    if (!drawn) {
      this.endTurn();
      return [];
    }
    const drawEvent: EKGameEvent = {
      id: this.newId("ek-event"),
      kind: "draw",
      actorId: actor.id,
      actorName: actor.name,
      targetIds: [],
      text: `${actor.name}抽了一张牌。`,
      significant: false,
      cards: [drawn],
    };
    this.pushEvent(drawEvent);

    if (drawn.kind === "exploding-kitten") {
      const defuse = actor.hand.find((c) => c.kind === "defuse");
      if (defuse) {
        const defuseIdx = actor.hand.findIndex((c) => c.kind === "defuse");
        actor.hand.splice(defuseIdx, 1);
        this.discardPile.push(defuse, drawn);
        const defuseEvent: EKGameEvent = {
          id: this.newId("ek-event"),
          kind: "defuse",
          actorId: actor.id,
          actorName: actor.name,
          targetIds: [],
          text: `${actor.name}抽到了爆炸猫，但立刻打出拆弹救了自己。`,
          significant: true,
          cards: [defuse, drawn],
        };
        this.pushEvent(defuseEvent);
        this.needsDefuseInsertion = { kittenId: drawn.id, maxIndex: this.deck.length };
        // Don't end turn yet — wait for insertion decision
        return [drawEvent, defuseEvent];
      }
      // No defuse → player explodes
      actor.alive = false;
      actor.hand = [];
      const explodeEvent: EKGameEvent = {
        id: this.newId("ek-event"),
        kind: "explode",
        actorId: actor.id,
        actorName: actor.name,
        targetIds: [],
        text: `${actor.name}抽到了爆炸猫，手里又没有拆弹，炸了！`,
        significant: true,
        cards: [drawn],
      };
      this.pushEvent(explodeEvent);
      this.endTurn();
      return [drawEvent, explodeEvent];
    }
    actor.hand.push(drawn);
    this.endTurn();
    return [drawEvent];
  }

  insertExplodingKitten(actorId: string, position: number) {
    if (!this.needsDefuseInsertion) throw new Error("当前不需要塞回爆炸猫");
    if (actorId !== this.currentPlayerId) throw new Error("还没轮到你");
    if (position < 0 || position > this.needsDefuseInsertion.maxIndex) {
      throw new Error("插入位置越界");
    }
    const kitten = this.discardPile.pop();
    if (!kitten || kitten.id !== this.needsDefuseInsertion.kittenId) {
      throw new Error("爆炸猫不在弃牌堆顶，无法塞回");
    }
    // Position 0 = top of deck
    if (position === 0) this.deck.push(kitten);
    else this.deck.splice(this.deck.length - position, 0, kitten);
    const event: EKGameEvent = {
      id: this.newId("ek-event"),
      kind: "insert-kitten",
      actorId,
      actorName: this.player(actorId).name,
      targetIds: [],
      text: `${this.player(actorId).name}把爆炸猫偷偷塞回了牌堆。`,
      significant: false,
    };
    this.pushEvent(event);
    this.needsDefuseInsertion = null;
    this.endTurn();
    return [event];
  }

  private afterAction() {
    if (this.phase !== "play") return;
    this.pendingAction = null;
    // Attack or Skip played this turn → immediately end the turn (no draw).
    if (this.playedAttackThisTurn || this.playedSkipThisTurn) {
      this.endTurn();
    }
  }

  private endTurn() {
    if (this.phase !== "play") return;
    this.turn += 1;
    this.playedThisTurn = [];
    this.playedAttackThisTurn = false;
    this.playedSkipThisTurn = false;
    this.pendingAction = null;
    this.needsDraw = true;

    const alive = this.alivePlayers();
    if (alive.length === 1) {
      this.phase = "game-over";
      this.winnerId = alive[0].id;
      const event: EKGameEvent = {
        id: this.newId("ek-event"),
        kind: "game-win",
        actorId: alive[0].id,
        actorName: alive[0].name,
        targetIds: [],
        text: `${alive[0].name}成为最后存活的人，赢下整局炸弹猫。`,
        significant: true,
      };
      this.pushEvent(event);
      return;
    }

    this.attackCarry -= 1;
    if (this.attackCarry <= 0) {
      this.attackCarry = 1;
      this.currentPlayerId = this.nextPlayerId(this.currentPlayerId);
    } else {
      // Attack carry: same player, no draw
      this.playedAttackThisTurn = false;
      this.playedSkipThisTurn = false;
    }
  }

  private botView(actor: PlayerState): EKBotView {
    return {
      actorId: actor.id,
      ownHand: actor.hand.map((c) => ({ ...c })),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
        handCount: p.hand.length,
      })),
      deckCount: this.deck.length,
      discardPile: this.discardPile.slice(-20).map((c) => ({ ...c })),
      attackCarry: this.attackCarry,
      lastPeek: actor.id === this.humanId && this.humanPeek ? this.humanPeek.map((c) => ({ ...c })) : [],
    };
  }

  snapshot(): EKSnapshot {
    const current = this.player(this.currentPlayerId);
    const legalActions = current.id === this.humanId ? this.legalActionsFor(current) : [];
    return {
      phase: this.phase,
      currentPlayerId: this.currentPlayerId,
      turn: this.turn,
      attackCarry: this.attackCarry,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHuman: p.isHuman,
        alive: p.alive,
        handCount: p.hand.length,
        hasDefuse: p.hand.some((c) => c.kind === "defuse"),
        isCurrent: p.id === this.currentPlayerId,
        attackCount: p.attackCount,
      })),
      humanHand: this.player(this.humanId).hand.map((c) => ({ ...c })),
      deckCount: this.deck.length,
      discardPile: this.discardPile.slice(-12).map((c) => ({ ...c })),
      pendingAction: this.pendingAction ? { ...this.pendingAction } : null,
      humanPeek: this.humanPeek ? this.humanPeek.map((c) => ({ ...c })) : null,
      legalActions,
      canDraw: !this.playedAttackThisTurn && !this.playedSkipThisTurn,
      defuseInsertionOptions: this.needsDefuseInsertion
        ? Array.from({ length: this.needsDefuseInsertion.maxIndex + 1 }, (_, i) => i)
        : [],
      winnerId: this.winnerId,
      recentEvents: this.recentEvents.slice(0, 12).map((e) => ({ ...e })),
      needsDefuseInsertion: this.needsDefuseInsertion ? { ...this.needsDefuseInsertion } : null,
    };
  }
}

type EKBotMove =
  | { kind: "draw" }
  | {
      kind: "play-card";
      actionKind: EKActionKind;
      cardIds: string[];
      targetId?: string;
      comboSize?: 2 | 3 | 5;
      namedKind?: EKCardKind;
    };

function chooseEKBotMove(view: EKBotView, random: () => number): EKBotMove {
  const actorHand = view.ownHand;
  const hasDefuse = actorHand.some((c) => c.kind === "defuse");
  const handSize = actorHand.length;
  const seenDeckTop3 = view.lastPeek.length > 0;

  // Defensive: if no defuse and only 1 card in hand, just draw
  if (!hasDefuse && handSize <= 1) return { kind: "draw" };

  // If we just peeked and there's an EK on top, shuffle or skip before drawing
  if (seenDeckTop3) {
    const top = view.lastPeek[0];
    if (top?.kind === "exploding-kitten") {
      const shuffle = actorHand.find((c) => c.kind === "shuffle");
      if (shuffle) return { kind: "play-card", actionKind: "shuffle", cardIds: [shuffle.id] };
      const skip = actorHand.find((c) => c.kind === "skip");
      if (skip) return { kind: "play-card", actionKind: "skip", cardIds: [skip.id] };
    }
  }

  const aliveOthers = view.players.filter((p) => p.alive && p.id !== view.actorId);
  const lowestOther = aliveOthers.length > 0
    ? aliveOthers.reduce((a, b) => (a.handCount < b.handCount ? a : b))
    : null;

  // 70% of the time the bot just draws to end the turn.
  if (random() < 0.7) return { kind: "draw" };

  // Otherwise consider attacking the weakest opponent
  const attack = actorHand.find((c) => c.kind === "attack");
  if (attack && lowestOther && lowestOther.handCount < handSize - 1 && random() < 0.5) {
    return { kind: "play-card", actionKind: "attack", cardIds: [attack.id] };
  }

  // Favor: steal from a player with many cards
  const favor = actorHand.find((c) => c.kind === "favor");
  if (favor && aliveOthers.length > 0) {
    const target = aliveOthers.reduce((a, b) => (a.handCount > b.handCount ? a : b));
    if (target.handCount >= 2) {
      return { kind: "play-card", actionKind: "favor", cardIds: [favor.id], targetId: target.id };
    }
  }

  // Cat combos: prefer 2 of a kind to steal
  const catCounts = new Map<EKCatKind, EKCard[]>();
  for (const c of actorHand) {
    if (c.kind !== "cat" || !c.catKind) continue;
    catCounts.set(c.catKind, [...(catCounts.get(c.catKind) ?? []), c]);
  }
  const twoOfAKind = Array.from(catCounts.values()).find((arr) => arr.length >= 2);
  if (twoOfAKind && aliveOthers.length > 0) {
    const target = aliveOthers[Math.floor(random() * aliveOthers.length)];
    return {
      kind: "play-card",
      actionKind: "cat-combo",
      cardIds: twoOfAKind.slice(0, 2).map((c) => c.id),
      targetId: target.id,
      comboSize: 2,
    };
  }
  const threeOfAKind = Array.from(catCounts.values()).find((arr) => arr.length >= 3);
  if (threeOfAKind && aliveOthers.length > 0) {
    const target = aliveOthers[Math.floor(random() * aliveOthers.length)];
    return {
      kind: "play-card",
      actionKind: "cat-combo",
      cardIds: threeOfAKind.slice(0, 3).map((c) => c.id),
      targetId: target.id,
      comboSize: 3,
      namedKind: "defuse",
    };
  }
  const distinctCats = new Set<EKCatKind>();
  const fiveCards: EKCard[] = [];
  for (const c of actorHand) {
    if (c.kind !== "cat" || !c.catKind) continue;
    if (distinctCats.has(c.catKind)) continue;
    distinctCats.add(c.catKind);
    fiveCards.push(c);
    if (distinctCats.size === 5) break;
  }
  if (fiveCards.length === 5 && view.discardPile.length > 0) {
    return {
      kind: "play-card",
      actionKind: "cat-combo",
      cardIds: fiveCards.map((c) => c.id),
      comboSize: 5,
    };
  }

  // See the Future: only when we haven't peeked yet and deck is small
  const seeFuture = actorHand.find((c) => c.kind === "see-future");
  if (seeFuture && !seenDeckTop3 && view.deckCount <= 10 && random() < 0.4) {
    return { kind: "play-card", actionKind: "see-future", cardIds: [seeFuture.id] };
  }

  // Skip if we have no defuse and deck is very small
  const skip = actorHand.find((c) => c.kind === "skip");
  if (skip && !hasDefuse && view.deckCount <= 3) {
    return { kind: "play-card", actionKind: "skip", cardIds: [skip.id] };
  }

  // Otherwise just draw
  return { kind: "draw" };
}

export const EK_CARD_DEFINITIONS = CARD_DEFINITIONS;
export const EK_CAT_NAMES = CAT_NAMES;
