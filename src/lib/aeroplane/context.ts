import type { AeroplaneSnapshot, AeroplaneTokenView } from "@/lib/aeroplane/engine";

const DETAILED_CONTEXT_PATTERN = /谁.*(?:领先|落后)|(?:领先|落后|局势|排名|位置|哪架|终点|还差|危险|能不能撞|会不会撞|中央航线|捷径|怎么走)/;

function tokenProgressValue(token: AeroplaneTokenView) {
  return token.progress < 0 ? 0 : token.progress;
}

function describeToken(token: AeroplaneTokenView) {
  if (token.status === "hangar") return `${token.number}号机库`;
  if (token.status === "finished") return `${token.number}号已到达`;
  if (token.status === "home-lane") return `${token.number}号终点航道${token.progress - 50}/5`;
  return `${token.number}号外环进度${token.progress}/50`;
}

function standingLabel(snapshot: AeroplaneSnapshot) {
  const scores = snapshot.players.map((player) => ({
    id: player.id,
    finished: player.finishedCount,
    progress: player.tokens.reduce((total, token) => total + tokenProgressValue(token), 0),
  }));
  const ordered = [...scores].sort((left, right) => right.finished - left.finished || right.progress - left.progress);
  const human = scores.find((score) => snapshot.players.find((player) => player.id === score.id)?.isHuman);
  if (!human || ordered.length === 0) return "";
  const sameScore = (left: typeof human, right: typeof human) => left.finished === right.finished && left.progress === right.progress;
  if (sameScore(human, ordered[0])) {
    return ordered.filter((score) => sameScore(score, ordered[0])).length === 1 ? "玩家领先" : "玩家并列领先";
  }
  const last = ordered[ordered.length - 1];
  if (sameScore(human, last)) {
    return ordered.filter((score) => sameScore(score, last)).length === 1 ? "玩家落后" : "玩家并列落后";
  }
  return "玩家位于中间";
}

export function describeAeroplaneSnapshot(snapshot: AeroplaneSnapshot) {
  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const standings = snapshot.players.map((player) => {
    const hangar = player.tokens.filter((token) => token.status === "hangar").length;
    return `${player.name}：到达${player.finishedCount}/4，场上${player.airborneCount}架，机库${hangar}架`;
  }).join("；");
  return `第${snapshot.turn}回合，当前轮到${current?.name ?? "未知玩家"}${snapshot.dice ? `，骰点${snapshot.dice}` : ""}。${standings}。`;
}

export function describeDetailedAeroplaneSnapshot(snapshot: AeroplaneSnapshot) {
  const tokens = snapshot.players
    .map((player) => `${player.name}：${player.tokens.map(describeToken).join("、")}`)
    .join("；");
  return `${describeAeroplaneSnapshot(snapshot)}\n核实标签：${standingLabel(snapshot)}。\n逐架公开位置：${tokens}。`;
}

export function aeroplaneTextNeedsDetailedContext(text: string) {
  return DETAILED_CONTEXT_PATTERN.test(text);
}

