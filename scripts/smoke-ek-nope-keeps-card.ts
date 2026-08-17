// Smoke test: when a card gets Noped, does the original card stay in
// the actor's hand? (Per the rules, the card was committed to the
// discard only when the action resolves, so a Nope on the chain
// leaves the original card untouched in the actor's hand.)
//
// We play a Favor on lin-xia (strategic 0.95 cancel preference) and
// force lin-xia to always have a Nope. We then check that:
//   - a Nope event was emitted
//   - lin-xia's nope card is in the discard pile (consumed)
//   - the human's hand still contains the favor card (returned)
//   - the favor event was NOT emitted (action was cancelled)
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
    ],
    rng(),
  );
}

function forceHand(engine: ReturnType<typeof makeEngine>, pid: string, kinds: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  const player = internal.players.find((p: { id: string }) => p.id === pid);
  while (player.hand.length) player.hand.pop();
  for (const kind of kinds) {
    const src =
      internal.deck.find((c: { kind: string }) => c.kind === kind)
      || internal.discardPile.find((c: { kind: string }) => c.kind === kind)
      || internal.deck[0];
    if (src) player.hand.push({ ...src, kind, id: `forced-${pid}-${kind}-${player.hand.length}` });
  }
}

const engine = makeEngine(1);
// Human: favor (about to be played)
// Lin: nope + lots of stuff (so the strategic 0.95 fires; she always has a nope)
// Su: skip (no nope, won't be in the candidate pool)
forceHand(engine, "human", ["favor"]);
forceHand(engine, "lin-xia", ["nope", "skip", "attack", "see-future", "shuffle"]);
forceHand(engine, "su-yao", ["skip", "attack", "see-future", "shuffle"]);

const before = engine.snapshot();
const humanHandBefore = before.humanHand.map((c) => c.kind);
const favorCard = before.humanHand.find((c) => c.kind === "favor")!;
const linBefore = before.players.find((p) => p.id === "lin-xia")!;
const linHandBefore = linBefore.handCount;
const discardBefore = before.discardPile.length;

const events = engine.playCard({
  kind: "favor",
  actorId: "human",
  cardIds: [favorCard.id],
  targetId: "lin-xia",
});

const after = engine.snapshot();
const nopeEvents = events.filter((e) => e.kind === "nope");
const favorEvents = events.filter((e) => e.kind === "favor");
const humanHandAfter = after.humanHand.map((c) => c.kind);
const linAfter = after.players.find((p) => p.id === "lin-xia")!;
const discardAfter = after.discardPile.length;
const topDiscard = after.discardPile[after.discardPile.length - 1];

console.log(`nope events: ${nopeEvents.length}, favor events: ${favorEvents.length}`);
console.log(`human hand before: ${humanHandBefore.join(",")}`);
console.log(`human hand after:  ${humanHandAfter.join(",")}`);
console.log(`lin hand: ${linHandBefore} -> ${linAfter.handCount}`);
console.log(`discard pile: ${discardBefore} -> ${discardAfter}`);
console.log(`top of discard: ${topDiscard?.kind}`);

let failed = false;
if (nopeEvents.length === 0) {
  console.error("FAIL: expected at least 1 Nope event");
  failed = true;
}
if (favorEvents.length > 0) {
  console.error("FAIL: favor action was NOT cancelled (favor event fired)");
  failed = true;
}
if (!humanHandAfter.includes("favor")) {
  console.error("FAIL: human lost the favor card — should have stayed in hand");
  failed = true;
}
if (linAfter.handCount !== linHandBefore - 1) {
  console.error(`FAIL: lin-xia handCount ${linHandBefore} -> ${linAfter.handCount}, expected -1 (consumed her nope)`);
  failed = true;
}
if (topDiscard?.kind !== "nope") {
  console.error(`FAIL: top of discard is ${topDiscard?.kind}, expected nope`);
  failed = true;
}

if (failed) process.exit(1);
console.log("Noped action kept the original card in the actor's hand. ✓");
