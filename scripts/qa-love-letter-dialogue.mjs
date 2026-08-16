import {
  chooseLoveLetterChatIntent,
  chooseLoveLetterEventIntent,
  createLoveLetterRelationshipMemories,
  describeLoveLetterSpeech,
  rememberLoveLetterEvents,
  rememberLoveLetterPlayerLine,
} from "../src/lib/companion/love-letter-dialogue.ts";
import { getCompanionModeRules } from "../src/lib/companion/mode-prompts.ts";
import { describeLoveLetterSnapshot } from "../src/lib/love-letter/context.ts";
import { CompanionLoveLetterEngine } from "../src/lib/love-letter/engine.ts";

const romanticIds = ["lin-xia", "su-yao", "gu-qinglan", "tang-guo"];
const familyIds = ["chen-hang", "xiao-man", "shen-ning"];
const allIds = [...romanticIds, ...familyIds];
const memories = createLoveLetterRelationshipMemories(allIds);
const directEvent = {
  id: "direct-test",
  kind: "eliminate",
  actorId: "human",
  actorName: "玩家",
  text: "玩家用卫兵猜中了唐果的手牌，唐果本轮出局。",
  targetIds: ["tang-guo"],
  significant: true,
};

rememberLoveLetterEvents(memories, [directEvent], "human");
rememberLoveLetterPlayerLine(memories, ["lin-xia"], "刚才那张侍女是专门保护你的");

const engine = new CompanionLoveLetterEngine([
  { id: "human", name: "玩家", isHuman: true },
  { id: "lin-xia", name: "林夏", isHuman: false },
  { id: "su-yao", name: "苏遥", isHuman: false },
  { id: "tang-guo", name: "唐果", isHuman: false },
], () => 0.37);
const publicContext = describeLoveLetterSnapshot(engine.snapshot());
const loveLetterRules = getCompanionModeRules("love-letter").join("\n");

const checks = {
  everyCharacterHasCue: allIds.every((id) => describeLoveLetterSpeech(id, "quick-reaction", memories[id]).includes("人物在本游戏里的表现")),
  romanticCharactersShowAffection: romanticIds.every((id) => /喜欢|暗恋|偏心|吃醋|在意/.test(describeLoveLetterSpeech(id, "flirty-complaint", memories[id]))),
  familyAndBrotherForbidRomance: familyIds.every((id) => /绝不暧昧|严禁暧昧/.test(describeLoveLetterSpeech(id, "quick-reaction", memories[id]))),
  directEventCreatesCallback: memories["tang-guo"].callbacks[0] === directEvent.text,
  directEventRaisesRelationship: memories["tang-guo"].warmth === 3 && memories["tang-guo"].rivalry === 2,
  playerLineCreatesSpecificMemory: memories["lin-xia"].callbacks[0].includes("侍女是专门保护你的"),
  eliminatedCrushComplains: chooseLoveLetterEventIntent("tang-guo", directEvent, "human") === "flirty-complaint",
  directQuestionGetsAnswered: chooseLoveLetterChatIntent("lin-xia", "你刚才为什么保护我？") === "answer-player",
  publicContextHasOnlyTableFacts: publicContext.includes("公开弃牌") && !/手牌|已知牌|猜测/.test(publicContext),
  promptForbidsHiddenCardFabrication: /不编造任何人的手牌/.test(loveLetterRules),
  promptKeepsGameSpecificRules: /经典四人情书/.test(loveLetterRules) && !/狼人杀|飞行棋|UNO/.test(loveLetterRules),
  promptCapsLength: /不超过70个中文字符/.test(loveLetterRules),
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks, publicContext }, null, 2));
if (!ok) process.exitCode = 1;
