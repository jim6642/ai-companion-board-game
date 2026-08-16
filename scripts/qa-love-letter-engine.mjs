import {
  CompanionLoveLetterEngine,
  LOVE_LETTER_WIN_FAVOR,
} from "../src/lib/love-letter/engine.ts";

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSnapshot(snapshot) {
  assert(snapshot.players.length === 4, "always four players");
  assert(snapshot.deckCount >= 0 && snapshot.deckCount <= 11, `invalid deck count ${snapshot.deckCount}`);
  assert(snapshot.players.every((player) => player.favor >= 0 && player.favor <= LOVE_LETTER_WIN_FAVOR), "invalid favor score");
  assert(snapshot.players.every((player) => player.handCount >= 0 && player.handCount <= 2), "invalid hand count");
  assert(snapshot.players.filter((player) => player.isCurrent).length <= 1, "multiple current players");
  if (snapshot.phase === "play") {
    const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
    assert(current?.active, "current player must be active");
    assert(current?.handCount === 2, "current player must have two cards after drawing");
    assert(snapshot.players.filter((player) => player.active).length >= 2, "play phase needs at least two active players");
  }
  if (snapshot.phase === "round-over") assert(snapshot.roundWinnerIds.length > 0, "round-over needs winner");
  if (snapshot.phase === "game-over") {
    assert(snapshot.gameWinnerIds.length > 0, "game-over needs winner");
    assert(snapshot.gameWinnerIds.every((id) => snapshot.players.find((player) => player.id === id)?.favor >= LOVE_LETTER_WIN_FAVOR), "winner lacks enough favor");
  }
}

function runGame(seed, humanSeat) {
  const random = seededRandom(seed);
  const names = ["林夏", "苏遥", "顾清岚", "唐果"];
  const specs = names.map((name, index) => ({
    id: index === humanSeat ? "human" : `ai-${index}`,
    name: index === humanSeat ? "玩家" : name,
    isHuman: index === humanSeat,
  }));
  const engine = new CompanionLoveLetterEngine(specs, random);
  const eventCounts = new Map();
  let actions = 0;
  let rounds = 1;
  while (actions < 1200) {
    const before = engine.snapshot();
    assertSnapshot(before);
    if (before.phase === "game-over") {
      return { actions, rounds, eventCounts, winnerIds: before.gameWinnerIds };
    }
    let events;
    if (before.phase === "round-over") {
      events = engine.startNextRound();
      rounds += 1;
    } else if (engine.isHumanTurn()) {
      const legal = engine.legalMoves();
      assert(legal.length > 0, "human turn must have legal move");
      events = engine.playHuman(legal[Math.floor(random() * legal.length)]);
    } else {
      events = engine.runBotTurn();
      assert(events.length > 0, "bot turn must produce events");
    }
    for (const event of events) eventCounts.set(event.kind, (eventCounts.get(event.kind) ?? 0) + 1);
    actions += 1;
  }
  throw new Error(`game ${seed} exceeded action limit`);
}

const aggregate = new Map();
let maxActions = 0;
let maxRounds = 0;
const games = 5000;
for (let index = 0; index < games; index += 1) {
  const result = runGame(1009 + index * 7919, index % 4);
  maxActions = Math.max(maxActions, result.actions);
  maxRounds = Math.max(maxRounds, result.rounds);
  for (const [kind, count] of result.eventCounts) aggregate.set(kind, (aggregate.get(kind) ?? 0) + count);
}

for (const kind of ["play", "reveal", "protect", "eliminate", "swap", "discard", "round-win", "game-win"]) {
  assert((aggregate.get(kind) ?? 0) > 0, `event kind ${kind} was never exercised`);
}

console.log(JSON.stringify({
  ok: true,
  games,
  maxActions,
  maxRounds,
  eventCounts: Object.fromEntries(aggregate),
}, null, 2));
