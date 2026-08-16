import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DEBUG_PORT = 9348;
const profileDir = await mkdtemp(join(tmpdir(), "liars-dice-ui-qa-"));
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
    ["温婉", "沈棠", "凌雪", "苏念"],
    ["陆野", "程悦", "傅宁", "温婉"],
    ["沈棠", "苏念", "陆野", "傅宁"],
  ];
  const results = [];
  let midgameRestarted = false;
  let midgameCaptured = false;

  for (const [runIndex, lineup] of lineups.entries()) {
    await cdp.send("Page.navigate", { url: "http://localhost:3001/zh/companion/liars-dice" });
    await waitFor("selection screen", () => evaluate("document.body?.innerText?.includes('今晚想和谁互相诈唬')"));
    await delay(900);
    await evaluate(`(() => {
      let state = ${2500 + runIndex * 131} >>> 0;
      Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 0x100000000; };
    })()`);
    for (const [index, name] of lineup.entries()) {
      if (!await clickCharacter(name)) throw new Error(`Could not select ${name}`);
      await waitFor(`${index + 1} selected companions`, () => evaluate(`document.querySelectorAll('button[class*=characterSelected]').length === ${index + 1}`));
    }
    await clickByText("和这四人开局");
    await waitFor("dice table", () => evaluate("document.body?.innerText?.includes('你的骰盅') && document.querySelectorAll('[class*=diceRow] [class*=die]').length === 5"));

    let humanActions = 0;
    let roundsAdvanced = 0;
    const deadline = Date.now() + 210_000;
    while (Date.now() < deadline) {
      const status = await evaluate(`(() => ({
        gameOver: document.body.innerText.includes('整场结束'),
        botError: document.body.innerText.includes('机器人回合失败'),
        nextRound: [...document.querySelectorAll('button')].some((node) => !node.disabled && node.textContent.includes('开始下一轮')),
        actionPanel: Boolean(document.querySelector('[class*=actionPanel]')),
        bidCount: [...document.querySelectorAll('[class*=chatEntry]')].filter((node) => node.textContent.includes('叫了')).length,
      }))()`);
      if (status.botError) throw new Error(`bot error in lineup ${lineup.join(',')}`);
      if (status.gameOver) break;
      if (status.nextRound) {
        await clickByText("开始下一轮");
        roundsAdvanced += 1;
        await delay(25);
        continue;
      }
      if (status.actionPanel) {
        const moved = await evaluate(`(() => {
          const panel = document.querySelector('[class*=actionPanel]');
          if (!panel) return false;
          const challenge = [...panel.querySelectorAll('button')].find((node) => node.textContent.includes('不信，开盅') && !node.disabled);
          const bid = [...panel.querySelectorAll('button')].find((node) => node.textContent.includes('确认叫点') && !node.disabled);
          const currentBidVisible = document.body.innerText.includes('当前叫点');
          if (challenge && currentBidVisible) { challenge.click(); return 'challenge'; }
          if (bid) { bid.click(); return 'bid'; }
          return false;
        })()`);
        if (moved) {
          humanActions += 1;
          if (!midgameCaptured && runIndex === 0 && humanActions >= 2) {
            const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
            await writeFile(new URL("../work/liars-dice-midgame-qa.png", import.meta.url), Buffer.from(screenshot.data, "base64"));
            midgameCaptured = true;
          }
          if (!midgameRestarted && runIndex === 0 && humanActions >= 4) {
            if (!await clickByText("重开整场")) throw new Error("Could not restart midgame");
            await waitFor("fresh match after midgame restart", () => evaluate("document.body.innerText.includes('第 1 轮') && document.querySelectorAll('[class*=diceRow] [class*=die]').length === 5"));
            midgameRestarted = true;
          }
        }
        await delay(30);
        continue;
      }
      await delay(45);
    }

    const result = await evaluate(`(() => {
      const text = document.body.innerText;
      const selected = ${JSON.stringify(lineup)};
      const allNames = ['温婉','沈棠','凌雪','苏念','陆野','程悦','傅宁'];
      return {
        gameOver: text.includes('整场结束'),
        selectedVisible: selected.every((name) => text.includes(name)),
        unselectedAbsent: allNames.filter((name) => !selected.includes(name)).every((name) => !text.includes(name)),
        fiveSeats: document.querySelectorAll('[class*=playerStrip] article').length === 5,
        hasReveal: text.includes('开盅结果') || text.includes('整场结束'),
        hasAiChat: [...document.querySelectorAll('[class*=chatEntry]')].some((node) => !node.textContent.includes('开盅播报')),
        pageDoesNotScroll: document.documentElement.scrollHeight <= window.innerHeight + 2,
        winnerShown: [...document.querySelectorAll('[class*=roundOverlay]')].some((node) => node.textContent.includes('最后赢家')),
      };
    })()`);
    if (!await clickByText("再来一场")) throw new Error(`Could not restart completed match for ${lineup.join(',')}`);
    const postGameRestartWorks = await waitFor("fresh game after complete restart", () => evaluate("document.body.innerText.includes('第 1 轮') && document.querySelectorAll('[class*=diceRow] [class*=die]').length === 5"));
    const ok = Object.values(result).every(Boolean) && Boolean(postGameRestartWorks) && (runIndex !== 0 || midgameRestarted);
    results.push({ lineup, ok, humanActions, roundsAdvanced, midgameRestartWorks: runIndex === 0 ? midgameRestarted : "covered in first lineup", postGameRestartWorks: Boolean(postGameRestartWorks), ...result });
    if (!ok) throw new Error(`UI acceptance failed: ${JSON.stringify(results.at(-1))}`);
  }

  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL("../work/liars-dice-qa.png", import.meta.url), Buffer.from(screenshot.data, "base64"));
  console.log(JSON.stringify({ ok: results.every((item) => item.ok), results }, null, 2));
} finally {
  cdp?.close();
  edge.kill();
  await delay(500);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
