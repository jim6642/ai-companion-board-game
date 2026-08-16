import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DEBUG_PORT = 9347;
const profileDir = await mkdtemp(join(tmpdir(), "love-letter-ui-qa-"));
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1600,1000",
  `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDir}`, "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let index = 0; index < 80; index += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === "page");
      if (page) return page;
    } catch {}
    await delay(200);
  }
  throw new Error("Edge DevTools target unavailable");
}

function cdpClient(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();
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

let cdp;
try {
  cdp = cdpClient((await pageTarget()).webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  const evaluate = async (expression) => {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "evaluation failed");
    return result.result?.value;
  };
  const waitFor = async (label, callback, timeout = 45_000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const result = await callback();
      if (result) return result;
      await delay(60);
    }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const clickByText = (text) => evaluate(`(() => {
    const target = [...document.querySelectorAll('button')].find((node) => node.textContent.trim().includes(${JSON.stringify(text)}) && !node.disabled);
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

  const lineups = [
    ["温婉", "沈棠", "苏念"],
    ["凌雪", "陆野", "程悦"],
    ["傅宁", "温婉", "陆野"],
  ];
  const results = [];
  let midgameCaptured = false;
  let midgameRestarted = false;

  for (const [runIndex, lineup] of lineups.entries()) {
    await cdp.send("Page.navigate", { url: "http://localhost:3001/zh/companion/love-letter" });
    await waitFor("selection screen", () => evaluate("document.body?.innerText?.includes('今晚把密函交给谁')"));
    // The heading can arrive in server-rendered HTML before React has attached click handlers.
    await delay(900);
    await evaluate(`(() => {
      let state = ${1000 + runIndex * 97} >>> 0;
      Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 0x100000000; };
    })()`);
    for (const [selectionIndex, name] of lineup.entries()) {
      if (!await clickCharacter(name)) throw new Error(`Could not select ${name}`);
      await waitFor(`${selectionIndex + 1} selected companions`, () => evaluate(`document.querySelectorAll('button[class*=characterSelected]').length === ${selectionIndex + 1}`));
    }
    await waitFor("three selected companions", () => evaluate("document.body?.innerText?.includes('3 / 3')"));
    await clickByText("四人到齐，拆开密函");
    await waitFor("playable hand", () => evaluate("document.body?.innerText?.includes('你的手牌') && document.querySelectorAll('button[class*=cardPlayable]').length > 0"));

    let humanActions = 0;
    let roundsAdvanced = 0;
    const deadline = Date.now() + 150_000;
    while (Date.now() < deadline) {
      const status = await evaluate(`(() => ({
        gameOver: document.body.innerText.includes('整场结束'),
        botError: document.body.innerText.includes('机器人回合失败'),
        nextRound: [...document.querySelectorAll('button')].some((node) => !node.disabled && node.textContent.includes('开始下一轮')),
        playable: document.querySelectorAll('button[class*=cardPlayable]:not(:disabled)').length,
        actionPanel: Boolean(document.querySelector('[class*=actionPanel]')),
      }))()`);
      if (status.botError) throw new Error(`bot error in lineup ${lineup.join(',')}`);
      if (status.gameOver) break;
      if (status.nextRound) {
        await clickByText("开始下一轮");
        roundsAdvanced += 1;
        await delay(30);
        continue;
      }
      if (status.playable > 0 && !status.actionPanel) {
        await evaluate("document.querySelector('button[class*=cardPlayable]:not(:disabled)')?.click()");
        await delay(15);
        continue;
      }
      if (status.actionPanel) {
        const progressed = await evaluate(`(() => {
          const panel = document.querySelector('[class*=actionPanel]');
          if (!panel) return false;
          const rows = [...panel.querySelectorAll('[class*=choiceRow]')];
          for (const row of rows) {
            if (!row.querySelector('button[class*=choiceSelected]')) {
              const option = row.querySelector('button:not(:disabled)');
              if (option) { option.click(); return true; }
            }
          }
          const confirm = [...panel.querySelectorAll('button')].find((node) => node.textContent.includes('确认打出') && !node.disabled);
          if (confirm) { confirm.click(); return 'played'; }
          return false;
        })()`);
        if (progressed === "played") {
          humanActions += 1;
          if (!midgameCaptured && runIndex === 0 && humanActions >= 2) {
            const midgame = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
            await writeFile(new URL("../work/love-letter-midgame-qa.png", import.meta.url), Buffer.from(midgame.data, "base64"));
            midgameCaptured = true;
          }
          if (!midgameRestarted && runIndex === 0 && humanActions >= 3) {
            if (!await clickByText("重开整场")) throw new Error("Could not restart a match midgame");
            await waitFor("fresh playable hand after midgame restart", () => evaluate("document.body?.innerText?.includes('第 1 轮') && document.querySelectorAll('button[class*=cardPlayable]').length > 0"));
            midgameRestarted = true;
          }
        }
        await delay(20);
        continue;
      }
      await delay(35);
    }

    const result = await evaluate(`(() => {
      const text = document.body.innerText;
      const selected = ${JSON.stringify(lineup)};
      const allNames = ['温婉','沈棠','凌雪','苏念','陆野','程悦','傅宁'];
      const chatEntries = [...document.querySelectorAll('[class*=chatEntry]')];
      return {
        gameOver: text.includes('整场结束'),
        selectedVisible: selected.every((name) => text.includes(name)),
        unselectedAbsent: allNames.filter((name) => !selected.includes(name)).every((name) => !text.includes(name)),
        fourSeats: document.querySelectorAll('[class*=playerSeat]').length === 4,
        chatWorked: chatEntries.some((entry) => !entry.textContent.includes('密函播报')),
        hasRoundEvents: text.includes('好感标记'),
        pageDoesNotScroll: document.documentElement.scrollHeight <= window.innerHeight + 2,
        gameWinnerText: [...document.querySelectorAll('[class*=roundOverlay]')].some((node) => node.textContent.includes('集齐四枚好感标记')),
      };
    })()`);
    if (!await clickByText("再来一场")) throw new Error(`Could not restart completed match for ${lineup.join(',')}`);
    const postGameRestartWorks = await waitFor("fresh match after game-over restart", () => evaluate("document.body?.innerText?.includes('第 1 轮') && document.querySelectorAll('button[class*=cardPlayable]').length > 0"));
    const ok = Object.values(result).every(Boolean) && Boolean(postGameRestartWorks) && (runIndex !== 0 || midgameRestarted);
    results.push({ lineup, ok, humanActions, roundsAdvanced, midgameRestartWorks: runIndex === 0 ? midgameRestarted : "covered in first lineup", postGameRestartWorks: Boolean(postGameRestartWorks), ...result });
    if (!ok) throw new Error(`UI acceptance failed: ${JSON.stringify(results.at(-1))}`);
  }

  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL("../work/love-letter-qa.png", import.meta.url), Buffer.from(screenshot.data, "base64"));
  console.log(JSON.stringify({ ok: results.every((item) => item.ok), results }, null, 2));
} finally {
  cdp?.close();
  edge.kill();
  await delay(500);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
