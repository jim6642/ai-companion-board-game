import {
  CompanionLiarsDiceEngine,
  isLegalLiarsDiceBid,
} from "../src/lib/liars-dice/engine.ts";

const specs = [
  { id: "human", name: "玩家", isHuman: true },
  { id: "a", name: "甲" },
  { id: "b", name: "乙" },
  { id: "c", name: "丙" },
  { id: "d", name: "丁" },
];

const engine = new CompanionLiarsDiceEngine(specs, () => 0.42);
const initial = engine.snapshot();
const firstBid = engine.playHuman({ kind: "bid", quantity: 3, face: 4 });
const afterBid = engine.snapshot();

const checks = {
  classicSetup: initial.players.length === 5 && initial.players.every((player) => player.diceRemaining === 5) && initial.totalDice === 25,
  humanSeesOnlyOwnDice: initial.humanDice.length === 5 && initial.players.every((player) => !("dice" in player)),
  noRevealBeforeChallenge: initial.lastReveal === null && afterBid.lastReveal === null,
  bidAdvancesTurn: firstBid[0]?.kind === "bid" && afterBid.currentPlayerId === "a" && afterBid.currentBid?.quantity === 3,
  normalRaiseSameQuantityHigherFace: isLegalLiarsDiceBid({ quantity: 4, face: 6 }, { quantity: 4, face: 5, bidderId: "a" }, 25),
  normalRaiseRejectsLowerFace: !isLegalLiarsDiceBid({ quantity: 4, face: 4 }, { quantity: 4, face: 5, bidderId: "a" }, 25),
  switchingToOnesUsesCeilingHalf: isLegalLiarsDiceBid({ quantity: 3, face: 1 }, { quantity: 6, face: 4, bidderId: "a" }, 25)
    && !isLegalLiarsDiceBid({ quantity: 2, face: 1 }, { quantity: 6, face: 4, bidderId: "a" }, 25),
  switchingFromOnesUsesDoublePlusOne: isLegalLiarsDiceBid({ quantity: 7, face: 2 }, { quantity: 3, face: 1, bidderId: "a" }, 25)
    && !isLegalLiarsDiceBid({ quantity: 6, face: 6 }, { quantity: 3, face: 1, bidderId: "a" }, 25),
  onesRaiseRequiresQuantity: isLegalLiarsDiceBid({ quantity: 4, face: 1 }, { quantity: 3, face: 1, bidderId: "a" }, 25),
  cannotExceedDiceInPlay: !isLegalLiarsDiceBid({ quantity: 26, face: 6 }, null, 25),
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks }, null, 2));
if (!ok) process.exitCode = 1;
