import { Card, Color, Game, Value } from "uno-engine";

export type UnoColorName = "red" | "blue" | "green" | "yellow";
export type UnoEventKind = "play" | "draw" | "pass" | "uno" | "win";

export interface UnoPlayerSpec {
  id: string;
  name: string;
  isHuman?: boolean;
}

export interface UnoCardView {
  id: string;
  color: UnoColorName | "wild";
  activeColor: UnoColorName;
  value: Value;
  label: string;
  shortLabel: string;
  isWild: boolean;
  isPlayable: boolean;
  isDrawnCard: boolean;
}

export interface UnoPlayerView extends UnoPlayerSpec {
  cardCount: number;
  isCurrent: boolean;
  hasUno: boolean;
}

export interface UnoSnapshot {
  players: UnoPlayerView[];
  humanHand: UnoCardView[];
  topCard: UnoCardView;
  currentPlayerId: string;
  direction: "clockwise" | "counterclockwise";
  drawPileCount: number;
  winnerId: string | null;
  turn: number;
  canHumanDraw: boolean;
  canHumanPass: boolean;
}

export interface UnoGameEvent {
  id: string;
  kind: UnoEventKind;
  actorId: string;
  actorName: string;
  text: string;
  card?: UnoCardView;
  targetIds: string[];
  significant: boolean;
}

const COLOR_NAMES: Record<Color, UnoColorName> = {
  [Color.RED]: "red",
  [Color.BLUE]: "blue",
  [Color.GREEN]: "green",
  [Color.YELLOW]: "yellow",
};

const COLOR_VALUES: Record<UnoColorName, Color> = {
  red: Color.RED,
  blue: Color.BLUE,
  green: Color.GREEN,
  yellow: Color.YELLOW,
};

const VALUE_LABELS: Record<Value, string> = {
  [Value.ZERO]: "0",
  [Value.ONE]: "1",
  [Value.TWO]: "2",
  [Value.THREE]: "3",
  [Value.FOUR]: "4",
  [Value.FIVE]: "5",
  [Value.SIX]: "6",
  [Value.SEVEN]: "7",
  [Value.EIGHT]: "8",
  [Value.NINE]: "9",
  [Value.DRAW_TWO]: "+2",
  [Value.REVERSE]: "反转",
  [Value.SKIP]: "跳过",
  [Value.WILD]: "换色",
  [Value.WILD_DRAW_FOUR]: "+4",
};

const SHORT_VALUE_LABELS: Record<Value, string> = {
  ...VALUE_LABELS,
  [Value.REVERSE]: "↻",
  [Value.SKIP]: "⊘",
  [Value.WILD]: "◇",
};

function isWild(card: Card) {
  return card.value === Value.WILD || card.value === Value.WILD_DRAW_FOUR;
}

function dominantColor(hand: Card[]): Color {
  const counts = new Map<Color, number>([
    [Color.RED, 0],
    [Color.BLUE, 0],
    [Color.GREEN, 0],
    [Color.YELLOW, 0],
  ]);
  hand.forEach((card) => {
    if (!isWild(card) && card.color) counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? Color.RED;
}

function canPlayWildDrawFour(card: Card, hand: Card[], top: Card) {
  if (card.value !== Value.WILD_DRAW_FOUR) return true;
  return !hand.some((candidate) => !isWild(candidate) && candidate.color === top.color);
}

function isPlayable(card: Card, hand: Card[], top: Card) {
  if (isWild(card)) return canPlayWildDrawFour(card, hand, top);
  return card.color === top.color || card.value === top.value;
}

/**
 * Local rule bot adapted from RLCard's MIT-licensed UNORuleAgentV1:
 * keep wild cards when a colored legal card exists, and choose the most common
 * remaining hand color after a wild. Extra scoring only uses public turn order
 * and the bot's own hand; no LLM is involved.
 */
export function chooseRuleBotCard(hand: Card[], top: Card, nextPlayerCardCount: number): Card | null {
  const legal = hand.filter((card) => isPlayable(card, hand, top));
  if (legal.length === 0) return null;

  const colored = legal.filter((card) => !isWild(card));
  const candidates = colored.length > 0 ? colored : legal;
  const preferredColor = dominantColor(hand);

  return [...candidates].sort((a, b) => {
    const score = (card: Card) => {
      let value = card.color === preferredColor ? 18 : 0;
      if (card.value === Value.DRAW_TWO) value += nextPlayerCardCount <= 3 ? 42 : 24;
      if (card.value === Value.SKIP) value += nextPlayerCardCount <= 3 ? 36 : 20;
      if (card.value === Value.REVERSE) value += nextPlayerCardCount <= 3 ? 28 : 14;
      if (card.value === Value.WILD_DRAW_FOUR) value += hand.length <= 3 ? 35 : -20;
      if (card.value === Value.WILD) value += hand.length <= 2 ? 24 : -28;
      value += hand.filter((other) => other.color === card.color).length * 4;
      return value;
    };
    return score(b) - score(a);
  })[0];
}

export class CompanionUnoEngine {
  private readonly specs: UnoPlayerSpec[];
  private readonly humanId: string;
  private readonly nameToId: Map<string, string>;
  private readonly cardIds = new WeakMap<Card, string>();
  private game: Game;
  private nextCardId = 1;
  private eventSequence = 1;
  private drawnHumanCard: Card | null = null;
  private winnerId: string | null = null;
  private turn = 1;

  constructor(specs: UnoPlayerSpec[]) {
    if (specs.length < 2 || specs.length > 10) throw new Error("UNO 需要 2 到 10 位玩家");
    const human = specs.find((player) => player.isHuman);
    if (!human) throw new Error("UNO 牌桌缺少真人玩家");
    this.specs = specs;
    this.humanId = human.id;
    this.nameToId = new Map(specs.map((player) => [player.name, player.id]));
    this.game = new Game(specs.map((player) => player.name));
  }

  private idForCard(card: Card) {
    const existing = this.cardIds.get(card);
    if (existing) return existing;
    const id = `uno-card-${this.nextCardId++}`;
    this.cardIds.set(card, id);
    return id;
  }

  private idForName(name: string) {
    return this.nameToId.get(name) ?? name;
  }

  private playerById(id: string) {
    const spec = this.specs.find((player) => player.id === id);
    return spec ? this.game.getPlayer(spec.name) : undefined;
  }

  private cardView(card: Card, playable = false): UnoCardView {
    const wild = isWild(card);
    const activeColor = COLOR_NAMES[card.color ?? this.game.discardedCard.color ?? Color.RED];
    return {
      id: this.idForCard(card),
      color: wild ? "wild" : COLOR_NAMES[card.color],
      activeColor,
      value: card.value,
      label: VALUE_LABELS[card.value],
      shortLabel: SHORT_VALUE_LABELS[card.value],
      isWild: wild,
      isPlayable: playable,
      isDrawnCard: this.drawnHumanCard === card,
    };
  }

  private makeEvent(
    kind: UnoEventKind,
    actorId: string,
    text: string,
    options: { card?: Card; targetIds?: string[]; significant?: boolean } = {},
  ): UnoGameEvent {
    const actor = this.specs.find((player) => player.id === actorId);
    return {
      id: `uno-event-${Date.now()}-${this.eventSequence++}`,
      kind,
      actorId,
      actorName: actor?.name ?? actorId,
      text,
      card: options.card ? this.cardView(options.card) : undefined,
      targetIds: options.targetIds ?? [],
      significant: options.significant ?? false,
    };
  }

  private legalCardsFor(playerId: string) {
    const player = this.playerById(playerId);
    if (!player) return [];
    return player.hand.filter((card) => isPlayable(card, player.hand, this.game.discardedCard));
  }

  snapshot(): UnoSnapshot {
    const currentPlayerId = this.idForName(this.game.currentPlayer.name);
    const human = this.playerById(this.humanId)!;
    const legal = new Set(this.legalCardsFor(this.humanId));
    const humanTurn = currentPlayerId === this.humanId && !this.winnerId;
    return {
      players: this.specs.map((spec) => {
        const player = this.game.getPlayer(spec.name);
        return {
          ...spec,
          cardCount: player.hand.length,
          isCurrent: currentPlayerId === spec.id,
          hasUno: player.hand.length === 1,
        };
      }),
      humanHand: human.hand.map((card) => this.cardView(
        card,
        humanTurn && legal.has(card) && (!this.drawnHumanCard || this.drawnHumanCard === card),
      )),
      topCard: this.cardView(this.game.discardedCard),
      currentPlayerId,
      direction: Number(this.game.playingDirection) === 1 ? "clockwise" : "counterclockwise",
      drawPileCount: this.game.deck.length,
      winnerId: this.winnerId,
      turn: this.turn,
      canHumanDraw: humanTurn && !this.drawnHumanCard,
      canHumanPass: humanTurn && Boolean(this.drawnHumanCard),
    };
  }

  playHuman(cardId: string, colorName?: UnoColorName): UnoGameEvent[] {
    if (this.winnerId) return [];
    if (this.idForName(this.game.currentPlayer.name) !== this.humanId) throw new Error("还没轮到你");
    const human = this.playerById(this.humanId)!;
    const card = human.hand.find((candidate) => this.idForCard(candidate) === cardId);
    if (!card) throw new Error("你的手里没有这张牌");
    if (this.drawnHumanCard && card !== this.drawnHumanCard) throw new Error("摸牌后只能打出刚摸到的牌");
    if (!isPlayable(card, human.hand, this.game.discardedCard)) throw new Error("这张牌现在不能出");
    if (isWild(card)) {
      if (!colorName) throw new Error("万能牌需要选择颜色");
      card.color = COLOR_VALUES[colorName];
    }

    const events: UnoGameEvent[] = [];
    if (human.hand.length === 2) {
      this.game.uno(human);
      events.push(this.makeEvent("uno", this.humanId, "你喊了 UNO！", { significant: true }));
    }
    const beforeCounts = new Map(this.specs.map((spec) => [spec.id, this.game.getPlayer(spec.name).hand.length]));
    this.game.play(card);
    this.drawnHumanCard = null;
    const affected = this.specs
      .filter((spec) => this.game.getPlayer(spec.name).hand.length > (beforeCounts.get(spec.id) ?? 0))
      .map((spec) => spec.id);
    events.push(this.makeEvent("play", this.humanId, this.describePlay("你", card, affected), {
      card,
      targetIds: affected,
      significant: card.value >= Value.DRAW_TWO || human.hand.length <= 2,
    }));
    if (human.hand.length === 0) {
      this.winnerId = this.humanId;
      events.push(this.makeEvent("win", this.humanId, "你打完了所有手牌，赢下这一局！", { significant: true }));
    }
    this.turn += 1;
    return events;
  }

  drawHuman(): UnoGameEvent[] {
    if (this.winnerId) return [];
    if (this.idForName(this.game.currentPlayer.name) !== this.humanId) throw new Error("还没轮到你");
    if (this.drawnHumanCard) throw new Error("这一回合已经摸过牌了");
    const human = this.playerById(this.humanId)!;
    const before = new Set(human.hand);
    this.game.draw();
    const drawn = human.hand.find((card) => !before.has(card)) ?? human.hand[human.hand.length - 1];
    this.drawnHumanCard = drawn;
    const playable = isPlayable(drawn, human.hand, this.game.discardedCard);
    const events = [this.makeEvent("draw", this.humanId, playable ? "你摸了一张牌，可以选择打出或结束回合。" : "你摸了一张牌，但不能出，回合自动结束。")];
    if (!playable) {
      this.game.pass();
      this.drawnHumanCard = null;
      this.turn += 1;
    }
    return events;
  }

  passHuman(): UnoGameEvent[] {
    if (!this.drawnHumanCard) throw new Error("摸牌后才能结束回合");
    this.game.pass();
    this.drawnHumanCard = null;
    this.turn += 1;
    return [this.makeEvent("pass", this.humanId, "你保留了摸到的牌，结束回合。")];
  }

  runBotTurn(): UnoGameEvent[] {
    if (this.winnerId) return [];
    const actor = this.game.currentPlayer;
    const actorId = this.idForName(actor.name);
    if (actorId === this.humanId) return [];

    const nextCount = this.game.nextPlayer.hand.length;
    let card = chooseRuleBotCard(actor.hand, this.game.discardedCard, nextCount);
    if (!card) {
      const before = new Set(actor.hand);
      this.game.draw();
      const drawn = actor.hand.find((candidate) => !before.has(candidate)) ?? actor.hand[actor.hand.length - 1];
      card = isPlayable(drawn, actor.hand, this.game.discardedCard) ? drawn : null;
      if (!card) {
        this.game.pass();
        this.turn += 1;
        return [this.makeEvent("draw", actorId, `${actor.name}摸了一张牌并结束回合。`)];
      }
    }

    if (isWild(card)) card.color = dominantColor(actor.hand.filter((candidate) => candidate !== card));
    const events: UnoGameEvent[] = [];
    if (actor.hand.length === 2) {
      this.game.uno(actor);
      events.push(this.makeEvent("uno", actorId, `${actor.name}喊了 UNO！`, { significant: true }));
    }
    const beforeCounts = new Map(this.specs.map((spec) => [spec.id, this.game.getPlayer(spec.name).hand.length]));
    this.game.play(card);
    const affected = this.specs
      .filter((spec) => this.game.getPlayer(spec.name).hand.length > (beforeCounts.get(spec.id) ?? 0))
      .map((spec) => spec.id);
    events.push(this.makeEvent("play", actorId, this.describePlay(actor.name, card, affected), {
      card,
      targetIds: affected,
      significant: affected.includes(this.humanId) || card.value >= Value.DRAW_TWO || actor.hand.length <= 2,
    }));
    if (actor.hand.length === 0) {
      this.winnerId = actorId;
      events.push(this.makeEvent("win", actorId, `${actor.name}打完了所有手牌，赢下这一局。`, { significant: true }));
    }
    this.turn += 1;
    return events;
  }

  private describePlay(actorName: string, card: Card, affected: string[]) {
    const label = VALUE_LABELS[card.value];
    const color = COLOR_NAMES[card.color];
    const colorLabel = { red: "红色", blue: "蓝色", green: "绿色", yellow: "黄色" }[color];
    const targetNames = affected
      .map((id) => this.specs.find((player) => player.id === id)?.name)
      .filter(Boolean)
      .join("、");
    if (card.value === Value.WILD || card.value === Value.WILD_DRAW_FOUR) {
      return `${actorName}打出${label}，把颜色改成了${colorLabel}${targetNames ? `，${targetNames}被迫摸牌` : ""}。`;
    }
    if (card.value === Value.DRAW_TWO) return `${actorName}打出${colorLabel} +2，${targetNames || "下一位玩家"}摸了两张。`;
    if (card.value === Value.SKIP) return `${actorName}打出${colorLabel}跳过牌，下一位玩家被跳过。`;
    if (card.value === Value.REVERSE) return `${actorName}打出${colorLabel}反转牌，出牌方向改变。`;
    return `${actorName}打出${colorLabel} ${label}。`;
  }
}

