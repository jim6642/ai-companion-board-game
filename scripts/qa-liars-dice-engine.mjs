import { CompanionLiarsDiceEngine } from "../src/lib/liars-dice/engine.ts";

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const eventCounts = {};
let maxActions = 0;
let maxRounds = 0;
const games = 5000;

for (let game = 0; game < games; game += 1) {
  const random = seeded(9001 + game * 31);
  const humanSeat = game % 5;
  const specs = Array.from({ length: 5 }, (_, index) => ({
    id: index === humanSeat ? "human" : `bot-${index}`,
    name: index === humanSeat ? "玩家" : `机器人${index}`,
    isHuman: index === humanSeat,
  }));
  const engine = new CompanionLiarsDiceEngine(specs, random);
  let actions = 0;
  let safety = 0;
  while (engine.snapshot().phase !== "game-over") {
    safety += 1;
    if (safety > 3000) throw new Error(`Game ${game} exceeded safety limit`);
    const snapshot = engine.snapshot();
    let events = [];
    if (snapshot.phase === "round-over") {
      events = engine.startNextRound();
    } else if (snapshot.currentPlayerId === "human") {
      const legal = engine.legalMoves();
      const challenge = legal.find((move) => move.kind === "challenge");
      const bids = legal.filter((move) => move.kind === "bid");
      const move = challenge && (snapshot.bidHistory.length >= 5 || random() < 0.28)
        ? challenge
        : bids[Math.floor(random() * bids.length)] ?? challenge;
      events = engine.playHuman(move);
      actions += 1;
    } else {
      events = engine.runBotTurn();
      actions += 1;
    }
    for (const event of events) eventCounts[event.kind] = (eventCounts[event.kind] ?? 0) + 1;
  }
  const final = engine.snapshot();
  if (!final.winnerId) throw new Error(`Game ${game} has no winner`);
  if (final.players.filter((player) => player.active).length !== 1) throw new Error(`Game ${game} ended with wrong survivor count`);
  if (final.players.reduce((sum, player) => sum + player.diceRemaining, 0) > 21) throw new Error(`Game ${game} did not lose enough dice`);
  maxActions = Math.max(maxActions, actions);
  maxRounds = Math.max(maxRounds, final.round);
}

const requiredEvents = ["bid", "challenge", "reveal", "die-lost", "eliminate", "game-win"];
const ok = requiredEvents.every((kind) => (eventCounts[kind] ?? 0) > 0);
console.log(JSON.stringify({ ok, games, maxActions, maxRounds, eventCounts }, null, 2));
if (!ok) process.exitCode = 1;
