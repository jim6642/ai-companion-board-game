// Smoke test: cat-combo picker flows.
//
// 2-cat combo: target chooses which card to hand over (official rules).
// 5-cat combo: actor chooses which card to take from the discard pile.
//
// We verify:
//   - After 2 cats, the target's hand loses the chosen card, and the
//     requester received it.
//   - After 5 cats, the discard pile loses the chosen card and the
//     actor received it.
//   - When the picker is a bot, the picker auto-resolves on its turn
//     via runBotTurn().
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

// 1. Human plays 2 cats on a bot. Bot (target) auto-picks via runBotTurn.
{
  const engine = makeEngine(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  for (const p of internal.players) while (p.hand.length) p.hand.pop();
  internal.currentPlayerId = "human";
  internal.deck = [];
  // Put 2 same-kind cats in human's hand
  const human = internal.players.find((p: { id: string }) => p.id === "human");
  human.hand.push({ id: "h-cat-1", kind: "cat", catKind: "potato", name: "potato", effect: "", symbol: "🥔", tone: "#fde68a" });
  human.hand.push({ id: "h-cat-2", kind: "cat", catKind: "potato", name: "potato", effect: "", symbol: "🥔", tone: "#fde68a" });
  // Su-yao (target) has defuse, skip, see-future. Bot should give away
  // the skip (lowest priority in the heuristic: skip < see-future < defuse).
  const target = internal.players.find((p: { id: string }) => p.id === "su-yao");
  target.hand.push({ id: "t-defuse", kind: "defuse", name: "defuse", effect: "", symbol: "🧯", tone: "#34d399" });
  target.hand.push({ id: "t-skip", kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  target.hand.push({ id: "t-seefut", kind: "see-future", name: "see-future", effect: "", symbol: "🔮", tone: "#a78bfa" });

  const events = engine.playCard({
    kind: "cat-combo",
    actorId: "human",
    cardIds: ["h-cat-1", "h-cat-2"],
    targetId: "su-yao",
    comboSize: 2,
  });

  const snapAfter = engine.snapshot();
  if (!snapAfter.pendingCatStealChoice || snapAfter.pendingCatStealChoice.targetId !== "su-yao") {
    console.error(`FAIL: pending state wrong: ${JSON.stringify(snapAfter.pendingCatStealChoice)}`);
    process.exit(1);
  }
  console.log(`[cat-2 human→su-yao] pending target = ${snapAfter.pendingCatStealChoice.targetId} OK`);

  // Cycle: human's turn ended, next alive is lin-xia (bots only).
  // Lin-xia has no cards, but with 0 cards and `chooseEKBotMove`'s
  // defensive "if (!hasDefuse && handSize <= 1) return draw", the bot
  // would try to draw from an empty deck. The engine handles empty
  // deck by reshuffling discard (but discard is empty). So it returns
  // no events. Then it's su-yao's turn, who is the picker.
  let attempts = 0;
  while (attempts++ < 10) {
    const s = engine.snapshot();
    if (!s.pendingCatStealChoice) break;
    if (s.currentPlayerId === "human") {
      console.error("FAIL: pending state arrived at human's turn");
      process.exit(1);
    }
    engine.runBotTurn();
  }
  const resolved = engine.snapshot();
  if (resolved.pendingCatStealChoice) {
    console.error("FAIL: pending state never resolved");
    process.exit(1);
  }
  // Su-yao had: defuse, skip, see-future. Heuristic picks lowest
  // priority first. Order: favor > shuffle > nope > skip > see-future
  // > attack > defuse. So bot gives away "skip".
  const suFinal = resolved.players.find((p) => p.id === "su-yao")!;
  const humanFinal = resolved.humanHand;
  if (suFinal.handCount !== 2) {
    console.error(`FAIL: su-yao should have 2 cards (gave away 1), got ${suFinal.handCount}`);
    process.exit(1);
  }
  if (!humanFinal.some((c) => c.kind === "skip")) {
    console.error("FAIL: human should have received the skip (was " + humanFinal.map((c) => c.kind).join(",") + ")");
    process.exit(1);
  }
  console.log(`[cat-2] bot gave away skip -> human received it OK`);
}

// 2. Human plays 5 cats. Human (actor) picks defuse from discard pile.
{
  const engine = makeEngine(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  for (const p of internal.players) while (p.hand.length) p.hand.pop();
  internal.currentPlayerId = "human";
  internal.deck = [];
  // Build a hand with 5 different cat kinds
  const human = internal.players.find((p: { id: string }) => p.id === "human");
  const catKinds = ["potato", "taco", "rainbow", "beard", "watermelon"];
  for (const k of catKinds) {
    human.hand.push({ id: `h-cat-${k}`, kind: "cat", catKind: k, name: k, effect: "", symbol: "🐱", tone: "#ccc" });
  }
  // Add a defuse to the discard pile (with 6 other cards)
  internal.discardPile.push({ id: "d-defuse", kind: "defuse", name: "defuse", effect: "", symbol: "🧯", tone: "#34d399" });
  internal.discardPile.push({ id: "d-skip1", kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  internal.discardPile.push({ id: "d-skip2", kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  internal.discardPile.push({ id: "d-attack", kind: "attack", name: "attack", effect: "", symbol: "⚔️", tone: "#fb923c" });
  internal.discardPile.push({ id: "d-nope", kind: "nope", name: "nope", effect: "", symbol: "🚫", tone: "#f472b6" });

  engine.playCard({
    kind: "cat-combo",
    actorId: "human",
    cardIds: catKinds.map((k) => `h-cat-${k}`),
    comboSize: 5,
  });

  const snap = engine.snapshot();
  if (!snap.pendingDiscardPick || snap.pendingDiscardPick.actorId !== "human") {
    console.error(`FAIL: pendingDiscardPick wrong: ${JSON.stringify(snap.pendingDiscardPick)}`);
    process.exit(1);
  }
  console.log(`[cat-5 human] pending actor = human OK`);

  const pickEvents = engine.pickFromDiscard("human", "d-defuse");
  const after = engine.snapshot();
  if (after.pendingDiscardPick) {
    console.error("FAIL: pickFromDiscard did not clear state");
    process.exit(1);
  }
  if (after.discardPile.some((c) => c.id === "d-defuse")) {
    console.error("FAIL: defuse still in discard pile after pick");
    process.exit(1);
  }
  if (!after.humanHand.some((c) => c.id === "d-defuse")) {
    console.error("FAIL: defuse not in human's hand after pick");
    process.exit(1);
  }
  console.log(`[cat-5] human picked defuse from discard OK`);
}

// 3. Bot plays 5 cats, no defuse in hand. Bot auto-picks defuse from discard.
{
  const engine = makeEngine(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = engine as any;
  for (const p of internal.players) while (p.hand.length) p.hand.pop();
  internal.currentPlayerId = "lin-xia";
  internal.deck = [];
  const lin = internal.players.find((p: { id: string }) => p.id === "lin-xia");
  const catKinds = ["potato", "taco", "rainbow", "beard", "watermelon"];
  for (const k of catKinds) {
    lin.hand.push({ id: `l-cat-${k}`, kind: "cat", catKind: k, name: k, effect: "", symbol: "🐱", tone: "#ccc" });
  }
  // Add filler cards to the deck so the human's draw doesn't trigger
  // a discard-pile reshuffle (which would empty the discard and fizzle
  // the bot's 5-cat combo).
  for (let i = 0; i < 20; i += 1) {
    internal.deck.push({ id: `filler-${i}`, kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  }
  // Give the human a card to play so they don't have to draw.
  const human = internal.players.find((p: { id: string }) => p.id === "human");
  human.hand.push({ id: "h-skip", kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  // Discard pile has defuse + extras. Bot should pick defuse.
  internal.discardPile.push({ id: "d-skip1", kind: "skip", name: "skip", effect: "", symbol: "⏭️", tone: "#94a3b8" });
  internal.discardPile.push({ id: "d-attack", kind: "attack", name: "attack", effect: "", symbol: "⚔️", tone: "#fb923c" });
  internal.discardPile.push({ id: "d-defuse", kind: "defuse", name: "defuse", effect: "", symbol: "🧯", tone: "#34d399" });

  engine.playCard({
    kind: "cat-combo",
    actorId: "lin-xia",
    cardIds: catKinds.map((k) => `l-cat-${k}`),
    comboSize: 5,
  });

  const snapAfterPlay = engine.snapshot();
  if (!snapAfterPlay.pendingDiscardPick || snapAfterPlay.pendingDiscardPick.actorId !== "lin-xia") {
    console.error(`FAIL: pendingDiscardPick wrong after play: ${JSON.stringify(snapAfterPlay.pendingDiscardPick)}`);
    process.exit(1);
  }

  // Cycle: lin-xia's turn ended, next alive is su-yao, then human, then
  // back to lin-xia. Su-yao has no cards so it draws. Human plays skip
  // (or we just call draw to advance). Eventually lin-xia comes back
  // and resolves the picker.
  let attempts = 0;
  while (attempts++ < 20) {
    const s = engine.snapshot();
    if (!s.pendingDiscardPick) break;
    if (s.currentPlayerId === "human") {
      // Play the human's skip card to advance the turn without
      // touching the discard pile.
      try {
        engine.playCard({ kind: "skip", actorId: "human", cardIds: ["h-skip"] });
      } catch {
        engine.draw();
      }
    } else {
      engine.runBotTurn();
    }
  }
  const resolved = engine.snapshot();
  if (resolved.pendingDiscardPick) {
    console.error("FAIL: bot picker never resolved");
    process.exit(1);
  }
  const linAfter = resolved.players.find((p) => p.id === "lin-xia")!;
  if (!linAfter.handCount || resolved.discardPile.some((c) => c.id === "d-defuse")) {
    console.error(`FAIL: defuse should be in lin-xia's hand, not discard. handCount=${linAfter.handCount}`);
    process.exit(1);
  }
  console.log(`[cat-5 bot] bot picked defuse from discard OK`);
}

console.log("All cat-picker scenarios behave as designed.");
