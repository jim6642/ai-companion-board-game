import type { LoveLetterSnapshot } from "./engine";

export function describeLoveLetterSnapshot(snapshot: LoveLetterSnapshot) {
  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const table = snapshot.players.map((player) => {
    const state = player.active ? (player.protected ? "在局且受保护" : "在局") : "本轮出局";
    const discards = player.discards.length > 0 ? player.discards.map((card) => card.name).join("、") : "暂无";
    return `${player.name}：${player.favor}/4枚好感，${state}，公开弃牌${discards}`;
  }).join("；");
  return `第${snapshot.round}轮，第${snapshot.turn}个行动，${snapshot.phase === "play" ? `轮到${current?.name ?? "未知玩家"}` : snapshot.phase === "round-over" ? "本轮已结束" : "整场已结束"}。牌堆剩${snapshot.deckCount}张。${table}。`;
}

