#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const MODEL = "google/gemini-3.1-flash-lite-preview";
const API_BASE_URL = "https://zenmux.ai/api/v1";
const TEMPERATURE = 0.1;
const DAY_BREAK_TEXT = "天亮了，请睁眼";
const SUMMARY_ENDPOINT = `${API_BASE_URL}/chat/completions`;

const LOCALE_CONFIGS = [
  {
    locale: "zh",
    file: path.join(ROOT_DIR, "src/i18n/messages/zh.json"),
  },
  {
    locale: "en",
    file: path.join(ROOT_DIR, "src/i18n/messages/en.json"),
  },
];

const PLAYERS = [
  { seat: 1, name: "阿岳" },
  { seat: 2, name: "苏槿" },
  { seat: 3, name: "南乔" },
  { seat: 4, name: "许棠" },
  { seat: 5, name: "墨白" },
  { seat: 6, name: "林岚" },
  { seat: 7, name: "程野" },
  { seat: 8, name: "沈雾" },
];

const SPEAKING_PLAYERS = PLAYERS.filter((player) => [1, 2, 3, 4, 5, 7, 8].includes(player.seat));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function get(obj, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value?.[key], obj);
}

function parseDotEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function interpolateUserPrompt(template, values) {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, String(value));
  }
  return output;
}

function buildTranscript() {
  return [
    DAY_BREAK_TEXT,
    "系统: 昨夜6号林岚出局（中刀），女巫没有使用解药。",
    "系统: 警长竞选开始，请想要上警的玩家依次发言。",
    "1号 阿岳: 我是预言家，昨晚查验5号墨白，结果是狼人。我建议今天先出5号。",
    "2号 苏槿: 我也跳预言家，昨晚查验3号南乔是好人。1号这一轮的查杀像悍跳。",
    "3号 南乔: 我接到2号的金水，但1号给出的信息更完整，我暂时偏向1号。",
    "4号 许棠: 我是女巫，昨晚没有开药。现在1号和2号对跳，我更想听5号怎么解释。",
    "5号 墨白: 我不是狼人，1号这张查杀太假了，我觉得2号更像真预言家。",
    "7号 程野: 我是猎人，目前站边1号，2号和5号里我更想先投5号。",
    "8号 沈雾: 我先不跳身份，但1号的逻辑比2号完整，我暂时跟1号。",
    "系统: [VOTE_RESULT]{\"title\":\"sheriff\",\"results\":[{\"targetSeat\":1,\"voterSeats\":[3,4,7,8]},{\"targetSeat\":2,\"voterSeats\":[2,5]}]}",
    "系统: 1号阿岳当选警长（4票），2号苏槿获得2票。",
    "系统: 进入自由讨论。",
    "1号 阿岳: 我今天的归票就是5号。2号如果是真预言家，不会在这个位置只报金水，不聊后续警徽流。",
    "2号 苏槿: 1号在强势带节奏，5号像被冤枉的好人。我建议大家回头看4号为什么突然跳女巫。",
    "4号 许棠: 我跳女巫是为了说明昨晚没有救人信息。2号现在转头打我，更像狼队在找新的焦点。",
    "5号 墨白: 我继续表态，我是好人。4号像在配合1号做双神压制。",
    "7号 程野: 我认可4号这段解释，今天票型应该先看1号和5号的对冲关系。",
    "8号 沈雾: 我同意先出5号，明天再看2号和4号谁的问题更大。",
    "系统: 发言结束，开始投票。",
    "系统: [VOTE_RESULT]{\"title\":\"execution\",\"results\":[{\"targetSeat\":5,\"voterSeats\":[1,3,4,7,8]},{\"targetSeat\":1,\"voterSeats\":[2,5]}]}",
    "系统: 5号墨白被放逐（5票）。",
    "5号 墨白: 你们这轮投错了，我不是狼人，2号才是真预言家。",
  ].join("\n");
}

function stripMarkdownCodeFences(text) {
  return String(text ?? "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(text) {
  const cleaned = stripMarkdownCodeFences(text);
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function normalizeResponseContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof item.text === "string") return item.text;
        return "";
      })
      .join("")
      .trim();
  }
  return String(content ?? "");
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function bulletMentionsPlayer(bullet, player) {
  const escapedName = player.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const seatPatterns = [
    new RegExp(`(?:^|\\D)${player.seat}号(?!\\d)`),
    new RegExp(`\\bSeat\\s*${player.seat}\\b`, "i"),
    new RegExp(`\\b${player.seat}\\b`),
  ];
  const namePattern = new RegExp(escapedName);
  return containsAny(bullet, [...seatPatterns, namePattern]);
}

function analyzeOutput(parsed, rawContent) {
  const bullets = Array.isArray(parsed?.bullets)
    ? parsed.bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const oldSummary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
  const combined = bullets.join("\n");

  const checks = {
    newFormat: bullets.length > 0,
    noLegacySummaryField: !oldSummary,
    bulletCount: bullets.length >= 6 && bullets.length <= 12,
    nightResult: containsAny(combined, [
      /昨夜/,
      /平安夜/,
      /中刀/,
      /peaceful night/i,
      /overnight/i,
      /no one died/i,
      /died/i,
    ]),
    sheriffResult: containsAny(combined, [
      /警长/,
      /竞选/,
      /当选/,
      /sheriff/i,
      /campaign/i,
      /won/i,
    ]),
    identityClaims: containsAny(combined, [
      /预言家/,
      /女巫/,
      /猎人/,
      /守卫/,
      /金水/,
      /查验/,
      /查杀/,
      /Seer/i,
      /Witch/i,
      /Hunter/i,
      /Guard/i,
      /checked/i,
      /claimed/i,
    ]),
    speakerViewpoints: SPEAKING_PLAYERS.every((player) => bullets.some((bullet) => bulletMentionsPlayer(bullet, player))),
    voteResult: containsAny(combined, [
      /投票/,
      /放逐/,
      /出局/,
      /得票/,
      /票/,
      /vote/i,
      /voted/i,
      /eliminated/i,
      /exiled/i,
    ]),
  };

  const speakerCoverage = SPEAKING_PLAYERS.map((player) => ({
    ...player,
    covered: bullets.some((bullet) => bulletMentionsPlayer(bullet, player)),
  }));

  const passed = Object.values(checks).every(Boolean);

  return {
    rawContent,
    bullets,
    oldSummary,
    checks,
    speakerCoverage,
    passed,
  };
}

async function callZenMux({ apiKey, systemPrompt, userPrompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(SUMMARY_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const bodyText = await response.text();
    let json;
    try {
      json = JSON.parse(bodyText);
    } catch {
      json = null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}\n${bodyText}`);
    }

    if (!json) {
      throw new Error(`ZenMux 返回了非 JSON 响应：\n${bodyText}`);
    }

    const rawContent = normalizeResponseContent(json?.choices?.[0]?.message?.content);
    return { json, rawContent };
  } finally {
    clearTimeout(timeout);
  }
}

function printDivider(label) {
  console.log(`\n${"=".repeat(24)} ${label} ${"=".repeat(24)}`);
}

function printCheck(label, passed, extra = "") {
  const status = passed ? "PASS" : "FAIL";
  const suffix = extra ? ` | ${extra}` : "";
  console.log(`- ${label}: ${status}${suffix}`);
}

function printPromptPreview(systemPrompt, userPrompt) {
  const displaySystemPrompt = systemPrompt.replace(/\\n/g, "\n");
  const displayUserPrompt = userPrompt.replace(/\\n/g, "\n");
  const systemPreview = displaySystemPrompt.split("\n").slice(0, 8).join("\n");
  const userPreview = displayUserPrompt.split("\n").slice(0, 8).join("\n");
  console.log("Prompt preview:");
  console.log("[system]");
  console.log(systemPreview);
  console.log("[user]");
  console.log(userPreview);
}

async function run() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  const env = parseDotEnvFile(envPath);
  const apiKey = env.ZENMUX_API_KEY;

  if (!apiKey) {
    throw new Error(".env.local 中没有读取到 ZENMUX_API_KEY。");
  }

  const transcript = buildTranscript();

  printDivider("Daily Summary Fix Verification");
  console.log(`Project root: ${ROOT_DIR}`);
  console.log(`Transcript starts with dayBreak: ${transcript.startsWith(DAY_BREAK_TEXT) ? "YES" : "NO"}`);
  console.log(`Transcript line count: ${transcript.split("\n").length}`);
  console.log(`Transcript char count: ${transcript.length}`);
  console.log("\nTranscript:");
  console.log(transcript);

  const results = [];

  for (const config of LOCALE_CONFIGS) {
    const messages = readJson(config.file);
    const systemPrompt = get(messages, "gameMaster.dailySummary.systemPrompt");
    const userPromptTemplate = get(messages, "gameMaster.dailySummary.userPrompt");

    if (!systemPrompt || !userPromptTemplate) {
      throw new Error(`${config.file} 缺少 gameMaster.dailySummary.systemPrompt 或 userPrompt。`);
    }

    const userPrompt = interpolateUserPrompt(userPromptTemplate, {
      day: 1,
      transcript,
    });

    printDivider(`Locale ${config.locale.toUpperCase()}`);
    console.log(`Prompt source: ${path.relative(ROOT_DIR, config.file)}`);
    console.log(`System prompt length: ${systemPrompt.length}`);
    console.log(`User prompt length: ${userPrompt.length}`);
    printPromptPreview(systemPrompt, userPrompt);
    console.log("\nCalling ZenMux...");

    const startedAt = Date.now();
    try {
      const { json, rawContent } = await callZenMux({
        apiKey,
        systemPrompt,
        userPrompt,
      });
      const durationMs = Date.now() - startedAt;

      console.log(`Completed in ${durationMs} ms`);
      console.log(`Finish reason: ${json?.choices?.[0]?.finish_reason ?? "unknown"}`);
      console.log(`Usage: ${JSON.stringify(json?.usage ?? {}, null, 2)}`);
      console.log("\nRaw model content:");
      console.log(rawContent);

      const jsonObjectText = extractFirstJsonObject(rawContent);
      let parsed = null;
      let parseError = null;

      if (jsonObjectText) {
        try {
          parsed = JSON.parse(jsonObjectText);
        } catch (error) {
          parseError = error instanceof Error ? error.message : String(error);
        }
      } else {
        parseError = "没有在模型输出中找到 JSON 对象。";
      }

      if (parsed) {
        console.log("\nParsed JSON:");
        console.log(JSON.stringify(parsed, null, 2));
      } else {
        console.log(`\nParsed JSON: FAIL | ${parseError}`);
      }

      const analysis = analyzeOutput(parsed, rawContent);
      const missingSpeakers = analysis.speakerCoverage
        .filter((item) => !item.covered)
        .map((item) => `${item.seat}号${item.name}`);

      console.log("\nValidation checks:");
      printCheck("Returned { bullets: [...] }", analysis.checks.newFormat, `bullets=${analysis.bullets.length}`);
      printCheck("Did not fall back to legacy { summary: ... }", analysis.checks.noLegacySummaryField, analysis.oldSummary ? `summary=${analysis.oldSummary}` : "");
      printCheck("Bullet count within 6-12", analysis.checks.bulletCount, `count=${analysis.bullets.length}`);
      printCheck("Covered night result", analysis.checks.nightResult);
      printCheck("Covered sheriff result", analysis.checks.sheriffResult);
      printCheck("Covered identity claims", analysis.checks.identityClaims);
      printCheck("Covered speaker viewpoints", analysis.checks.speakerViewpoints, missingSpeakers.length ? `missing=${missingSpeakers.join(", ")}` : "all speakers covered");
      printCheck("Covered vote result", analysis.checks.voteResult);

      console.log("\nSpeaker coverage:");
      for (const item of analysis.speakerCoverage) {
        console.log(`- ${item.seat}号 ${item.name}: ${item.covered ? "covered" : "missing"}`);
      }

      console.log("\nBullets:");
      for (const [index, bullet] of analysis.bullets.entries()) {
        console.log(`${index + 1}. ${bullet}`);
      }

      console.log(`\nLocale verdict: ${analysis.passed ? "PASS" : "FAIL"}`);

      results.push({
        locale: config.locale,
        passed: analysis.passed,
        bulletCount: analysis.bullets.length,
        missingSpeakers,
        hasLegacySummary: Boolean(analysis.oldSummary),
        checks: analysis.checks,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error
        ? [error.message, error.cause ? `cause: ${String(error.cause)}` : ""].filter(Boolean).join("\n")
        : String(error);
      console.log("\nLocale request failed:");
      console.log(message);
      console.log("\nLocale verdict: FAIL");

      results.push({
        locale: config.locale,
        passed: false,
        bulletCount: 0,
        missingSpeakers: [],
        hasLegacySummary: false,
        checks: null,
        error: message,
      });
    }
  }

  printDivider("Overall Summary");
  for (const result of results) {
    console.log(
      `- ${result.locale.toUpperCase()}: ${result.passed ? "PASS" : "FAIL"} | bullets=${result.bulletCount} | legacySummary=${result.hasLegacySummary ? "YES" : "NO"} | missingSpeakers=${result.missingSpeakers.length ? result.missingSpeakers.join(", ") : "none"}${result.error ? ` | error=${result.error.replace(/\s+/g, " ").slice(0, 160)}` : ""}`
    );
  }

  const hasFailure = results.some((result) => !result.passed);
  process.exitCode = hasFailure ? 1 : 0;
}

run().catch((error) => {
  console.error("\nVerification script failed.");
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
