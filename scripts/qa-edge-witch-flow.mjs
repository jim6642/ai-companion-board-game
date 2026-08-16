import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DEBUG_PORT = 9337;
const QA_ARGS = process.argv.slice(2);
const LIVE_API = QA_ARGS.includes("--live");
const FULL_GAME = QA_ARGS.includes("--full");
const HUMAN_ROLE = QA_ARGS.find((arg) => !arg.startsWith("--")) || "Witch";
const DAY_MODE = HUMAN_ROLE === "Villager";
const ACTION_PHASE = {
  Guard: "NIGHT_GUARD_ACTION",
  Werewolf: "NIGHT_WOLF_ACTION",
  Witch: "NIGHT_WITCH_ACTION",
  Seer: "NIGHT_SEER_ACTION",
  Villager: "DAY_BADGE_SIGNUP",
}[HUMAN_ROLE];
if (!ACTION_PHASE) throw new Error(`Unsupported QA role: ${HUMAN_ROLE}`);
const GAME_URL = `http://localhost:3001/zh/companion/werewolf?qaRole=${encodeURIComponent(HUMAN_ROLE)}`;
const profileDir = await mkdtemp(join(tmpdir(), "aicb-edge-qa-"));

const edge = spawn(EDGE, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageTarget() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page");
      if (page) return page;
    } catch {}
    await delay(200);
  }
  throw new Error("Edge DevTools target did not become ready");
}

function createCdpClient(url) {
  const socket = new WebSocket(url);
  let sequence = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    ready,
    close: () => socket.close(),
    async send(method, params = {}) {
      await ready;
      const id = ++sequence;
      const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return result;
    },
  };
}

async function main() {
  const target = await getPageTarget();
  const cdp = createCdpClient(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  if (!LIVE_API) {
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
      const realFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url.includes("/api/chat")) {
          let payload = {};
          try { payload = JSON.parse(init.body || "{}"); } catch {}
          const content = payload.stream
            ? JSON.stringify(["我先听大家发言，这轮暂时保留判断。"])
            : JSON.stringify({ seat: 2 });
          if (payload.stream) {
            const event = JSON.stringify({ choices: [{ delta: { content } }] });
            return new Response("data: " + event + "\\n\\ndata: [DONE]\\n\\n", {
              status: 200,
              headers: { "Content-Type": "text/event-stream" },
            });
          }
          return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/api/tts") || url.includes("/api/companion/tts")) {
          // Fail fast so audioManager exercises its text-only fallback. A
          // successful empty audio body would leave HTMLAudioElement waiting.
          return new Response(JSON.stringify({ error: "QA_TTS_DISABLED" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
        return realFetch(input, init);
      };
      })();`,
    });
  }
  await cdp.send("Page.navigate", { url: GAME_URL });

  const evaluate = async (expression) => {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
    return result.result?.value;
  };

  const waitFor = async (label, predicate, timeoutMs = 120_000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await predicate();
      if (value) return value;
      await delay(250);
    }
    throw new Error(`Timed out waiting for ${label}`);
  };

  const readState = () => evaluate(`(() => {
    const raw = localStorage.getItem("aicb.game_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state || null;
  })()`);

  const clickButton = (text) => evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const button = [...document.querySelectorAll("button")].find((item) => item.innerText.includes(wanted));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);

  try {
    await waitFor("role reveal", async () => Boolean(await evaluate("document.body?.innerText?.includes('记住身份，进入第一夜')")), 90_000);
  } catch (error) {
    const diagnostics = await evaluate(`({
      url: location.href,
      title: document.title,
      body: document.body.innerText.slice(0, 1200),
      storage: localStorage.getItem("aicb.game_state")?.slice(0, 500) || null,
    })`);
    throw new Error(`${error.message}\n${JSON.stringify(diagnostics)}`);
  }
  const initial = await readState();
  if (initial.players.find((player) => player.isHuman)?.role !== HUMAN_ROLE) {
    throw new Error(`qaRole=${HUMAN_ROLE} did not assign the requested human role`);
  }
  await clickButton("记住身份，进入第一夜");

  await waitFor(`human ${HUMAN_ROLE} checkpoint`, async () => (await readState())?.phase === ACTION_PHASE, 150_000);
  const beforeIdle = await readState();
  await delay(7_000);
  const afterIdle = await readState();
  if (afterIdle.phase !== ACTION_PHASE) {
    throw new Error(`${HUMAN_ROLE} checkpoint moved without input: ${afterIdle.phase}`);
  }
  if (afterIdle.messages.length !== beforeIdle.messages.length) {
    throw new Error(`${HUMAN_ROLE} checkpoint appended messages while idle`);
  }

  await cdp.send("Page.reload", { ignoreCache: true });
  await waitFor(`restored ${HUMAN_ROLE} checkpoint`, async () => (await readState())?.phase === ACTION_PHASE, 30_000);
  await delay(4_000);
  const restored = await readState();
  if (restored.phase !== ACTION_PHASE) {
    throw new Error(`Refresh replayed earlier night phases: ${restored.phase}`);
  }

  if (DAY_MODE) {
    await waitFor("decline badge signup", () => clickButton("不上警"), 20_000);
  } else if (HUMAN_ROLE === "Witch") {
    await waitFor("witch pass button", () => clickButton("本晚不用药"), 20_000);
    // Deliberately issue a second click in the same interaction window.
    await clickButton("本晚不用药");
  } else {
    await waitFor("selectable night target", () => evaluate(`(() => {
      const table = document.querySelector('section[aria-label="狼人杀牌桌"]');
      const seat = table && [...table.querySelectorAll("button")].find((button) => !button.disabled);
      if (!seat) return false;
      seat.click();
      return true;
    })()`), 20_000);
    await waitFor("confirm night target", () => clickButton("确认目标"), 10_000);
    await clickButton("确认目标");
    if (HUMAN_ROLE === "Seer") {
      await waitFor("seer result", async () => (await readState())?.nightActions?.seerTarget !== undefined, 20_000);
      await waitFor("continue after seer result", () => clickButton("记住结果，继续夜晚"), 20_000);
    }
  }

  try {
    await waitFor("night continuation", async () => (await readState())?.phase !== ACTION_PHASE, 60_000);
  } catch (error) {
    const stalledState = await readState();
    const pageText = await evaluate("document.body.innerText.slice(-1600)");
    throw new Error(`${error.message}\nstate=${JSON.stringify({
      phase: stalledState?.phase,
      signup: stalledState?.badge?.signup,
      candidates: stalledState?.badge?.candidates,
    })}\n${pageText}`);
  }
  let continued = await readState();

  const visitedPhases = new Set([continued.phase]);
  if (DAY_MODE) {
    let refreshedDayVote = false;
    let mentionVerified = false;
    const deadline = Date.now() + (FULL_GAME ? 600_000 : 150_000);
    while (Date.now() < deadline) {
      const state = await readState();
      if (!state) {
        const pageText = await evaluate("document.body.innerText");
        if (pageText.includes("阵营获胜")) {
          continued = { ...continued, phase: "GAME_END" };
          visitedPhases.add("GAME_END");
          break;
        }
        throw new Error(`Persisted state disappeared before game end:\n${pageText.slice(-1200)}`);
      }
      continued = state;
      visitedPhases.add(state.phase);
      if (state.phase === "GAME_END" || (!FULL_GAME && state.day >= 2 && state.phase === "NIGHT_START")) {
        continued = state;
        break;
      }

      if (state.phase === "DAY_VOTE" && !refreshedDayVote) {
        await cdp.send("Page.reload", { ignoreCache: true });
        await waitFor("restored day vote checkpoint", async () => (await readState())?.phase === "DAY_VOTE", 30_000);
        await delay(2_000);
        const restoredVote = await readState();
        if (restoredVote?.phase !== "DAY_VOTE") {
          throw new Error(`Refresh replayed day speeches instead of restoring the vote: ${restoredVote?.phase}`);
        }
        refreshedDayVote = true;
        continue;
      }

      if (state.phase === "DAY_BADGE_ELECTION" || state.phase === "DAY_VOTE") {
        await evaluate(`(() => {
          const table = document.querySelector('section[aria-label="狼人杀牌桌"]');
          const seat = table && [...table.querySelectorAll("button")].find((button) => !button.disabled);
          if (seat) seat.click();
        })()`);
        await clickButton("确认投票");
      } else if (["DAY_BADGE_SPEECH", "DAY_PK_SPEECH", "DAY_SPEECH", "DAY_LAST_WORDS"].includes(state.phase)) {
        if (!mentionVerified) {
          const mentionTarget = state.players.find((player) => !player.isHuman)?.displayName;
          if (mentionTarget) {
            mentionVerified = Boolean(await evaluate(`(() => {
              const table = document.querySelector('section[aria-label="狼人杀牌桌"]');
              const seat = table && [...table.querySelectorAll('button')].find((button) => button.textContent.includes(${JSON.stringify(mentionTarget)}) && !button.disabled);
              const textarea = document.querySelector('textarea[placeholder^="说点什么"]');
              if (!seat || !textarea) return false;
              seat.click();
              return textarea.value.includes(${JSON.stringify(mentionTarget)});
            })()`));
          }
        }
        await clickButton("说完了");
      }

      await clickButton("跳过等待");
      await delay(250);
    }
    if (continued.phase !== "GAME_END" && (FULL_GAME || !(continued.day >= 2 && continued.phase === "NIGHT_START"))) {
      const pageText = await evaluate("document.body.innerText.slice(-1200)");
      throw new Error(`Day autoplay did not reach ${FULL_GAME ? "game end" : "the next night"}: ${continued.phase}, day ${continued.day}, speaker ${continued.currentSpeakerSeat}\n${pageText}`);
    }
    if (!refreshedDayVote && continued.phase !== "GAME_END") {
      throw new Error("Day autoplay reached the next night without exercising DAY_VOTE refresh recovery");
    }
    if (!mentionVerified) throw new Error("Player-card mention did not populate the speech textarea");
  }
  const duplicateAnnouncements = [
    "NIGHT_GUARD_ACTION",
    "NIGHT_WOLF_ACTION",
    "NIGHT_WITCH_ACTION",
    "NIGHT_SEER_ACTION",
  ].filter((phase) => continued.messages.filter((message) => message.isSystem && message.day === 1 && message.phase === phase).length > 1);
  if (duplicateAnnouncements.length > 0) {
    throw new Error(`Duplicate night announcements: ${duplicateAnnouncements.join(", ")}`);
  }
  if (HUMAN_ROLE === "Witch" && continued.nightActions.witchSave !== false) {
    throw new Error("Witch pass was not persisted as an explicit decision");
  }

  let roleRevealCardVerified;
  if (continued.phase === "GAME_END") {
    roleRevealCardVerified = await evaluate(`(() => {
      const text = document.body.innerText;
      return text.includes("\u8EAB\u4EFD\u63ED\u6653") && !text.includes("[ROLE_REVEAL]") && !text.includes("modelRef");
    })()`);
    if (!roleRevealCardVerified) throw new Error("Role reveal protocol was not rendered as a safe result card");
  }

  console.log(JSON.stringify({
    ok: true,
    apiMode: LIVE_API ? "live" : "mock",
    humanRole: HUMAN_ROLE,
    idleCheckpoint: afterIdle.phase,
    restoredCheckpoint: restored.phase,
    continuedPhase: continued.phase,
    duplicateAnnouncements,
    roleRevealCardVerified,
    mentionVerified: DAY_MODE ? true : undefined,
    visitedPhases: [...visitedPhases],
  }));
  cdp.close();
}

try {
  await main();
} finally {
  edge.kill();
  await Promise.race([
    new Promise((resolve) => edge.once("exit", resolve)),
    delay(3_000),
  ]);
  await rm(profileDir, { recursive: true, force: true }).catch(() => {});
}
