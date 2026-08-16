import {
  getCompanionModeExample,
  getCompanionModeRules,
  getCompanionModeScene,
} from "../src/lib/companion/mode-prompts.ts";

const aeroplaneRules = getCompanionModeRules("aeroplane").join("\n");
const unoRules = getCompanionModeRules("uno").join("\n");
const loveLetterRules = getCompanionModeRules("love-letter").join("\n");
const liarsDiceRules = getCompanionModeRules("liars-dice").join("\n");
const werewolfRules = getCompanionModeRules("table").join("\n");

const containsAny = (text, terms) => terms.some((term) => text.includes(term));

const checks = {
  aeroplaneOwnRules: containsAny(aeroplaneRules, ["骰点", "中央捷径", "撞机"]),
  aeroplaneNoWerewolfMechanics: !containsAny(aeroplaneRules, ["警徽", "预言家", "夜间信息", "投票"]),
  unoOwnRules: containsAny(unoRules, ["UNO", "功能牌", "剩余牌数"]),
  unoNoOtherMechanics: !containsAny(unoRules, ["中央捷径", "机库", "警徽", "夜间信息"]),
  loveLetterOwnRules: containsAny(loveLetterRules, ["经典四人情书", "猜牌", "好感标记"]),
  loveLetterNoOtherMechanics: !containsAny(loveLetterRules, ["中央捷径", "机库", "警徽", "夜间信息", "UNO"]),
  liarsDiceOwnRules: containsAny(liarsDiceRules, ["隐藏骰子", "叫点", "质疑", "万能点"]),
  liarsDiceNoOtherMechanics: !containsAny(liarsDiceRules, ["中央捷径", "机库", "警徽", "夜间信息", "UNO", "手牌"]),
  werewolfOwnRules: containsAny(werewolfRules, ["狼人杀", "隐藏身份", "夜间信息", "投票"]),
  werewolfNoOtherMechanics: !containsAny(werewolfRules, ["UNO", "中央捷径", "机库"]),
  crossGameMemoryAllowed: aeroplaneRules.includes("可以回忆过去其他游戏") && unoRules.includes("可以把过去其他游戏当作共同回忆"),
  memoriesCannotChangeCurrentRules: aeroplaneRules.includes("不能用其规则、阵营、角色或行动方式解释当前飞行棋对局"),
  examplesSeparated:
    getCompanionModeExample("uno").user.includes("反转牌")
    && getCompanionModeExample("love-letter").user.includes("侍卫")
    && getCompanionModeExample("liars-dice").user.includes("质疑")
    && getCompanionModeExample("table").user.includes("怀疑")
    && !getCompanionModeExample("private").user.includes("怀疑"),
  scenesSeparated:
    getCompanionModeScene("aeroplane").includes("飞行棋")
    && getCompanionModeScene("love-letter").includes("情书")
    && getCompanionModeScene("liars-dice").includes("吹牛骰子")
    && getCompanionModeScene("table").includes("狼人杀"),
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks }, null, 2));
if (!ok) process.exitCode = 1;
