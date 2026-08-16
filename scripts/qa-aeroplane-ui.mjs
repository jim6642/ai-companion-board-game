import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DEBUG_PORT = 9341;
const profileDir = await mkdtemp(join(tmpdir(), "aeroplane-ui-qa-"));
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1600,1000",
  `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDir}`, "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let index = 0; index < 60; index += 1) {
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
  const waitFor = async (label, callback, timeout = 30_000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const result = await callback();
      if (result) return result;
      await delay(250);
    }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const click = (text) => evaluate(`(() => {
    const target = [...document.querySelectorAll('button')].find((node) => node.textContent.trim().includes(${JSON.stringify(text)}));
    if (!target) return false;
    target.click();
    return true;
  })()`);
  const clickCharacter = (name) => evaluate(`(() => {
    const target = [...document.querySelectorAll('button')].find((node) => node.querySelector('strong')?.textContent.trim() === ${JSON.stringify(name)});
    if (!target || target.disabled) return false;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  })()`);

  await cdp.send("Page.navigate", { url: "http://localhost:3001/zh/companion/aeroplane" });
  await waitFor("AI selection screen", () => evaluate("document.body?.innerText?.includes('今晚想和谁一起飞')"));
  await delay(1500);
  await evaluate("Math.random = () => 0");
  for (const [index, name] of ["林夏", "唐果", "陈航"].entries()) {
    if (!await clickCharacter(name)) throw new Error(`Could not select ${name}`);
    await waitFor(`${index + 1} selected companions`, () => evaluate(`document.querySelectorAll('button[class*=characterSelected]').length === ${index + 1}`));
  }
  await waitFor("three selected companions", () => evaluate("document.body?.innerText?.includes('3 / 3')"));
  await click("四人到齐，开始游戏");
  await waitFor("flight board", () => evaluate("document.body?.innerText?.includes('航线聊天') && document.querySelectorAll('[class*=trackCell]').length === 52"));

  await waitFor("human dice button", () => evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('点击掷骰'));
    return button && !button.disabled;
  })()`));
  await click("点击掷骰");
  await delay(500);
  await waitFor("public roll event", () => evaluate("document.body?.innerText?.includes('掷出了')"));

  const result = await evaluate(`(() => {
    const text = document.body.innerText;
    const baseNodes = [...document.querySelectorAll('[class*=baseZone]')];
    const bases = baseNodes.map((node) => node.getBoundingClientRect());
    const track = [...document.querySelectorAll('[class*=trackCell]')].map((node) => node.getBoundingClientRect());
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      trackCells: document.querySelectorAll('[class*=trackCell]').length,
      shortcutPaths: document.querySelectorAll('path[class*=shortcutPath]').length,
      shortcutEntries: document.querySelectorAll('[class*=shortcutEntry]').length,
      shortcutExits: document.querySelectorAll('[class*=shortcutExit]').length,
      shortcutColoursMatch: [...document.querySelectorAll('[data-route-color]')].length === 8
        && [...document.querySelectorAll('[data-route-color]')].every((node) => {
          const route = node.getAttribute('data-route-color');
          const labels = { red: '红', blue: '蓝', yellow: '黄', green: '绿' };
          return node.textContent.includes(labels[route]) && node.style.getPropertyValue('--cell-color');
        }),
      shortcutRuleVisible: text.includes('正好停在入口') && text.includes('自动 +12') && text.includes('沿同色箭头飞到'),
      chosenPlayersVisible: ['林夏', '唐果', '陈航'].every((name) => text.includes(name)),
      unchosenPlayerAbsent: !text.includes('苏遥'),
      publicEventVisible: text.includes('掷出了'),
      chatComposerVisible: Boolean(document.querySelector('textarea[placeholder^="和本局的三位陪玩聊两句"]')),
      noHangarTrackOverlap: !bases.some((base) => track.some((cell) => overlaps(base, cell))),
      hangarsPainted: baseNodes.every((node) => {
        const rect = node.getBoundingClientRect();
        return document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2).includes(node);
      }),
      skippedRollFeedbackVisible: text.includes('掷出 1 点') && text.includes('没有能走的飞机，本轮跳过') && document.querySelector('[data-feedback="true"]')?.textContent.includes('1'),
    };
  })()`);
  const ok = result.trackCells === 52 && result.shortcutPaths === 4 && result.shortcutEntries === 4 && result.shortcutExits === 4 && result.shortcutColoursMatch && result.shortcutRuleVisible && result.chosenPlayersVisible && result.unchosenPlayerAbsent && result.publicEventVisible && result.chatComposerVisible && result.noHangarTrackOverlap && result.hangarsPainted && result.skippedRollFeedbackVisible;
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL("../work/aeroplane-qa.png", import.meta.url), Buffer.from(screenshot.data, "base64"));
  await waitFor("AI skipped turn", () => evaluate("document.body?.innerText?.includes('林夏掷出了1点')"));
  result.aiPassDidNotPause = await evaluate("!document.querySelector('[data-feedback=\"true\"]')");
  const finalOk = ok && result.aiPassDidNotPause;
  console.log(JSON.stringify({ ok: finalOk, ...result }));
  if (!finalOk) process.exitCode = 1;
} finally {
  cdp?.close();
  edge.kill();
  await delay(500);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
