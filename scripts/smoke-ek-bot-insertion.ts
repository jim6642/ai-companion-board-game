// Smoke test: bot strategic EK insertion positions.
//
// With a spare defuse in hand after defusing the EK: bot should mostly
// pick top (lethal to next player, who can't defuse it next).
// Without a spare defuse (used the only one to defuse this EK): bot
// should mostly avoid top (self-preservation).
import { CompanionExplodingKittensEngine } from "../src/lib/exploding-kittens/engine";

function makeEngine(seed: number) {
  const rng = () => {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  };
  return new CompanionExplodingKittensEngine(
    [
      { id: "human", name: "Player", isHuman: true },
      { id: "lin-xia", name: "Lin" },
      { id: "su-yao", name: "Su" },
      { id: "gu-qinglan", name: "Gu" },
    ],
    rng(),
  );
}

// `hasSpareDefuse` controls the bot's hand:
//   true  -> bot holds 2 defuses, defuses the EK with 1, keeps 1 spare
//   false -> bot holds 1 defuse, defuses the EK, 0 spares left
function collectInsertionPositions(hasSpareDefuse: boolean): { top: number; nonTop: number } {
  let top = 0;
  let nonTop = 0;

  for (let seed = 1; seed <= 400; seed += 1) {
    const engine = makeEngine(seed);
    // eslint-disable-next-line @typescript-eslint/no-explicitany
    const internal = engine as any;
    for (const p of internal.players) while (p.hand.length) p.hand.pop();
    internal.currentPlayerId = "lin-xia";
    internal.deck = [];
    internal.discardPile = [];
    // Build a small deck: 10 fillers, then 1 EK on top.
    const N = 10;
    for (let i = 0; i < N; i += 1) {
      internal.deck.push({ id: `filler-${i}`, kind: "skip", name: "skip", effect: "", symbol: "?", tone: "#888" });
    }
    internal.deck.push({ id: "test-ek", kind: "exploding-kitten", name: "ek", effect: "", symbol: "💥", tone: "#000" });
    const bot = internal.players.find((p: { id: string }) => p.id === "lin-xia");
    if (hasSpareDefuse) {
      bot.hand.push({ id: "spare-defuse", kind: "defuse", name: "defuse", effect: "", symbol: "🛠", tone: "#0f0" });
    }
    bot.hand.push({ id: "test-defuse", kind: "defuse", name: "defuse", effect: "", symbol: "🛠", tone: "#0f0" });
    // Give every other player enough cards so the "next player looks
    // vulnerable" gamble branch (handCount <= 2 → 60% top) does not
    // fire and pollute the no-spare-defuse distribution.
    for (const pid of ["human", "su-yao", "gu-qinglan"]) {
      const target = internal.players.find((p: { id: string }) => p.id === pid);
      for (let i = 0; i < 5; i += 1) {
        target.hand.push({ id: `${pid}-filler-${i}`, kind: "skip", name: "skip", effect: "", symbol: "?", tone: "#888" });
      }
    }

    // First call: bot draws EK and auto-defuses (consuming test-defuse).
    engine.runBotTurn();
    // Second call: bot inserts the EK.
    engine.runBotTurn();

    const deck = internal.deck as Array<{ id: string }>;
    const ekIdx = deck.findIndex((c) => c.id === "test-ek");
    if (ekIdx < 0) continue; // bot exploded somehow; skip
    const position = deck.length - 1 - ekIdx;
    if (position === 0) top += 1;
    else nonTop += 1;
  }
  return { top, nonTop };
}

console.log("Bot EK insertion position distribution (400 seeds, maxIndex=10):");
const withSpare = collectInsertionPositions(true);
const withSpareTotal = withSpare.top + withSpare.nonTop;
const withSparePct = withSpareTotal > 0 ? (withSpare.top / withSpareTotal) * 100 : 0;
console.log(`  with spare defuse: top=${withSpare.top}/${withSpareTotal} (${withSparePct.toFixed(0)}%)`);

const withoutSpare = collectInsertionPositions(false);
const withoutSpareTotal = withoutSpare.top + withoutSpare.nonTop;
const withoutSparePct = withoutSpareTotal > 0 ? (withoutSpare.top / withoutSpareTotal) * 100 : 0;
console.log(`  without spare:     top=${withoutSpare.top}/${withoutSpareTotal} (${withoutSparePct.toFixed(0)}%)`);

let failed = false;
if (withSparePct < 60) {
  console.error(`FAIL: with spare defuse, top should be >=60%, got ${withSparePct.toFixed(0)}%`);
  failed = true;
}
if (withoutSparePct > 30) {
  console.error(`FAIL: without spare, top should be <30%, got ${withoutSparePct.toFixed(0)}%`);
  failed = true;
}
if (failed) process.exit(1);
console.log("Strategic bot insertion behaves as designed.");
