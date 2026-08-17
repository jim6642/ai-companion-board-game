// Smoke test: verify that legalActionsFor() populates the `actionKind`
// field on every play-card legal action, so the UI's playLegal() can
// translate it into EKAction.kind without falling back to a no-op
// silent branch.
//
// Regression target: previously only `cardKind` was set; the page
// read `actionKind` and got `undefined`, so the engine's resolveAction
// switch fell through with no case match. See-future never set
// humanPeek; favor never stole a card; the card was just discarded.
//
// We test all action kinds the human can play directly.
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

// Hand 1: verify see-future produces actionKind:"see-future"
forceHand(engine, "human", ["see-future", "nope"]);
const snap1 = engine.snapshot();
const seeFut = snap1.legalActions.find((a) => a.cardKind === "see-future");
if (!seeFut) throw new Error("see-future not in legal actions");
if (seeFut.actionKind !== "see-future") {
  console.error(`FAIL: see-future actionKind = ${seeFut.actionKind}, expected "see-future"`);
  process.exit(1);
}
console.log(`[see-future] actionKind=${seeFut.actionKind} cardKind=${seeFut.cardKind} OK`);

// Hand 2: verify favor produces actionKind:"favor" with targetId
forceHand(engine, "human", ["favor"]);
const snap2 = engine.snapshot();
const favor = snap2.legalActions.find((a) => a.cardKind === "favor");
if (!favor) throw new Error("favor not in legal actions");
if (favor.actionKind !== "favor") {
  console.error(`FAIL: favor actionKind = ${favor.actionKind}, expected "favor"`);
  process.exit(1);
}
if (!favor.targetId) {
  console.error("FAIL: favor should have a targetId");
  process.exit(1);
}
console.log(`[favor] actionKind=${favor.actionKind} targetId=${favor.targetId} OK`);

// Hand 3: verify cat-combo (size 2) produces actionKind:"cat-combo"
forceHand(engine, "human", ["cat", "cat"]);
const snap3 = engine.snapshot();
const cat = snap3.legalActions.find((a) => a.cardKind === "cat");
if (!cat) throw new Error("cat not in legal actions");
if (cat.actionKind !== "cat-combo") {
  console.error(`FAIL: cat-combo actionKind = ${cat.actionKind}, expected "cat-combo"`);
  process.exit(1);
}
console.log(`[cat-combo] actionKind=${cat.actionKind} comboSize=${cat.comboSize} OK`);

// End-to-end: play the favor through the public API and verify the
// stolen card actually moved hands. Strip bots' Nope so the strategic
// 0.95 "favor on me" preference doesn't cancel the action.
forceHand(engine, "human", ["favor", "skip"]);
forceHand(engine, "lin-xia", ["skip"]);
forceHand(engine, "su-yao", ["skip"]);
const before = engine.snapshot();
const targetId = before.players.find((p) => p.id !== "human")!.id;
const targetBefore = before.players.find((p) => p.id === targetId)!;
const targetHandBefore = targetBefore.handCount;
const humanHandBefore = before.humanHand.length;
const favorLegal = before.legalActions.find((a) => a.cardKind === "favor");
if (!favorLegal || !favorLegal.cardId || !favorLegal.actionKind) throw new Error("no favor legal");
const events = engine.playCard({
  kind: favorLegal.actionKind,
  actorId: "human",
  cardIds: [favorLegal.cardId],
  targetId: favorLegal.targetId,
});
const after = engine.snapshot();
const targetAfter = after.players.find((p) => p.id === targetId)!;
const humanHandAfter = after.humanHand.length;
const favorEvent = events.find((e) => e.kind === "favor");
if (!favorEvent) {
  console.error("FAIL: no favor event emitted");
  process.exit(1);
}
if (targetAfter.handCount !== targetHandBefore - 1) {
  console.error(`FAIL: target handCount ${targetHandBefore} -> ${targetAfter.handCount}, expected -1`);
  process.exit(1);
}
if (humanHandAfter !== humanHandBefore) {
  console.error(`FAIL: human handCount ${humanHandBefore} -> ${humanHandAfter}, expected unchanged (lost favor, gained stolen)`);
  process.exit(1);
}
console.log(`[favor-e2e] target ${targetHandBefore}->${targetAfter.handCount} OK human ${humanHandBefore}->${humanHandAfter} OK event="${favorEvent.text}" OK`);

console.log("All actionKind legal-action fields populated correctly.");
