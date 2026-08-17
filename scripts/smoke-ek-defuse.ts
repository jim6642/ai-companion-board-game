// Smoke test: force a bot to draw an Exploding Kitten and verify the
// game auto-resolves the defuse insertion instead of deadlocking.
// Run with `npx tsx scripts/smoke-ek-defuse.ts`.
import { CompanionExplodingKittensEngine } from "../src/lib/exploding-kittens/engine";

const seedRng = (s: number) => {
  let state = s;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

function setupWithHumanHand(hand: string[]) {
  // Build a 4-player game where the human's starting hand is exactly the
  // named cards. We do this by overriding the engine after construction.
  const rng = seedRng(7);
  const engine = new CompanionExplodingKittensEngine(
    [
      { id: "human", name: "你", isHuman: true },
      { id: "lin-xia", name: "温婉" },
      { id: "su-yao", name: "沈棠" },
      { id: "gu-qinglan", name: "凌雪" },
    ],
    rng,
  );
  // Reach into the engine to swap the human's hand.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  const human = internal.players.find((p: { id: string }) => p.id === "human");
  const named = ["defuse", "skip", "attack", "see-future", "shuffle"] as const;
  const want = hand.slice(0, 5);
  while (human.hand.length) human.hand.pop();
  for (const name of want) {
    const kind = named.includes(name as (typeof named)[number]) ? (name as (typeof named)[number]) : "skip";
    // We need matching card objects. Pull them out of the discard / deck
    // rather than hand-rolling; the easiest path is to take the first
    // matching card from anywhere and re-tag it.
    const src =
      internal.deck.find((c: { kind: string }) => c.kind === kind) ||
      internal.discardPile.find((c: { kind: string }) => c.kind === kind) ||
      internal.deck[0] ||
      internal.discardPile[0];
    if (src) {
      const clone = { ...src, kind, id: `forced-${kind}-${human.hand.length}` };
      human.hand.push(clone);
    }
  }
  return engine;
}

function runScenario(label: string, hand: string[], maxTurns: number) {
  const engine = setupWithHumanHand(hand);
  const rng = seedRng(13);

  let snap = engine.snapshot();
  let turns = 0;
  while (snap.phase === "play" && turns < maxTurns) {
    if (snap.currentPlayerId === "human") {
      if (snap.needsDefuseInsertion) {
        // Simulate the human picking the top of the deck
        const events = engine.insertExplodingKitten("human", 0);
        snap = engine.snapshot();
        void events;
      } else {
        try {
          engine.draw();
        } catch (e) {
          console.error(`  [${label}] draw threw at turn ${turns}:`, (e as Error).message);
          break;
        }
        snap = engine.snapshot();
      }
    } else {
      const before = snap.currentPlayerId;
      // The bot can chain several non-end-turn cards (See Future, Shuffle,
      // Favor, cat combos) before drawing. Mirror what the page's useEffect
      // does: call runBotTurn up to 8 times or until the turn ends, and let
      // runBotTurn auto-insert when needsDefuseInsertion is set.
      let chained = 0;
      while (snap.currentPlayerId === before && snap.phase === "play" && chained < 8) {
        engine.runBotTurn();
        snap = engine.snapshot();
        chained += 1;
      }
      if (snap.currentPlayerId === before && snap.phase === "play") {
        console.error(`  [${label}] bot turn made no progress at turn ${turns} after 8 chained runBotTurn calls`);
        break;
      }
    }
    turns += 1;
  }
  const phase = snap.phase;
  const alive = snap.players.filter((p) => p.alive).length;
  const finalDeck = snap.deckCount;
  console.log(`[${label}] turns=${turns} phase=${phase} alive=${alive} deck=${finalDeck}`);
  if (phase === "play") {
    console.error(`[${label}] FAIL: game did not end after ${turns} turns`);
    process.exit(1);
  }
  if (alive < 1) {
    console.error(`[${label}] FAIL: no survivors`);
    process.exit(1);
  }
}

console.log("Scenario 1: human draws EK and defuses");
runScenario("human-defuse", ["defuse", "attack", "skip", "see-future", "shuffle"], 80);

console.log("Scenario 2: bot draws EK and defuses (the deadlock case)");
runScenario("bot-defuse", ["skip", "skip", "skip", "see-future", "favor"], 80);

console.log("Scenario 3: no EK drawn, game continues to other eliminations");
runScenario("normal-flow", ["defuse", "defuse", "defuse", "defuse", "defuse"], 120);

console.log("All defuse scenarios passed.");
