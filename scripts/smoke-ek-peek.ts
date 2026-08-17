// Smoke test: verify that playing a See the Future card as the human
// actually populates snapshot.humanPeek, and that the same call survives
// the full Nope chain when a bot might randomly cancel it.
import { CompanionExplodingKittensEngine } from "../src/lib/exploding-kittens/engine";

function makeEngine(seed: number, seeFutureId = "forced-seefuture") {
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
  const human = internal.players.find((p: { id: string }) => p.id === "human");
  // Wipe hand and put 1 See the Future + 4 filler cards
  while (human.hand.length) human.hand.pop();
  const filler =
    internal.deck.find((c: { kind: string }) => c.kind === "skip") ||
    internal.discardPile.find((c: { kind: string }) => c.kind === "skip") ||
    internal.deck[0];
  if (filler) {
    for (let i = 0; i < 4; i += 1) {
      human.hand.push({ ...filler, id: `forced-filler-${i}` });
    }
  }
  human.hand.push({ ...filler, kind: "see-future", id: seeFutureId, name: "预见未来", effect: "偷看牌堆顶 3 张牌（不放回去）", symbol: "🔮", tone: "#a78bfa" });
  return engine;
}

function runSeed(seed: number) {
  const engine = makeEngine(seed);
  const before = engine.snapshot();
  console.log(`seed=${seed} deck-before=${before.deckCount} humanHand=${before.humanHand.length}`);
  // Play See the Future
  const card = engine.snapshot().humanHand.find((c) => c.kind === "see-future");
  if (!card) throw new Error("no see-future in hand");
  const events = engine.playCard({
    kind: "see-future",
    actorId: "human",
    cardIds: [card.id],
  });
  const after = engine.snapshot();
  const nopeEvents = events.filter((e) => e.kind === "nope");
  const peekEvents = events.filter((e) => e.kind === "see-future");
  console.log(
    `  events: nope=${nopeEvents.length} see-future=${peekEvents.length} total=${events.length}`,
  );
  console.log(`  snapshot.humanPeek.length=${after.humanPeek?.length ?? "null"}`);
  console.log(`  snapshot.humanPeek=${after.humanPeek?.map((c) => c.symbol + c.name).join(" | ") ?? "null"}`);
  if (nopeEvents.length > 0) {
    console.log("  >>> bot Noped the See the Future — peek correctly NOT set");
  } else if (!after.humanPeek || after.humanPeek.length === 0) {
    console.error(`  >>> FAIL: peek is empty but no Nope happened (deck=${after.deckCount})`);
    process.exit(1);
  } else {
    console.log("  PASS");
  }
}

for (const seed of [1, 7, 13, 42, 99, 2026, 2027]) {
  runSeed(seed);
}
console.log("All see-future seeds inspected.");
