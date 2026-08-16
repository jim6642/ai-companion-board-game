"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwise, CardsThree, PaperPlaneTilt, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import { COMPANION_CHARACTERS, getCompanionCharacter } from "@/lib/companion/characters";
import { createDirectorMemory, directTableTurn, type DirectorMemory } from "@/lib/companion/director";
import {
  CompanionUnoEngine,
  type UnoCardView,
  type UnoColorName,
  type UnoGameEvent,
  type UnoSnapshot,
} from "@/lib/uno/engine";
import styles from "./uno.module.css";

interface ChatEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  kind: "event" | "human" | "ai" | "director";
}

const HUMAN_ID = "human";
type ReactionFrequency = "quiet" | "balanced" | "lively";
const REACTION_FREQUENCIES: Record<ReactionFrequency, { label: string; cooldownTurns: number }> = {
  quiet: { label: "少", cooldownTurns: 8 },
  balanced: { label: "适中", cooldownTurns: 5 },
  lively: { label: "多", cooldownTurns: 3 },
};
const PLAYER_SPECS = [
  { id: HUMAN_ID, name: "你", isHuman: true },
  ...COMPANION_CHARACTERS.map((character) => ({ id: character.id, name: character.name })),
];

const SESSION_KEYS = {
  minimaxApiKey: "companion.minimax_api_key",
  minimaxGroupId: "companion.minimax_group_id",
  siliconflowApiKey: "companion.siliconflow_api_key",
} as const;

const COLOR_LABELS: Record<UnoColorName, string> = {
  red: "红色",
  blue: "蓝色",
  green: "绿色",
  yellow: "黄色",
};

function makeEngine() {
  const readName = (key: string) => {
    const raw = localStorage.getItem(key);
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "string" ? parsed : raw;
    } catch {
      return raw;
    }
  };
  const savedName = typeof window !== "undefined"
    ? (readName("companion.player_name") || readName("aicb_human_name") || "你").trim().slice(0, 12)
    : "你";
  return new CompanionUnoEngine(PLAYER_SPECS.map((player) => player.id === HUMAN_ID ? { ...player, name: savedName || "你" } : player));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function CardFace({ card, onClick, compact = false }: { card: UnoCardView; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.unoCard} ${styles[`card_${card.color}`]} ${card.isPlayable ? styles.cardPlayable : ""} ${card.isDrawnCard ? styles.cardDrawn : ""} ${compact ? styles.cardCompact : ""}`}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${card.color === "wild" ? "万能" : COLOR_LABELS[card.color]} ${card.label}${card.isPlayable ? "，可以打出" : ""}`}
    >
      <span className={styles.cardCorner}>{card.shortLabel}</span>
      <span className={styles.cardOval}>{card.shortLabel}</span>
      <span className={styles.cardCornerBottom}>{card.shortLabel}</span>
      {card.isWild ? <span className={styles.activeColorDot} data-color={card.activeColor} title={`当前颜色：${COLOR_LABELS[card.activeColor]}`} /> : null}
    </button>
  );
}

function offlineReply(characterId: string, context: string) {
  const replies: Record<string, string> = {
    "lin-xia": context.includes("摸") ? "没事，先把牌留好，下一轮说不定就接上了。" : "这张出得挺稳，我先看看他们准备怎么接。",
    "su-yao": "行啊，这张明显就是冲着人去的，还装得挺无辜。",
    "gu-qinglan": "选择合理。不过功能牌交得早不早，还要看后面的颜色分布。",
    "tang-guo": "好好好，这么玩是吧？等轮到我你可别后悔。",
    "chen-hang": "兄弟，你这牌多少带点私人恩怨了，我看出来了。",
    "xiao-man": "哥你又开始了，牌一顺就特别藏不住得意。",
    "shen-ning": "先别急着高兴，手牌越少，别人越会留功能牌防你。",
  };
  return replies[characterId] ?? "这一下有点意思，继续。";
}

export default function CompanionUnoPage() {
  const router = useRouter();
  const engineRef = useRef<CompanionUnoEngine | null>(null);
  if (!engineRef.current) engineRef.current = makeEngine();
  const [snapshot, setSnapshot] = useState<UnoSnapshot>(() => engineRef.current!.snapshot());
  const [chat, setChat] = useState<ChatEntry[]>([
    {
      id: "uno-director-welcome",
      speakerId: "director",
      speakerName: "桌面导演",
      text: "规则和机器人出牌全部在浏览器本地运行。角色只会根据公开事件聊天，不会替任何人决定出牌。",
      kind: "director",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [reactionFrequency, setReactionFrequency] = useState<ReactionFrequency>("balanced");
  const [keys, setKeys] = useState({ minimaxApiKey: "", minimaxGroupId: "", siliconflowApiKey: "" });
  const chatRef = useRef(chat);
  const directorMemoryRef = useRef<DirectorMemory>(createDirectorMemory());
  const reactionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingVoiceCountRef = useRef(0);
  const lastAutoReactionTurnRef = useRef(-REACTION_FREQUENCIES.balanced.cooldownTurns);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const human = snapshot.players.find((player) => player.id === HUMAN_ID)!;
  const currentPlayer = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const winner = snapshot.players.find((player) => player.id === snapshot.winnerId);

  useEffect(() => {
    const restored = {
      minimaxApiKey: sessionStorage.getItem(SESSION_KEYS.minimaxApiKey) || "",
      minimaxGroupId: sessionStorage.getItem(SESSION_KEYS.minimaxGroupId) || "",
      siliconflowApiKey: sessionStorage.getItem(SESSION_KEYS.siliconflowApiKey) || "",
    };
    setKeys(restored);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const addChat = useCallback((entries: ChatEntry[]) => {
    setChat((previous) => {
      const next = [...previous, ...entries].slice(-80);
      chatRef.current = next;
      return next;
    });
  }, []);

  const playVoice = useCallback(async (characterId: string, text: string) => {
    if (!voiceEnabled) return;
    const character = getCompanionCharacter(characterId);
    if (!character) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
    if (keys.minimaxGroupId) headers["x-minimax-group-id"] = keys.minimaxGroupId;
    const response = await fetch("/api/companion/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text, voiceId: character.voiceId }),
    });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      const finish = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        resolve();
      };
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      void audio.play().catch(finish);
    });
  }, [keys.minimaxApiKey, keys.minimaxGroupId, voiceEnabled]);

  const enqueueVoice = useCallback((characterId: string, text: string, dropIfBusy = false) => {
    if (dropIfBusy && pendingVoiceCountRef.current > 0) return;
    pendingVoiceCountRef.current += 1;
    voiceQueueRef.current = voiceQueueRef.current
      .then(() => playVoice(characterId, text))
      .catch(() => undefined)
      .finally(() => {
        pendingVoiceCountRef.current = Math.max(0, pendingVoiceCountRef.current - 1);
      });
  }, [playVoice]);

  const requestReplies = useCallback((characterIds: string[], prompt: string, options: { autoSpeech?: boolean } = {}) => {
    reactionQueueRef.current = reactionQueueRef.current.then(async () => {
      if (characterIds.length === 0) return;
      setIsChatResponding(true);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
        const response = await fetch("/api/companion/respond", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mode: "uno",
            playerText: prompt,
            characterIds,
            history: chatRef.current.map(({ speakerId, speakerName, text }) => ({ speakerId, speakerName, text })),
          }),
        });
        const result = await response.json().catch(() => null) as { replies?: Array<{ characterId: string; text: string }> } | null;
        const replies = response.ok && result?.replies?.length
          ? result.replies
          : characterIds.map((characterId) => ({ characterId, text: offlineReply(characterId, prompt) }));
        const entries = replies.map((reply) => ({
          id: makeId(`uno-ai-${reply.characterId}`),
          speakerId: reply.characterId,
          speakerName: getCompanionCharacter(reply.characterId)?.name ?? reply.characterId,
          text: reply.text,
          kind: "ai" as const,
        }));
        addChat(entries);
        replies.forEach((reply) => enqueueVoice(reply.characterId, reply.text, options.autoSpeech));
      } finally {
        setIsChatResponding(false);
      }
    }).catch(() => setIsChatResponding(false));
  }, [addChat, enqueueVoice, keys.minimaxApiKey]);

  const selectReactionCharacter = useCallback((event: UnoGameEvent, current: UnoSnapshot) => {
    if (event.actorId !== HUMAN_ID && getCompanionCharacter(event.actorId)) return event.actorId;
    const target = event.targetIds.find((id) => getCompanionCharacter(id));
    if (target) return target;
    return COMPANION_CHARACTERS[current.turn % COMPANION_CHARACTERS.length].id;
  }, []);

  const publishEvents = useCallback((events: UnoGameEvent[], current: UnoSnapshot) => {
    if (events.length === 0) return;
    addChat(events.map((event) => ({
      id: event.id,
      speakerId: "director",
      speakerName: "牌桌事件",
      text: event.text,
      kind: "event" as const,
    })));
    const winEvent = events.find((event) => event.kind === "win");
    const cooldownReady = current.turn - lastAutoReactionTurnRef.current >= REACTION_FREQUENCIES[reactionFrequency].cooldownTurns;
    const notableEvent = cooldownReady
      ? [...events].reverse().find((event) =>
          reactionFrequency === "lively"
            ? event.significant || (event.actorId === HUMAN_ID && event.kind === "play")
            : reactionFrequency === "balanced"
              ? (event.actorId === HUMAN_ID && event.kind === "play")
                || (event.significant && (event.targetIds.includes(HUMAN_ID) || event.kind === "uno"))
              : event.significant
                && (event.actorId === HUMAN_ID || event.targetIds.includes(HUMAN_ID) || event.kind === "uno"),
        )
      : undefined;
    const reactionEvent = winEvent ?? notableEvent;
    if (reactionEvent) {
      lastAutoReactionTurnRef.current = current.turn;
      const characterId = selectReactionCharacter(reactionEvent, current);
      requestReplies(
        [characterId],
        `公开 UNO 事件：${reactionEvent.text} 请只评价这件已经发生的事。`,
        { autoSpeech: true },
      );
    }
  }, [addChat, reactionFrequency, requestReplies, selectReactionCharacter]);

  const refresh = useCallback(() => {
    const next = engineRef.current!.snapshot();
    setSnapshot(next);
    return next;
  }, []);

  const handlePlayCard = useCallback((card: UnoCardView) => {
    if (!card.isPlayable) return;
    if (card.isWild) {
      setPendingWildCardId(card.id);
      return;
    }
    try {
      const events = engineRef.current!.playHuman(card.id);
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      addChat([{ id: makeId("uno-error"), speakerId: "director", speakerName: "规则提示", text: error instanceof Error ? error.message : "这张牌现在不能出。", kind: "director" }]);
    }
  }, [addChat, publishEvents, refresh]);

  const handleWildColor = useCallback((color: UnoColorName) => {
    if (!pendingWildCardId) return;
    try {
      const events = engineRef.current!.playHuman(pendingWildCardId, color);
      setPendingWildCardId(null);
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setPendingWildCardId(null);
      addChat([{ id: makeId("uno-error"), speakerId: "director", speakerName: "规则提示", text: error instanceof Error ? error.message : "万能牌出牌失败。", kind: "director" }]);
    }
  }, [addChat, pendingWildCardId, publishEvents, refresh]);

  const handleDraw = useCallback(() => {
    try {
      const events = engineRef.current!.drawHuman();
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      addChat([{ id: makeId("uno-error"), speakerId: "director", speakerName: "规则提示", text: error instanceof Error ? error.message : "现在不能摸牌。", kind: "director" }]);
    }
  }, [addChat, publishEvents, refresh]);

  const handlePass = useCallback(() => {
    try {
      const events = engineRef.current!.passHuman();
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      addChat([{ id: makeId("uno-error"), speakerId: "director", speakerName: "规则提示", text: error instanceof Error ? error.message : "现在不能结束回合。", kind: "director" }]);
    }
  }, [addChat, publishEvents, refresh]);

  const restart = useCallback(() => {
    engineRef.current = makeEngine();
    directorMemoryRef.current = createDirectorMemory();
    lastAutoReactionTurnRef.current = -REACTION_FREQUENCIES[reactionFrequency].cooldownTurns;
    setPendingWildCardId(null);
    setChat([{
      id: makeId("uno-restart"),
      speakerId: "director",
      speakerName: "桌面导演",
      text: "新的一局已经洗牌。规则和机器人仍全部在本地运行。",
      kind: "director",
    }]);
    setSnapshot(engineRef.current.snapshot());
  }, [reactionFrequency]);

  useEffect(() => {
    if (snapshot.winnerId || snapshot.currentPlayerId === HUMAN_ID) {
      setIsBotRunning(false);
      return;
    }

    setIsBotRunning(true);
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const events = engineRef.current!.runBotTurn();
        const next = refresh();
        publishEvents(events, next);
      } catch (error) {
        addChat([{
          id: makeId("uno-bot-error"),
          speakerId: "director",
          speakerName: "规则提示",
          text: `机器人回合恢复失败：${error instanceof Error ? error.message : "未知错误"}。请点击右上角重新开局。`,
          kind: "director",
        }]);
      } finally {
        if (!cancelled) setIsBotRunning(false);
      }
    }, 520);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [addChat, publishEvents, refresh, snapshot.currentPlayerId, snapshot.turn, snapshot.winnerId]);

  const sendChat = useCallback(() => {
    const text = draft.trim();
    if (!text || isChatResponding) return;
    addChat([{ id: makeId("uno-human-chat"), speakerId: HUMAN_ID, speakerName: human.name, text, kind: "human" }]);
    setDraft("");
    const decision = directTableTurn(text, chatRef.current.map((item) => ({ speakerId: item.speakerId, text: item.text })), directorMemoryRef.current);
    directorMemoryRef.current = decision.nextMemory;
    requestReplies(decision.selected.slice(0, 2).map((item) => item.character.id), `玩家在 UNO 牌桌上说：${text}`);
  }, [addChat, draft, human.name, isChatResponding, requestReplies]);

  const opponents = useMemo(() => snapshot.players.filter((player) => !player.isHuman), [snapshot.players]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/companion")}>← 桌游大厅</button>
        <div className={styles.brand}>
          <span className={styles.brandMark}>U</span>
          <span><strong>今夜有局 · UNO</strong><small>本地规则陪玩原型</small></span>
        </div>
        <div className={styles.headerStatus}>
          <label className={styles.frequencyControl} title="自动评价频率">
            <span>发言</span>
            <select
              value={reactionFrequency}
              onChange={(event) => {
                const next = event.target.value as ReactionFrequency;
                setReactionFrequency(next);
                lastAutoReactionTurnRef.current = snapshot.turn - REACTION_FREQUENCIES[next].cooldownTurns;
              }}
              aria-label="自动评价频率"
            >
              {(Object.entries(REACTION_FREQUENCIES) as Array<[ReactionFrequency, { label: string; cooldownTurns: number }]>).map(([value, option]) => (
                <option key={value} value={value}>{option.label}</option>
              ))}
            </select>
          </label>
          <span>第 {snapshot.turn} 手</span>
          <span>{snapshot.direction === "clockwise" ? "顺时针 ↻" : "逆时针 ↺"}</span>
          <button type="button" onClick={() => setVoiceEnabled((value) => !value)} title={voiceEnabled ? "关闭角色语音" : "打开角色语音"}>
            {voiceEnabled ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
          </button>
          <button type="button" onClick={restart} title="重新洗牌"><ArrowCounterClockwise size={18} /></button>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.tablePanel}>
          <div className={styles.opponents}>
            {opponents.map((player) => {
              const character = getCompanionCharacter(player.id);
              return (
                <div key={player.id} className={`${styles.opponent} ${player.isCurrent ? styles.opponentActive : ""}`}>
                  <span className={styles.avatar} style={{ "--character-color": character?.color ?? "#94a3b8" } as CSSProperties}>{player.name.slice(-1)}</span>
                  <span className={styles.opponentName}>{player.name}</span>
                  <span className={styles.cardCount}><CardsThree size={15} /> {player.cardCount}</span>
                  {player.hasUno ? <b>UNO!</b> : null}
                </div>
              );
            })}
          </div>

          <div className={styles.tableCenter}>
            <div className={styles.turnNotice}>
              {winner ? `${winner.name}赢了这一局` : currentPlayer?.id === HUMAN_ID ? "轮到你出牌" : `${currentPlayer?.name ?? "AI"} 正在出牌`}
              {isBotRunning ? <i /> : null}
            </div>
            <div className={styles.piles}>
              <button type="button" className={styles.drawPile} onClick={snapshot.canHumanDraw ? handleDraw : undefined} disabled={!snapshot.canHumanDraw}>
                <span>UNO</span><small>{snapshot.drawPileCount} 张</small>
              </button>
              <div className={styles.discardPile}>
                <CardFace card={snapshot.topCard} compact />
                <small>当前颜色：{COLOR_LABELS[snapshot.topCard.activeColor]}</small>
              </div>
            </div>
            {snapshot.currentPlayerId === HUMAN_ID && !winner ? (
              <div className={styles.turnActions}>
                {snapshot.canHumanDraw ? <button type="button" onClick={handleDraw}>摸一张</button> : null}
                {snapshot.canHumanPass ? <button type="button" onClick={handlePass}>保留并结束回合</button> : null}
              </div>
            ) : null}
            {winner ? <button type="button" className={styles.playAgain} onClick={restart}>再来一局</button> : null}
          </div>

          <div className={styles.handArea}>
            <div className={styles.handHeader}>
              <span>你的手牌 · {human.cardCount} 张</span>
              <small>{snapshot.currentPlayerId === HUMAN_ID ? "发光的牌可以打出" : "等待其他玩家"}</small>
            </div>
            <div className={styles.handScroller}>
              {snapshot.humanHand.map((card) => <CardFace key={card.id} card={card} onClick={card.isPlayable ? () => handlePlayCard(card) : undefined} />)}
            </div>
          </div>
        </div>

        <aside className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span><strong>牌桌聊天</strong><small>只评价公开事件</small></span>
            {isChatResponding ? <i>有人正在回你…</i> : null}
          </div>
          <div className={styles.feed}>
            {chat.map((entry) => {
              const character = getCompanionCharacter(entry.speakerId);
              return (
                <article key={entry.id} className={`${styles.message} ${styles[`message_${entry.kind}`]}`}>
                  <span className={styles.messageAvatar} style={{ "--character-color": character?.color ?? "#64748b" } as CSSProperties}>{entry.kind === "event" || entry.kind === "director" ? "局" : entry.speakerName.slice(-1)}</span>
                  <div><strong>{entry.speakerName}</strong><p>{entry.text}</p></div>
                </article>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className={styles.composer}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="和大家聊两句…" maxLength={300} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} />
            <div className={styles.composerActions}>
              <VoiceRecorder disabled={isChatResponding} isNight sttApiKey={keys.siliconflowApiKey} sttEnabled holdToTalk onTranscript={setDraft} />
              <button type="button" className={styles.sendButton} onClick={sendChat} disabled={!draft.trim() || isChatResponding}><PaperPlaneTilt size={18} />发送</button>
            </div>
          </div>
        </aside>
      </section>

      {pendingWildCardId ? (
        <div className={styles.colorOverlay} role="dialog" aria-modal="true" aria-label="选择万能牌颜色">
          <div className={styles.colorDialog}>
            <small>万能牌</small><h2>选择接下来的颜色</h2>
            <div>{(Object.keys(COLOR_LABELS) as UnoColorName[]).map((color) => <button type="button" key={color} data-color={color} onClick={() => handleWildColor(color)}>{COLOR_LABELS[color]}</button>)}</div>
            <button type="button" className={styles.cancelColor} onClick={() => setPendingWildCardId(null)}>取消</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
