// Smoke test: verify that the bot's Nope decision is driven by the
// game state, not random. Three scenarios:
//
//   1. Human plays Favor on a bot. That bot should ALWAYS Nope
//      (95% preference, plus the few-noise-rolls that still win).
//   2. Human plays See the Future. Bots should almost never Nope
//      (only 10% preference, no strategic reason to cancel).
//   3. Human plays Skip after peeking the top of the deck. The human
//      should ALWAYS Nope to force the next player to draw the EK.
//      (Per-bot peek is a known engine limitation; the strategic
//      Skip-after-peek branch for bots is unreachable today, so this
//      test exercises the human path instead. The bot branch is
//      still wired in engine.ts and will fire the moment per-bot
//      peek storage is added.)
import { CompanionExplodingKittensEngine } from "../src/lib/exploding-kittens/engine";

function makeEngineWithHands(
  seed: number,
  handOverrides: Record<string, string[]>,
) {
  const rng = () => {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  };
  const engine = new CompanionExplodingKittensEngine(
    [
      { id: "human", name: "你", isHuman: true },
      { id: "lin-xia", name: "温婉" },
      { id: "su-yao", name: "沈棠" },
      { id: "gu-qinglan", name: "凌雪" },
    ],
    rng(),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  for (const [pid, kinds] of Object.entries(handOverrides)) {
    const player = internal.players.find((p: { id: string }) => p.id === pid);
    while (player.hand.length) player.hand.pop();
    for (const kind of kinds) {
      const src =
        internal.deck.find((c: { kind: string }) => c.kind === kind) ||
        internal.discardPile.find((c: { kind: string }) => c.kind === kind) ||
        internal.deck[0];
      if (src) {
        player.hand.push({ ...src, kind, id: `forced-${pid}-${kind}-${player.hand.length}` });
      }
    }
  }
  return engine;
}

function findCard(engine: ReturnType<typeof makeEngineWithHands>, playerId: string, kind: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  const player = internal.players.find((p: { id: string }) => p.id === playerId);
  return player.hand.find((c: { kind: string }) => c.kind === kind);
}

interface ScenarioStats {
  total: number;
  nopeCount: number;
}

function runScenario(
  label: string,
  build: (seed: number) => {
    engine: ReturnType<typeof makeEngineWithHands>;
    action: { kind: "favor" | "see-future" | "skip"; cardIds: string[]; targetId?: string; actorId: string };
  },
  expected: "always" | "rare" | "after-peek",
) {
  const stats: ScenarioStats = { total: 0, nopeCount: 0 };
  for (let seed = 1; seed <= 200; seed += 1) {
    const { engine, action } = build(seed);
    const events = engine.playCard({ ...action });
    stats.total += 1;
    const nopes = events.filter((e) => e.kind === "nope");
    if (nopes.length > 0) stats.nopeCount += 1;
  }
  const pct = (stats.nopeCount / stats.total) * 100;
  console.log(`[${label}] ${stats.nopeCount}/${stats.total} (${pct.toFixed(0)}%) Noped`);
  if (expected === "always" && pct < 80) {
    console.error(`[${label}] FAIL: expected ~95% Nope, got ${pct.toFixed(0)}%`);
    process.exit(1);
  }
  if (expected === "rare" && pct > 30) {
    console.error(`[${label}] FAIL: expected ~10% Nope, got ${pct.toFixed(0)}%`);
    process.exit(1);
  }
  if (expected === "after-peek" && pct < 70) {
    console.error(`[${label}] FAIL: expected ~85% Nope, got ${pct.toFixed(0)}%`);
    process.exit(1);
  }
}

// Scenario 1: Favor on lin-xia. Lin-xia should always Nope.
runScenario("Favor on lin-xia", (seed) => {
  const engine = makeEngineWithHands(seed, {
    human: ["favor"],
    "lin-xia": ["nope", "skip"],
    "su-yao": ["skip"],
    "gu-qinglan": ["skip"],
  });
  const card = findCard(engine, "human", "favor");
  if (!card) throw new Error("no favor");
  return {
    engine,
    action: { kind: "favor" as const, cardIds: [card.id], targetId: "lin-xia", actorId: "human" },
  };
}, "always");

// Scenario 2: See the Future. Bots should almost never Nope.
runScenario("See the Future (no strategic reason)", (seed) => {
  const engine = makeEngineWithHands(seed, {
    human: ["see-future"],
    "lin-xia": ["nope", "skip"],
    "su-yao": ["nope", "skip"],
    "gu-qinglan": ["nope", "skip"],
  });
  const card = findCard(engine, "human", "see-future");
  if (!card) throw new Error("no see-future");
  return {
    engine,
    action: { kind: "see-future" as const, cardIds: [card.id], actorId: "human" },
  };
}, "rare");

// Scenario 3: Human peeked an EK on top, then a bot plays Skip. The
// human should ALWAYS Nope to force the next bot to draw the EK.
// This is the path the engine actually supports today (peek is only
// stored for the human via humanPeek). The bot peek branch in
// `botCancelPreference` is wired but unreachable until we add per-bot
// peek storage; that is a separate engine change.
runScenario("Skip when human peeked an EK on top", (seed) => {
  const engine = makeEngineWithHands(seed, {
    human: ["see-future", "nope"],
    "lin-xia": ["skip", "nope"],
    "su-yao": ["nope"],
    "gu-qinglan": ["nope"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  // Inject an EK at the top of the deck so the human's peek reveals it
  const ekSrc = internal.deck.find((c: { kind: string }) => c.kind === "exploding-kitten")
    || internal.discardPile.find((c: { kind: string }) => c.kind === "exploding-kitten")
    || internal.discardPile[0];
  if (ekSrc) {
    const ek = { ...ekSrc, kind: "exploding-kitten", id: "forced-ek" };
    internal.deck.push(ek);
  }
  // Have the human play See the Future first so humanPeek is populated
  const sfCard = findCard(engine, "human", "see-future");
  if (sfCard) {
    engine.playCard({ kind: "see-future", actorId: "human", cardIds: [sfCard.id] });
    // humanPeek now reflects top 3 deck cards; the EK we pushed is on top
  }
  // Move the current player to lin-xia so she can play Skip
  internal.currentPlayerId = "lin-xia";
  const card = findCard(engine, "lin-xia", "skip");
  if (!card) throw new Error("no skip");
  return {
    engine,
    action: { kind: "skip" as const, cardIds: [card.id], actorId: "lin-xia" },
  };
}, "after-peek");

console.log("All Nope-decision scenarios behaved as expected.");
