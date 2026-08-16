// Regression test for the aeroplane chat/voice queue draining fix.
// See ./qa-queue-drain-helper.mjs for the full bug write-up.
//
// Run:  node --experimental-strip-types scripts/qa-aeroplane-queue-drain.mjs

import { runQueueDrainTest } from "./qa-queue-drain-helper.mjs";

const result = await runQueueDrainTest({
  name: "aeroplane",
  url: "http://localhost:3001/zh/companion/aeroplane",
  debugPort: 9360,
  selectionMarker: "今晚想和谁一起飞",
  characters: ["林夏", "苏遥", "顾清岚"],
  startButtonText: "四人到齐，开始游戏",
  // The aeroplane "roll dice" button is an icon (no text). It is the
  // only enabled button in the turn console whose className contains
  // "dice" (the CSS module mangles the name but keeps the substring).
  humanTurnExpression: `(() => {
    const dice = document.querySelector('button[class*=dice]:not([disabled])');
    if (dice) { dice.click(); return true; }
    return false;
  })()`,
  freshMatchExpression: "document.body.innerText.includes('新的一局已经摆好')",
  // The aeroplane restart control is an icon button without text;
  // the title attribute is "重新开局".
  restartButtonTitle: "重新开局",
  restartButtonText: null,
});

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
