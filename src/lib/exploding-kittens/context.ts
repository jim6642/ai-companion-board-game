import type { EKSnapshot } from "./engine";

export function describeEKSnapshot(snapshot: EKSnapshot) {
  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const table = snapshot.players.map((player) => {
    const state = player.alive ? (player.isCurrent ? "正在行动" : "仍在本局") : "已出局";
    return `${player.name}：${player.handCount}张手牌，${state}`;
  }).join("；");
  const discard = snapshot.discardPile.length > 0
    ? `最近弃牌：${snapshot.discardPile.slice(-6).map((c) => `${c.symbol}${c.name}`).join("、")}`
    : "弃牌堆暂无";
  return [
    `第${snapshot.turn}个行动，${snapshot.phase === "play" ? `轮到${current?.name ?? "未知"}` : "整局已结束"}。`,
    `牌堆剩 ${snapshot.deckCount} 张。${snapshot.attackCarry > 1 ? `当前为攻击连环，下家需连玩 ${snapshot.attackCarry} 回合。` : ""}`,
    `${table}。`,
    discard + "。",
    snapshot.humanPeek && snapshot.humanPeek.length > 0
      ? `你最近一次预见未来看到的顶部 3 张是：${snapshot.humanPeek.map((c) => `${c.symbol}${c.name}`).join("、")}。`
      : "",
  ].filter(Boolean).join(" ");
}
