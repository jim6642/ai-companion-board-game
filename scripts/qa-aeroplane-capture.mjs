import {
  AEROPLANE_SHORTCUT_ROUTES,
  CompanionAeroplaneEngine,
  aeroplaneTrackCellColor,
} from "../src/lib/aeroplane/engine.ts";

const specs = [
  { id: "human", name: "玩家", color: "red", isHuman: true },
  { id: "ai-blue", name: "蓝方AI", color: "blue" },
  { id: "ai-yellow", name: "黄方AI", color: "yellow" },
  { id: "ai-green", name: "绿方AI", color: "green" },
];

function runScenario({ name, actorIndex = 0, actorProgress, dice, opponents, expectedActorProgress, expectedJumpType }) {
  const engine = new CompanionAeroplaneEngine(specs, () => 0);
  engine.currentPlayerIndex = actorIndex;
  engine.phase = "move";
  engine.dice = dice;
  engine.tokens.forEach((token) => { token.progress = -1; });

  const actorId = specs[actorIndex].id;
  const actorToken = engine.tokens.find((token) => token.playerId === actorId);
  actorToken.progress = actorProgress;
  opponents.forEach(({ tokenId, progress }) => {
    engine.tokens.find((token) => token.id === tokenId).progress = progress;
  });

  const events = engine.moveCurrentToken(actorToken.id);
  const captured = opponents.every(({ tokenId }) => engine.tokens.find((token) => token.id === tokenId).progress === -1);
  const captureEvent = events.find((event) => event.kind === "capture");
  const jumpEvent = events.find((event) => event.kind === "jump");
  const ok = captured && actorToken.progress === expectedActorProgress && Boolean(captureEvent) && (!expectedJumpType || jumpEvent?.jumpType === expectedJumpType);
  return { name, ok, actorProgress: actorToken.progress, capturedCount: captureEvent?.targetIds.length ?? 0, jumpType: jumpEvent?.jumpType ?? null };
}

const results = [
  runScenario({
    name: "ordinary public landing",
    actorProgress: 1,
    dice: 1,
    opponents: [{ tokenId: "ai-blue-plane-1", progress: 41 }],
    expectedActorProgress: 2,
  }),
  runScenario({
    name: "opponent start cell",
    actorProgress: 12,
    dice: 1,
    opponents: [{ tokenId: "ai-blue-plane-1", progress: 0 }],
    expectedActorProgress: 13,
  }),
  runScenario({
    name: "launch onto occupied start",
    actorProgress: -1,
    dice: 6,
    opponents: [{ tokenId: "ai-blue-plane-1", progress: 39 }],
    expectedActorProgress: 0,
  }),
  runScenario({
    name: "colour jump origin and destination",
    actorProgress: 3,
    dice: 1,
    opponents: [
      { tokenId: "ai-blue-plane-1", progress: 43 },
      { tokenId: "ai-blue-plane-2", progress: 47 },
    ],
    expectedActorProgress: 8,
  }),
  runScenario({
    name: "shortcut origin and destination",
    actorProgress: 17,
    dice: 1,
    opponents: [
      { tokenId: "ai-blue-plane-1", progress: 5 },
      { tokenId: "ai-blue-plane-2", progress: 17 },
    ],
    expectedActorProgress: 30,
    expectedJumpType: "shortcut",
  }),
  runScenario({
    name: "AI captures human symmetrically",
    actorIndex: 1,
    actorProgress: 40,
    dice: 1,
    opponents: [{ tokenId: "human-plane-1", progress: 2 }],
    expectedActorProgress: 41,
  }),
];

const shortcutColours = AEROPLANE_SHORTCUT_ROUTES.map((route) => ({
  color: route.color,
  entryTrackIndex: route.entryTrackIndex,
  exitTrackIndex: route.exitTrackIndex,
  entryColour: aeroplaneTrackCellColor(route.entryTrackIndex),
  exitColour: aeroplaneTrackCellColor(route.exitTrackIndex),
  ok: aeroplaneTrackCellColor(route.entryTrackIndex) === route.color
    && aeroplaneTrackCellColor(route.exitTrackIndex) === route.color,
}));

const ok = results.every((result) => result.ok) && shortcutColours.every((result) => result.ok);
console.log(JSON.stringify({ ok, results, shortcutColours }, null, 2));
if (!ok) process.exitCode = 1;
