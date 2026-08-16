import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DEBUG_PORT = 9338;
const profileDir = await mkdtemp(join(tmpdir(), "companion-ui-qa-"));
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
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
    message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
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
  const target = await pageTarget();
  cdp = cdpClient(target.webSocketDebuggerUrl);
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
    const target = [...document.querySelectorAll('button,a')].find((node) => node.textContent.trim().includes(${JSON.stringify(text)}));
    if (!target) return false; target.click(); return true;
  })()`);

  await cdp.send("Page.navigate", { url: "http://localhost:3001/zh/companion" });
  await waitFor("companion lobby", () => evaluate("document.body?.innerText?.includes('今晚有局')"));
  await delay(1200);
  await waitFor("settings button", () => click("设置"));
  await waitFor("settings", () => evaluate("document.body?.innerText?.includes('你的称呼')"));
  await evaluate(`(() => {
    const input = document.querySelector('input[type="text"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '测试玩家'); input.dispatchEvent(new Event('input', { bubbles: true })); return true;
  })()`);
  await click("保存到本次会话");
  await waitFor("saved player name", () => evaluate("JSON.parse(localStorage.getItem('aicb_human_name')) === '测试玩家'"));
  await click("开始游戏");
  await click("进入狼人杀");
  await waitFor("role reveal", () => evaluate("document.body?.innerText?.includes('记住身份，进入第一夜')"), 60_000);
  const firstId = await evaluate("JSON.parse(localStorage.getItem('aicb.game_state')).state.gameId");
  const firstRoles = await evaluate("JSON.parse(localStorage.getItem('aicb.game_state')).state.players.map((player) => player.role)");
  const namedPlayer = await evaluate("document.body.innerText.includes('测试玩家')");
  await click("记住身份，进入第一夜");
  await click("本局角色与备注");
  await waitFor("role composition", () => evaluate("document.body?.innerText?.includes('本局公开配置')"));
  const roleText = await evaluate("document.body.innerText");
  await click("重开");
  await waitFor("new role reveal", () => evaluate("document.body?.innerText?.includes('记住身份，进入第一夜')"), 60_000);
  const secondId = await evaluate("JSON.parse(localStorage.getItem('aicb.game_state')).state.gameId");
  console.log(JSON.stringify({
    ok: firstId !== secondId && namedPlayer
      && firstRoles.filter((role) => role === 'Villager').length === 2
      && firstRoles.filter((role) => role === 'Werewolf').length === 2
      && firstRoles.filter((role) => role === 'WhiteWolfKing').length === 1
      && !firstRoles.includes('Idiot'),
    customName: namedPlayer,
    roleHint: roleText.includes("本局公开配置") && roleText.includes("狼人"),
    restartCreatedNewGame: firstId !== secondId,
    fixedRoleDeck: firstRoles.sort(),
  }));
} finally {
  cdp?.close();
  edge.kill();
  await delay(500);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
