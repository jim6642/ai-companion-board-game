// Shared regression harness for the chat/voice queue draining fix.
//
// The bug: each companion game's `page.tsx` chains AI replies onto a
// `reactionQueueRef` Promise and TTS onto a `voiceQueueRef` Promise,
// but the original code never reset those refs on `startGame` /
// `restart`. A bot turn whose /api/companion/respond reply arrives
// AFTER the player hits "重开整场" still calls addChat on the new
// match's chat feed and queues a TTS line into the new match's voice
// queue.
//
// The fix: a `matchIdRef` bumped on every (re)start, with guards in
// `requestReply` / `requestReplies` / `enqueueVoice` that bail out
// when the captured id is stale. This helper exercises the exact
// race with a CDP-level fetch stub, then asserts that the new match's
// chat feed never receives a stale reply.
//
// Usage:
//   import { runQueueDrainTest } from "./qa-queue-drain-helper.mjs";
//   await runQueueDrainTest({
//     name: "liars-dice",
//     url: "http://localhost:3001/zh/companion/liars-dice",
//     debugPort: 9358,
//     selectionMarker: "今晚想和谁互相诈唬",
//     characters: ["林夏", "苏遥", "顾清岚", "唐果"],
//     startButtonText: "和这四人开局",
//     humanTurnExpression: `
//       (() => {
//         const bid = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('确认叫点') && !node.disabled);
//         if (bid) { bid.click(); return true; }
//         return false;
//       })()
//     `,
//     freshMatchExpression: "document.body.innerText.includes('第 1 轮') && document.querySelectorAll('[class*=diceRow] [class*=die]').length === 5",
//     restartButtonText: "重开整场",
//   });
//
// Requires the production site already running on http://localhost:3001.

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

export function runQueueDrainTest(config) {
  const {
    name,
    url,
    debugPort = 9358,
    selectionMarker,
    characters,
    startButtonText,
    humanTurnExpression,
    freshMatchExpression,
    restartButtonText = "重开整场",
    restartButtonTitle = null,
    profilePrefix = `${name}-drain-qa-`,
    postActionDelayMs = 1500,
    humanTurnTimeoutMs = 8_000,
    fetchParkedTimeoutMs = 5_000,
  } = config;

  return (async () => {
    const profileDir = await mkdtemp(join(tmpdir(), profilePrefix));
    const edge = spawn(EDGE, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1600,1000",
      `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, "about:blank",
    ], { stdio: "ignore" });

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function pageTarget() {
      for (let index = 0; index < 80; index += 1) {
        try {
          const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
          const page = targets.find((target) => target.type === "page");
          if (page) return page;
        } catch {}
        await delay(200);
      }
      throw new Error(`[${name}] Edge DevTools target unavailable`);
    }

    function cdpClient(socketUrl) {
      const socket = new WebSocket(socketUrl);
      const pending = new Map();
      let id = 0;
      const ready = new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data));
        const task = pending.get(message.id);
        if (!task) return;
        pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message));
        else task.resolve(message.result);
      });
      return {
        close: () => socket.close(),
        async send(method, params = {}) {
          await ready;
          const requestId = ++id;
          const response = new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
          socket.send(JSON.stringify({ id: requestId, method, params }));
          return response;
        },
      };
    }

    const checks = {};
    let cdp;
    try {
      cdp = cdpClient((await pageTarget()).webSocketDebuggerUrl);
      await cdp.send("Runtime.enable");
      await cdp.send("Page.enable");
      const evaluate = async (expression) => {
        const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || `[${name}] evaluation failed`);
        return result.result?.value;
      };
      const waitFor = async (label, callback, timeout = 30_000) => {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
          const result = await callback();
          if (result) return result;
          await delay(60);
        }
        throw new Error(`[${name}] Timed out waiting for ${label}`);
      };
      const clickByText = (text) => evaluate(`(() => {
        const target = [...document.querySelectorAll('button')].find((node) => node.textContent.trim().includes(${JSON.stringify(text)}) && !node.disabled);
        if (!target) return false;
        target.click();
        return true;
      })()`);
      const clickByTitle = (title) => evaluate(`(() => {
        const target = [...document.querySelectorAll('button')].find((node) => node.title === ${JSON.stringify(title)} && !node.disabled);
        if (!target) return false;
        target.click();
        return true;
      })()`);
      const clickCharacter = (name) => evaluate(`(() => {
        const target = [...document.querySelectorAll('button')].find((node) => node.querySelector('strong')?.textContent.trim() === ${JSON.stringify(name)});
        if (!target || target.disabled) return false;
        target.click();
        return true;
      })()`);

      const installStub = async () => evaluate(`(() => {
        window.__parkedReplies = [];
        window.__fetchCalls = [];
        window.__releaseParked = function () {
          const pending = window.__parkedReplies.splice(0);
          for (const { resolve } of pending) {
            const text = "STALE_REPLY_FROM_OLD_MATCH";
            resolve({ ok: true, json: async () => ({ replies: [{ characterId: "lin-xia", text }] }) });
          }
        };
        const originalFetch = window.fetch.bind(window);
        window.__originalFetch = originalFetch;
        window.fetch = function (input, init) {
          const url = typeof input === "string" ? input : input.url;
          window.__fetchCalls.push(url);
          if (url && url.includes("/api/companion/respond")) {
            return new Promise((resolve) => {
              window.__parkedReplies.push({ resolve, body: init?.body });
            });
          }
          return originalFetch(input, init);
        };
        return true;
      })()`);

      await cdp.send("Page.navigate", { url });
      await waitFor("selection screen", () => evaluate(`document.body?.innerText?.includes(${JSON.stringify(selectionMarker)})`));
      await installStub();
      await delay(300);
      for (const characterName of characters) {
        if (!await clickCharacter(characterName)) throw new Error(`[${name}] Could not select ${characterName}`);
        await delay(40);
      }
      if (!await clickByText(startButtonText)) throw new Error(`[${name}] Could not start game (button: ${startButtonText})`);
      await waitFor("table ready", () => evaluate("Boolean(document.querySelector('[class*=chatEntry]')) || Boolean(document.querySelector('[class*=playerStrip]'))"));

      // Force exactly 1 fetch to be parked. A single human turn is
      // enough: the heartbeat/priority guard fires for the first
      // significant event of a match and enqueues a requestReply.
      const acted = await waitFor("first human turn actionable", () => evaluate(humanTurnExpression), humanTurnTimeoutMs);
      if (!acted) throw new Error(`[${name}] first human turn never became actionable`);
      await waitFor("first fetch parked", () => evaluate("window.__parkedReplies.length >= 1"), fetchParkedTimeoutMs);

      const parkedCount = await evaluate("window.__parkedReplies.length");
      checks.parkedBeforeRestart = parkedCount >= 1;

      const restartClicked = restartButtonTitle
        ? await clickByTitle(restartButtonTitle)
        : await clickByText(restartButtonText);
      if (!restartClicked) throw new Error(`[${name}] Could not click restart button`);
      await delay(400);
      try {
        await waitFor("fresh match after restart", () => evaluate(freshMatchExpression));
      } catch (error) {
        return { ok: false, checks, fatal: String(error?.message ?? error) };
      }

      const chatAtRestart = await evaluate("document.querySelectorAll('[class*=chatEntry], [class*=message]').length");
      checks.chatCleanAtRestart = chatAtRestart === 1;

      await evaluate("window.__releaseParked()");
      await delay(postActionDelayMs);
      const chatAfterRelease = await evaluate("document.querySelectorAll('[class*=chatEntry], [class*=message]').length");
      const staleLeaked = await evaluate(`Boolean([...document.querySelectorAll('[class*=chatEntry], [class*=message]')].some((node) => node.textContent.includes('STALE_REPLY_FROM_OLD_MATCH')))`);
      checks.noStaleLeak = !staleLeaked;
      checks.chatStayedClean = chatAfterRelease <= 2;

      return {
        ok: Object.values(checks).every(Boolean),
        checks,
        parkedCount,
        chatAtRestart,
        chatAfterRelease,
      };
    } finally {
      try { await cdp?.send("Page.navigate", { url: "about:blank" }); } catch {}
      cdp?.close();
      edge.kill();
      await delay(300);
      await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
    }
  })();
}
