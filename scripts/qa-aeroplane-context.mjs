import {
  aeroplaneTextNeedsDetailedContext,
  describeAeroplaneSnapshot,
  describeDetailedAeroplaneSnapshot,
} from "../src/lib/aeroplane/context.ts";
import { CompanionAeroplaneEngine } from "../src/lib/aeroplane/engine.ts";

const engine = new CompanionAeroplaneEngine([
  { id: "human", name: "玩家", color: "red", isHuman: true },
  { id: "lin-xia", name: "林夏", color: "blue" },
  { id: "tang-guo", name: "唐果", color: "yellow" },
  { id: "chen-hang", name: "陈航", color: "green" },
]);
const snapshot = engine.snapshot();
const compact = describeAeroplaneSnapshot(snapshot);
const detailed = describeDetailedAeroplaneSnapshot(snapshot);

const checks = {
  compactHasOnlyCounts: compact.includes("到达0/4") && !compact.includes("逐架公开位置"),
  detailedHasAllTokens: detailed.includes("逐架公开位置") && ["1号机库", "2号机库", "3号机库", "4号机库"].every((text) => detailed.includes(text)),
  stateQuestionRequestsDetail: aeroplaneTextNeedsDetailedContext("现在谁领先？"),
  ordinaryChatStaysCompact: !aeroplaneTextNeedsDetailedContext("你刚才这点数也太巧了"),
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks }, null, 2));
if (!ok) process.exitCode = 1;
