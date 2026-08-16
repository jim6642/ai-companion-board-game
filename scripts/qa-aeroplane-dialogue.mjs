import {
  chooseAeroplaneChatIntent,
  chooseAeroplaneEventIntent,
  createAeroplaneRelationshipMemories,
  describeAeroplaneRelationshipMemory,
  getAeroplaneDialogueProfile,
  pickAeroplaneExamples,
  rememberAeroplaneEvents,
} from "../src/lib/companion/aeroplane-dialogue.ts";

const characterIds = ["lin-xia", "su-yao", "gu-qinglan", "tang-guo", "chen-hang", "xiao-man", "shen-ning"];
const memories = createAeroplaneRelationshipMemories(characterIds);

const captureEvent = {
  id: "capture-test",
  kind: "capture",
  actorId: "human",
  actorName: "玩家",
  text: "玩家把苏念的1号飞机撞回了机库。",
  targetIds: ["tang-guo"],
  significant: true,
};

rememberAeroplaneEvents(memories, [captureEvent], "human");

const checks = {
  everyCharacterHasMatchingExamples: characterIds.every((id) => {
    const examples = pickAeroplaneExamples(id, "quick-reaction", "普通移动");
    return examples.length > 0 && examples.length <= 3 && examples.every((example) => example.intents.includes("quick-reaction"));
  }),
  unverifiedStandingExamplesExcluded: characterIds.every((id) => (
    pickAeroplaneExamples(id, "quick-reaction", "普通移动").every((example) => example.situation !== "玩家领先" && example.situation !== "玩家落后")
  )),
  verifiedStandingExampleAllowed: pickAeroplaneExamples("lin-xia", "quick-reaction", "核实标签：玩家领先").some((example) => example.situation === "玩家领先"),
  everyCharacterHasDistinctProfile: characterIds.every((id) => getAeroplaneDialogueProfile(id).privateAttitude.length > 12),
  captureCreatesCallback: memories["tang-guo"].callbacks[0] === captureEvent.text,
  captureRaisesWarmth: memories["tang-guo"].warmth === 3,
  captureRaisesRivalry: memories["tang-guo"].rivalry === 3,
  capturedCrushComplains: chooseAeroplaneEventIntent("tang-guo", captureEvent, "human") === "affectionate-complaint",
  directQuestionGetsAnswered: chooseAeroplaneChatIntent("lin-xia", "你是不是故意撞我？") === "answer-player",
  memoryPromptContainsCallback: describeAeroplaneRelationshipMemory(memories["tang-guo"]).includes(captureEvent.text),
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks }, null, 2));
if (!ok) process.exitCode = 1;
