// Regression test for the liars-dice chat/voice queue draining fix.
// See ./qa-queue-drain-helper.mjs for the full bug write-up.
//
// Run:  node --experimental-strip-types scripts/qa-liars-dice-queue-drain.mjs

import { runQueueDrainTest } from "./qa-queue-drain-helper.mjs";

const result = await runQueueDrainTest({
  name: "liars-dice",
  url: "http://localhost:3001/zh/companion/liars-dice",
  debugPort: 9358,
  selectionMarker: "今晚想和谁互相诈唬",
  characters: ["林夏", "苏遥", "顾清岚", "唐果"],
  startButtonText: "和这四人开局",
  humanTurnExpression: `(() => {
    const bid = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('确认叫点') && !node.disabled);
    if (bid) { bid.click(); return true; }
    return false;
  })()`,
  freshMatchExpression: "document.body.innerText.includes('第 1 轮') && document.querySelectorAll('[class*=diceRow] [class*=die]').length === 5",
  restartButtonText: "重开整场",
});

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
