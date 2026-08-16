// Regression test for the love-letter chat/voice queue draining fix.
// See ./qa-queue-drain-helper.mjs for the full bug write-up.
//
// Note: unlike liars-dice, love-letter's `publishEvents` only
// enqueues a `requestReply` on priority events (eliminate / die-lost
// / game-win). A random card play has roughly a 30-50% chance of
// triggering one. We side-step that by triggering the fetch via
// `sendChat` instead, which always enqueues a requestReply regardless
// of game state.
//
// Run:  node --experimental-strip-types scripts/qa-love-letter-queue-drain.mjs

import { runQueueDrainTest } from "./qa-queue-drain-helper.mjs";

// Type a chat message and click send. sendChat unconditionally calls
// requestReply, so the fetch stub is guaranteed to catch it.
const loveLetterHumanTurn = `(() => {
  const textarea = document.querySelector('textarea');
  if (!textarea) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setter.call(textarea, '测试一下');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  const send = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('发送') && !b.disabled);
  if (send) { send.click(); return true; }
  return false;
})()`;

const result = await runQueueDrainTest({
  name: "love-letter",
  url: "http://localhost:3001/zh/companion/love-letter",
  debugPort: 9359,
  selectionMarker: "选择三位真正参与本局的 AI 陪玩",
  characters: ["温婉", "沈棠", "陆野"],
  startButtonText: "四人到齐，拆开密函",
  humanTurnExpression: loveLetterHumanTurn,
  freshMatchExpression: "document.body.innerText.includes('新的一场已经洗好牌') || document.body.innerText.includes('新的一场开始')",
  restartButtonText: "重开整场",
  humanTurnTimeoutMs: 8_000,
});

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;


