import type { LiarsDiceSnapshot } from "./engine";

export function describeLiarsDiceSnapshot(snapshot: LiarsDiceSnapshot) {
  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const bidder = snapshot.players.find((player) => player.id === snapshot.currentBid?.bidderId);
  const counts = snapshot.players.map((player) => `${player.name}${player.active ? `剩${player.diceRemaining}颗` : "已出局"}`).join("、");
  const bid = snapshot.currentBid ? `当前叫点是${bidder?.name ?? "上一位玩家"}的“${snapshot.currentBid.quantity}个${snapshot.currentBid.face}点”` : "本轮尚未有人叫点";
  const phase = snapshot.phase === "play" ? `轮到${current?.name ?? "未知玩家"}` : snapshot.phase === "round-over" ? "本轮已经开盅" : "整场已经结束";
  return `第${snapshot.round}轮，桌上共${snapshot.totalDice}颗骰子，${phase}。${bid}。${counts}。`;
}
