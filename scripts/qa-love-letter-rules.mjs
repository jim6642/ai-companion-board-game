import { CompanionLoveLetterEngine } from "../src/lib/love-letter/engine.ts";

const specs = [
  { id: "human", name: "玩家", isHuman: true },
  { id: "ai-1", name: "林夏" },
  { id: "ai-2", name: "苏遥" },
  { id: "ai-3", name: "唐果" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rig(assignments, { protectedIds = [], emptyDeck = false } = {}) {
  const engine = new CompanionLoveLetterEngine(specs, () => 0.31);
  const players = engine.players;
  const pool = [engine.setAside, ...engine.deck, ...players.flatMap((player) => player.hand)].filter(Boolean);
  const take = (kind) => {
    const index = pool.findIndex((card) => card.kind === kind);
    if (index < 0) throw new Error(`No ${kind} card left in rig pool`);
    return pool.splice(index, 1)[0];
  };
  players.forEach((player) => {
    player.hand = (assignments[player.id] ?? []).map(take);
    player.discards = [];
    player.active = true;
    player.protected = protectedIds.includes(player.id);
    player.favor = 0;
  });
  engine.currentPlayerIndex = 0;
  engine.phase = "play";
  engine.roundWinnerIds = [];
  engine.gameWinnerIds = [];
  engine.privateNotices = Object.fromEntries(specs.map((item) => [item.id, null]));
  engine.knowledge = Object.fromEntries(specs.map((observer) => [observer.id, Object.fromEntries(specs.map((target) => [target.id, null]))]));
  engine.setAside = pool.shift() ?? null;
  engine.deck = emptyDeck ? [] : pool;
  return engine;
}

const checks = {};

{
  const engine = rig({ human: ["countess", "king"], "ai-1": ["guard"], "ai-2": ["priest"], "ai-3": ["baron"] });
  const legal = engine.legalMoves();
  checks.countessForced = legal.length === 1 && engine.players[0].hand.find((card) => card.id === legal[0].cardId)?.kind === "countess";
}

{
  const engine = rig({ human: ["guard", "priest"], "ai-1": ["princess"], "ai-2": ["handmaid"], "ai-3": ["king"] });
  const guard = engine.players[0].hand.find((card) => card.kind === "guard");
  const move = engine.legalMoves().find((item) => item.cardId === guard.id && item.targetId === "ai-1" && item.guess === "princess");
  const events = engine.playHuman(move);
  checks.guardGuessEliminates = !engine.players[1].active && events.some((event) => event.kind === "eliminate" && event.targetIds.includes("ai-1"));
}

{
  const engine = rig(
    { human: ["guard", "priest"], "ai-1": ["princess"], "ai-2": ["handmaid"], "ai-3": ["king"] },
    { protectedIds: ["ai-1", "ai-2", "ai-3"] },
  );
  checks.allProtectedCancelsOtherTarget = engine.legalMoves().every((move) => !move.targetId);
}

{
  const engine = rig({ human: ["prince", "guard"], "ai-1": ["princess"], "ai-2": ["handmaid"], "ai-3": ["king"] });
  const prince = engine.players[0].hand.find((card) => card.kind === "prince");
  const move = engine.legalMoves().find((item) => item.cardId === prince.id && item.targetId === "ai-1");
  engine.playHuman(move);
  checks.princePrincessEliminates = !engine.players[1].active;
}

{
  const engine = rig({ human: ["baron", "princess"], "ai-1": ["guard"], "ai-2": ["handmaid"], "ai-3": ["king"] });
  const baron = engine.players[0].hand.find((card) => card.kind === "baron");
  const move = engine.legalMoves().find((item) => item.cardId === baron.id && item.targetId === "ai-1");
  engine.playHuman(move);
  checks.baronLowerTargetEliminates = !engine.players[1].active && engine.players[0].active;
}

{
  const engine = rig({ human: ["baron", "guard"], "ai-1": ["princess"], "ai-2": ["handmaid"], "ai-3": ["king"] });
  const baron = engine.players[0].hand.find((card) => card.kind === "baron");
  const move = engine.legalMoves().find((item) => item.cardId === baron.id && item.targetId === "ai-1");
  engine.playHuman(move);
  checks.baronActorCanLose = !engine.players[0].active && engine.snapshot().phase === "play" && engine.snapshot().currentPlayerId !== "human";
}

{
  const engine = rig({ human: ["king", "guard"], "ai-1": ["princess"], "ai-2": ["handmaid"], "ai-3": ["priest"] });
  const king = engine.players[0].hand.find((card) => card.kind === "king");
  const move = engine.legalMoves().find((item) => item.cardId === king.id && item.targetId === "ai-1");
  engine.playHuman(move);
  const snapshot = engine.snapshot();
  checks.kingSwapIsPrivateAndCorrect = snapshot.humanHand[0]?.kind === "princess" && snapshot.privateNotice?.includes("公主");
}

{
  const engine = rig({ human: ["princess", "guard"], "ai-1": ["priest"], "ai-2": ["handmaid"], "ai-3": ["king"] });
  const princess = engine.players[0].hand.find((card) => card.kind === "princess");
  engine.playHuman(engine.legalMoves().find((item) => item.cardId === princess.id));
  checks.playPrincessSelfEliminates = !engine.players[0].active;
}

{
  const engine = rig(
    { human: ["countess", "guard"], "ai-1": ["guard"], "ai-2": ["guard"], "ai-3": ["guard"] },
    { emptyDeck: true },
  );
  const countess = engine.players[0].hand.find((card) => card.kind === "countess");
  engine.playHuman(engine.legalMoves().find((item) => item.cardId === countess.id));
  const ended = engine.snapshot();
  checks.deckTieAwardsAll = ended.phase === "round-over" && ended.roundWinnerIds.length === 4 && ended.players.every((player) => player.favor === 1);
  engine.startNextRound();
  const next = engine.snapshot();
  checks.nextRoundResetsTransientState = next.phase === "play"
    && next.round === 2
    && next.players.every((player) => player.active && !player.protected && player.discards.length === 0)
    && next.players.every((player) => player.favor === 1);
}

assert(Object.values(checks).every(Boolean), JSON.stringify(checks, null, 2));
console.log(JSON.stringify({ ok: true, checks }, null, 2));

