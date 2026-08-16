"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChatCircleDots,
  Heart,
  PaperPlaneTilt,
  ShieldCheck,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import {
  COMPANION_CHARACTERS,
  getCompanionCharacter,
  type CompanionCharacter,
} from "@/lib/companion/characters";
import {
  chooseLoveLetterChatIntent,
  chooseLoveLetterEventIntent,
  createLoveLetterRelationshipMemories,
  describeLoveLetterSpeech,
  markLoveLetterSpeech,
  rememberLoveLetterEvents,
  rememberLoveLetterPlayerLine,
  type LoveLetterDialogueIntent,
  type LoveLetterRelationshipMemories,
} from "@/lib/companion/love-letter-dialogue";
import { prepareTextForTts } from "@/lib/companion/speech-text";
import { describeLoveLetterSnapshot } from "@/lib/love-letter/context";
import {
  CompanionLoveLetterEngine,
  LOVE_LETTER_GUESS_KINDS,
  loveLetterCardDefinition,
  type LoveLetterCard,
  type LoveLetterGameEvent,
  type LoveLetterMove,
  type LoveLetterSnapshot,
} from "@/lib/love-letter/engine";
import styles from "./love-letter.module.css";

const HUMAN_ID = "human";
const SESSION_KEYS = {
  minimaxApiKey: "companion.minimax_api_key",
  minimaxGroupId: "companion.minimax_group_id",
  siliconflowApiKey: "companion.siliconflow_api_key",
} as const;

interface ChatEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  kind: "human" | "ai" | "event" | "director";
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readPlayerName() {
  if (typeof window === "undefined") return "你";
  const raw = localStorage.getItem("companion.player_name") || localStorage.getItem("aicb_human_name") || "你";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed.trim().slice(0, 12) || "你" : "你";
  } catch {
    return raw.trim().slice(0, 12) || "你";
  }
}

function makeSpecs(characterIds: string[]) {
  return [
    { id: HUMAN_ID, name: readPlayerName(), isHuman: true },
    ...characterIds.map((id) => ({ id, name: getCompanionCharacter(id)?.name ?? id })),
  ];
}

function offlineReply(characterId: string, prompt: string) {
  const eliminated = prompt.includes("出局") || prompt.includes("淘汰");
  const won = prompt.includes("赢下") || prompt.includes("集齐四枚");
  const lines: Record<string, string> = {
    "lin-xia": eliminated ? "先记住是谁猜的，下一轮我陪你慢慢还回去。" : won ? "你笑得这么开心……好吧，这枚好感算你应得的。" : "你先出，我可一直在看你会不会犹豫。",
    "su-yao": eliminated ? "这么快就出局？啧，下一轮别让我替你着急。" : won ? "才四枚就得意成这样，你是不是就等着我夸你？" : "别盯着我看，猜牌就好好猜。",
    "gu-qinglan": eliminated ? "这次信息不够，别急着怪判断。下一轮把弃牌记清楚。" : won ? "赢得还算漂亮。你刚才那点小得意，我也看见了。" : "先看公开弃牌，别被谁一句话带走。",
    "tang-guo": eliminated ? "不许垮脸！下一轮你跟着我，我帮你把场子找回来。" : won ? "赢了就看我呀，我可是第一个想抱……想夸你的人。" : "你要是猜中我，我就承认你特别懂我一次。",
    "chen-hang": eliminated ? "兄弟，出局速度挺有效率，下一轮争取多坐半分钟。" : won ? "行，这把算你帅，别回头拿四颗心到处炫耀。" : "你出你的，我负责看谁演得最像。",
    "xiao-man": eliminated ? "哥，你这就没了？回家可别说是牌运不好。" : won ? "知道你赢了，嘴角收一收，家里没人跟你抢奖杯。" : "你小时候藏零食都藏不住，还想藏手牌。",
    "shen-ning": eliminated ? "没事，先看完这一轮。姐姐帮你记着谁刚才最得意。" : won ? "赢了可以高兴，不过别熬着一直重开，听见没有？" : "慢慢选，别一紧张就把最好猜的那张打出去。",
  };
  return lines[characterId] ?? "这一步我记下了，下一轮再算。";
}

function LetterCard({ card, selected, playable, onClick }: {
  card: LoveLetterCard;
  selected?: boolean;
  playable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.letterCard} ${selected ? styles.cardSelected : ""} ${playable ? styles.cardPlayable : ""}`}
      style={{ "--card-level": card.value } as CSSProperties}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${card.name}，${card.effect}`}
    >
      <span className={styles.cardValue}>{card.value}</span>
      <span className={styles.cardSeal}>✦</span>
      <strong>{card.name}</strong>
      <small>{card.effect}</small>
    </button>
  );
}

export default function CompanionLoveLetterPage() {
  const router = useRouter();
  const engineRef = useRef<CompanionLoveLetterEngine | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<LoveLetterSnapshot | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<LoveLetterMove["guess"]>();
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [latestEvent, setLatestEvent] = useState("选择一张手牌，再确认目标与猜测。");
  const [keys, setKeys] = useState({ minimaxApiKey: "", minimaxGroupId: "", siliconflowApiKey: "" });
  const chatRef = useRef<ChatEntry[]>([]);
  const relationshipMemoriesRef = useRef<LoveLetterRelationshipMemories>({});
  const reactionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingVoiceCountRef = useRef(0);
  const lastReactionTurnRef = useRef(-2);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  // Incremented every time we (re)start a match. Async chains created
  // before the bump see a stale id and bail out without touching the
  // new match's chat, voice queue, or chatResponding state. Without
  // this guard, a long bot turn whose /api/companion/respond reply
  // arrives AFTER the player hits "重开整场" would pollute the new
  // match's UI.
  const matchIdRef = useRef(0);

  const selectedCharacters = useMemo(
    () => selectedIds.map((id) => getCompanionCharacter(id)).filter((item): item is CompanionCharacter => Boolean(item)),
    [selectedIds],
  );
  const human = snapshot?.players.find((player) => player.id === HUMAN_ID);
  const legalMoves = snapshot?.phase === "play" && snapshot.currentPlayerId === HUMAN_ID
    ? engineRef.current?.legalMoves() ?? []
    : [];
  const movesForCard = selectedCardId ? legalMoves.filter((move) => move.cardId === selectedCardId) : [];
  const targetIds = [...new Set(movesForCard.map((move) => move.targetId).filter((id): id is string => Boolean(id)))];
  const guessKinds = selectedTargetId
    ? [...new Set(movesForCard.filter((move) => move.targetId === selectedTargetId).map((move) => move.guess).filter((kind): kind is NonNullable<LoveLetterMove["guess"]> => Boolean(kind)))]
    : [];
  const chosenMove = movesForCard.find((move) => (
    (move.targetId ?? null) === (selectedTargetId ?? null)
    && (move.guess ?? null) === (selectedGuess ?? null)
  ));

  useEffect(() => {
    setKeys({
      minimaxApiKey: sessionStorage.getItem(SESSION_KEYS.minimaxApiKey) || "",
      minimaxGroupId: sessionStorage.getItem(SESSION_KEYS.minimaxGroupId) || "",
      siliconflowApiKey: sessionStorage.getItem(SESSION_KEYS.siliconflowApiKey) || "",
    });
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [chat]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const addChat = useCallback((entries: ChatEntry[]) => {
    setChat((previous) => {
      const next = [...previous, ...entries].slice(-100);
      chatRef.current = next;
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    const next = engineRef.current?.snapshot() ?? null;
    setSnapshot(next);
    setSelectedCardId(null);
    setSelectedTargetId(null);
    setSelectedGuess(undefined);
    return next;
  }, []);

  const playVoice = useCallback(async (characterId: string, text: string) => {
    if (!voiceEnabled) return;
    const character = getCompanionCharacter(characterId);
    const spokenText = prepareTextForTts(text);
    if (!character || !spokenText) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
    if (keys.minimaxGroupId) headers["x-minimax-group-id"] = keys.minimaxGroupId;
    const response = await fetch("/api/companion/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: spokenText, voiceId: character.voiceId }),
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
    const matchId = matchIdRef.current;
    pendingVoiceCountRef.current += 1;
    voiceQueueRef.current = voiceQueueRef.current
      .then(() => {
        // If the player restarted mid-game, drop the queued line.
        if (matchIdRef.current !== matchId) return;
        return playVoice(characterId, text);
      })
      .catch(() => undefined)
      .finally(() => { pendingVoiceCountRef.current = Math.max(0, pendingVoiceCountRef.current - 1); });
  }, [playVoice]);

  const requestReply = useCallback((
    characterId: string,
    prompt: string,
    intent: LoveLetterDialogueIntent,
    autoSpeech: boolean,
  ) => {
    if (!selectedIds.includes(characterId)) return;
    const matchId = matchIdRef.current;
    reactionQueueRef.current = reactionQueueRef.current.then(async () => {
      // Bail out before flipping UI state if a restart already happened.
      if (matchIdRef.current !== matchId) return;
      setIsChatResponding(true);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
        const response = await fetch("/api/companion/respond", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mode: "love-letter",
            playerText: `${prompt}\n${describeLoveLetterSpeech(characterId, intent, relationshipMemoriesRef.current[characterId])}`,
            characterIds: [characterId],
            history: chatRef.current.slice(-20).map(({ speakerId, speakerName, text }) => ({ speakerId, speakerName, text })),
          }),
        });
        // The fetch may have raced a restart; drop the result so the new
        // match's chat feed stays clean and we don't enqueue a stale
        // TTS line into the new match's voice queue.
        if (matchIdRef.current !== matchId) return;
        const result = await response.json().catch(() => null) as { replies?: Array<{ characterId: string; text: string }> } | null;
        if (matchIdRef.current !== matchId) return;
        const reply = response.ok && result?.replies?.[0]
          ? result.replies[0]
          : { characterId, text: offlineReply(characterId, prompt) };
        const character = getCompanionCharacter(reply.characterId);
        addChat([{
          id: makeId(`letter-ai-${reply.characterId}`),
          speakerId: reply.characterId,
          speakerName: character?.name ?? reply.characterId,
          text: reply.text,
          kind: "ai",
        }]);
        markLoveLetterSpeech(relationshipMemoriesRef.current, reply.characterId, intent);
        enqueueVoice(reply.characterId, reply.text, autoSpeech);
      } finally {
        if (matchIdRef.current === matchId) setIsChatResponding(false);
      }
    }).catch(() => {
      if (matchIdRef.current === matchId) setIsChatResponding(false);
    });
  }, [addChat, enqueueVoice, keys.minimaxApiKey, selectedIds]);

  const reactionSpeaker = useCallback((event: LoveLetterGameEvent, current: LoveLetterSnapshot) => {
    if (selectedIds.includes(event.actorId)) return event.actorId;
    const target = event.targetIds.find((id) => selectedIds.includes(id));
    if (target) return target;
    return selectedIds[(current.turn + event.text.length) % selectedIds.length];
  }, [selectedIds]);

  const publishEvents = useCallback((events: LoveLetterGameEvent[], current: LoveLetterSnapshot | null) => {
    if (!current || events.length === 0) return;
    rememberLoveLetterEvents(relationshipMemoriesRef.current, events, HUMAN_ID);
    const summary = events.map((event) => event.text).join(" ");
    setLatestEvent(summary);
    addChat([{
      id: makeId("letter-event"),
      speakerId: "director",
      speakerName: "密函播报",
      text: summary,
      kind: "event",
    }]);
    const priority = [...events].reverse().find((event) => event.kind === "game-win")
      ?? [...events].reverse().find((event) => event.kind === "round-win")
      ?? [...events].reverse().find((event) => event.kind === "eliminate")
      ?? [...events].reverse().find((event) => event.significant && (event.actorId === HUMAN_ID || event.targetIds.includes(HUMAN_ID)));
    const overdue = current.turn - lastReactionTurnRef.current >= 3
      ? [...events].reverse().find((event) => event.kind !== "draw")
      : undefined;
    const reactionEvent = priority ?? overdue;
    if (!reactionEvent) return;
    lastReactionTurnRef.current = current.turn;
    const speaker = reactionSpeaker(reactionEvent, current);
    const intent = chooseLoveLetterEventIntent(speaker, reactionEvent, HUMAN_ID);
    requestReply(
      speaker,
      `已经发生的公开事件：${reactionEvent.text}\n当前公开牌桌：${describeLoveLetterSnapshot(current)}\n只评价已经发生的事，不得声称知道任何隐藏手牌，也不要替玩家决定下一步。`,
      intent,
      true,
    );
  }, [addChat, reactionSpeaker, requestReply]);

  const startGame = useCallback(() => {
    if (selectedIds.length !== 3) return;
    matchIdRef.current += 1;
    // Drop any pending async replies/voices from a previous match.
    // The old chain is now orphaned: closures in it will see the
    // bumped matchId in the requestReply/enqueueVoice guards and
    // bail out before touching state.
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    audioRef.current?.pause();
    engineRef.current = new CompanionLoveLetterEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createLoveLetterRelationshipMemories(selectedIds);
    const next = engineRef.current.snapshot();
    const welcome: ChatEntry[] = [{
      id: makeId("letter-welcome"),
      speakerId: "director",
      speakerName: "密函播报",
      text: `经典四人情书开局。${selectedCharacters.map((character) => character.name).join("、")}和你同桌；先集齐四枚好感标记的人获胜。`,
      kind: "director",
    }];
    chatRef.current = welcome;
    setChat(welcome);
    setLatestEvent("你是第一轮先手。选择一张手牌，再确认目标与猜测。");
    lastReactionTurnRef.current = -2;
    setSnapshot(next);
  }, [selectedCharacters, selectedIds]);

  const restart = useCallback(() => {
    if (selectedIds.length !== 3) return;
    matchIdRef.current += 1;
    audioRef.current?.pause();
    // Same drain as startGame: long bot turns in the previous match
    // may still have an in-flight /api/companion/respond or TTS
    // request that would otherwise land in the new match's UI.
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    engineRef.current = new CompanionLoveLetterEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createLoveLetterRelationshipMemories(selectedIds);
    const message: ChatEntry = { id: makeId("letter-restart"), speakerId: "director", speakerName: "密函播报", text: "新的一场已经洗好牌。所有好感标记清零，由你先手。", kind: "director" };
    chatRef.current = [message];
    setChat([message]);
    setLatestEvent("新的一场开始，选择一张手牌。");
    lastReactionTurnRef.current = -2;
    refresh();
  }, [refresh, selectedIds]);

  const playHuman = useCallback(() => {
    if (!chosenMove) return;
    try {
      const events = engineRef.current?.playHuman(chosenMove) ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "这个行动现在不能执行。");
    }
  }, [chosenMove, publishEvents, refresh]);

  const nextRound = useCallback(() => {
    try {
      const events = engineRef.current?.startNextRound() ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "暂时不能开始下一轮。");
    }
  }, [publishEvents, refresh]);

  useEffect(() => {
    if (!snapshot || snapshot.phase !== "play" || snapshot.currentPlayerId === HUMAN_ID) {
      setIsBotRunning(false);
      return;
    }
    setIsBotRunning(true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const events = engineRef.current?.runBotTurn() ?? [];
        const next = refresh();
        publishEvents(events, next);
      } catch (error) {
        setLatestEvent(`机器人回合失败：${error instanceof Error ? error.message : "未知错误"}`);
      } finally {
        if (!cancelled) setIsBotRunning(false);
      }
    }, 240);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [publishEvents, refresh, snapshot]);

  const sendChat = useCallback(() => {
    if (!snapshot || !human || !draft.trim() || isChatResponding) return;
    const text = draft.trim();
    addChat([{ id: makeId("letter-human"), speakerId: HUMAN_ID, speakerName: human.name, text, kind: "human" }]);
    setDraft("");
    const mentioned = selectedCharacters.filter((character) => text.includes(character.name)).map((character) => character.id);
    const responder = mentioned[0] ?? selectedIds[(snapshot.turn + chatRef.current.length) % selectedIds.length];
    rememberLoveLetterPlayerLine(relationshipMemoriesRef.current, [responder], text);
    const intent = chooseLoveLetterChatIntent(responder, text);
    requestReply(
      responder,
      `玩家在情书牌桌上说：${text}\n当前公开牌桌：${describeLoveLetterSnapshot(snapshot)}\n直接回应玩家；不能透露或编造隐藏手牌。`,
      intent,
      false,
    );
  }, [addChat, draft, human, isChatResponding, requestReply, selectedCharacters, selectedIds, snapshot]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  }, []);

  const selectCard = useCallback((cardId: string) => {
    const cardMoves = legalMoves.filter((move) => move.cardId === cardId);
    setSelectedCardId(cardId);
    setSelectedTargetId(cardMoves.length === 1 ? cardMoves[0].targetId ?? null : null);
    setSelectedGuess(cardMoves.length === 1 ? cardMoves[0].guess : undefined);
  }, [legalMoves]);

  if (!snapshot) {
    return (
      <main className={styles.setupPage}>
        <header className={styles.setupHeader}>
          <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
          <div><span>AI BOARD COMPANION</span><h1>心动密函 · 经典情书</h1><p>选择三位真正参与本局的 AI 陪玩</p></div>
          <strong>{selectedIds.length} / 3</strong>
        </header>
        <section className={styles.setupPanel}>
          <div className={styles.setupCopy}>
            <Heart size={44} weight="duotone" />
            <h2>今晚把密函交给谁？</h2>
            <p>规则、隐藏手牌与 AI 行动全部由本地引擎处理。模型只负责根据公开事件陪你聊天，不会裁判，也看不到别人的手牌。</p>
          </div>
          <div className={styles.characterGrid}>
            {COMPANION_CHARACTERS.map((character) => {
              const selected = selectedIds.includes(character.id);
              return (
                <button key={character.id} type="button" className={selected ? styles.characterSelected : ""} onClick={() => toggleSelection(character.id)}>
                  <span style={{ "--character-color": character.color } as CSSProperties}>{character.name.slice(-1)}</span>
                  <strong>{character.name}</strong>
                  <small>{character.relationLabel}</small>
                  <p>{character.archetype}</p>
                </button>
              );
            })}
          </div>
          <button type="button" className={styles.startButton} disabled={selectedIds.length !== 3} onClick={startGame}>
            <Heart size={20} weight="fill" />四人到齐，拆开密函
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.gamePage}>
      <header className={styles.gameHeader}>
        <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
        <div><h1>心动密函</h1><p>经典四人情书 · AI 陪玩局</p></div>
        <div className={styles.headerStatus}><Heart size={18} weight="fill" />第 {snapshot.round} 轮 · 行动 {snapshot.turn}</div>
        <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>
          {voiceEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}{voiceEnabled ? "语音开" : "语音关"}
        </button>
        <button type="button" onClick={restart}>重开整场</button>
      </header>

      <div className={styles.gameLayout}>
        <section className={styles.tablePanel}>
          <div className={styles.playerGrid}>
            {snapshot.players.map((player) => {
              const character = getCompanionCharacter(player.id);
              return (
                <article key={player.id} className={`${styles.playerSeat} ${player.isCurrent ? styles.currentSeat : ""} ${!player.active ? styles.eliminatedSeat : ""}`}>
                  <span className={styles.avatar} style={{ "--character-color": character?.color ?? "#7dd3fc" } as CSSProperties}>{player.isHuman ? "你" : player.name.slice(-1)}</span>
                  <div><strong>{player.name}</strong><small>{player.active ? player.protected ? "侍女保护中" : player.isCurrent ? "正在行动" : "仍在本轮" : "本轮出局"}</small></div>
                  <span className={styles.favor}>{Array.from({ length: 4 }, (_, index) => <Heart key={index} size={14} weight={index < player.favor ? "fill" : "regular"} />)}</span>
                  {player.protected ? <ShieldCheck className={styles.protectedIcon} size={18} /> : null}
                  {player.knownHand && !player.isHuman ? <em>你知道：{player.knownHand.name}</em> : null}
                </article>
              );
            })}
          </div>

          <div className={styles.tableCenter}>
            <div className={styles.deckStack}><span>✦</span><strong>{snapshot.deckCount}</strong><small>牌堆</small></div>
            <div className={styles.discardBoard}>
              {snapshot.players.map((player) => (
                <div key={player.id}><strong>{player.name}</strong><span>{player.discards.length ? player.discards.map((card) => `${card.value}${card.name}`).join(" · ") : "尚未弃牌"}</span></div>
              ))}
            </div>
          </div>

          <div className={styles.eventRibbon}>{isBotRunning ? "AI 正在本地选择合法行动……" : latestEvent}</div>
          {snapshot.privateNotice ? <div className={styles.privateNotice}>只有你知道：{snapshot.privateNotice}</div> : null}

          <div className={styles.handArea}>
            <div className={styles.handHeading}><span>你的手牌</span><small>{snapshot.currentPlayerId === HUMAN_ID && snapshot.phase === "play" ? "轮到你：摸一张后打出一张" : "等待其他玩家行动"}</small></div>
            <div className={styles.handCards}>
              {snapshot.humanHand.map((card) => (
                <LetterCard
                  key={card.id}
                  card={card}
                  selected={selectedCardId === card.id}
                  playable={snapshot.legalCardIds.includes(card.id)}
                  onClick={snapshot.legalCardIds.includes(card.id) ? () => selectCard(card.id) : undefined}
                />
              ))}
            </div>
          </div>

          {snapshot.phase === "play" && snapshot.currentPlayerId === HUMAN_ID && selectedCardId ? (
            <div className={styles.actionPanel}>
              {targetIds.length > 0 ? (
                <div><strong>选择目标</strong><span className={styles.choiceRow}>{targetIds.map((id) => {
                  const player = snapshot.players.find((item) => item.id === id)!;
                  return <button key={id} type="button" className={selectedTargetId === id ? styles.choiceSelected : ""} onClick={() => { setSelectedTargetId(id); setSelectedGuess(undefined); }}>{player.name}</button>;
                })}</span></div>
              ) : <p>这张牌不需要选择目标。</p>}
              {guessKinds.length > 0 ? (
                <div><strong>猜对方是哪张牌</strong><span className={styles.choiceRow}>{guessKinds.map((kind) => {
                  const definition = loveLetterCardDefinition(kind);
                  return <button key={kind} type="button" className={selectedGuess === kind ? styles.choiceSelected : ""} onClick={() => setSelectedGuess(kind)}>{definition.value} · {definition.name}</button>;
                })}</span></div>
              ) : null}
              <button type="button" className={styles.confirmButton} disabled={!chosenMove} onClick={playHuman}>确认打出</button>
            </div>
          ) : null}

          {snapshot.phase !== "play" ? (
            <div className={styles.roundOverlay}>
              <Heart size={42} weight="duotone" />
              <h2>{snapshot.phase === "game-over" ? "整场结束" : `第 ${snapshot.round} 轮结束`}</h2>
              <p>{snapshot.phase === "game-over"
                ? `${snapshot.gameWinnerIds.map((id) => snapshot.players.find((player) => player.id === id)?.name).join("、")}集齐四枚好感标记。`
                : `${snapshot.roundWinnerIds.map((id) => snapshot.players.find((player) => player.id === id)?.name).join("、")}获得本轮好感标记。`}</p>
              <button type="button" onClick={snapshot.phase === "game-over" ? restart : nextRound}>{snapshot.phase === "game-over" ? "再来一场" : "开始下一轮"}</button>
            </div>
          ) : null}
        </section>

        <aside className={styles.chatPanel}>
          <header><ChatCircleDots size={24} /><div><h2>密函聊天</h2><p>模型只看到公开牌桌与聊天记录</p></div><span>{chat.length} 条</span></header>
          <div className={styles.chatFeed} ref={feedRef}>
            {chat.map((entry) => {
              const character = getCompanionCharacter(entry.speakerId);
              return (
                <article key={entry.id} className={`${styles.chatEntry} ${entry.kind === "human" ? styles.humanEntry : ""} ${entry.kind === "event" || entry.kind === "director" ? styles.eventEntry : ""}`}>
                  <span className={styles.chatAvatar} style={{ "--character-color": character?.color ?? "#94a3b8" } as CSSProperties}>{entry.kind === "event" || entry.kind === "director" ? "函" : entry.kind === "human" ? "你" : entry.speakerName.slice(-1)}</span>
                  <div><strong>{entry.speakerName}</strong><p>{entry.text}</p></div>
                </article>
              );
            })}
            {isChatResponding ? <div className={styles.thinking}>她正在想怎么回你……</div> : null}
          </div>
          <div className={styles.composer}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="直接聊天，或点名一位陪玩……" maxLength={300} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} />
            <div><VoiceRecorder disabled={isChatResponding} isNight sttApiKey={keys.siliconflowApiKey} sttEnabled holdToTalk onTranscript={setDraft} /><button type="button" onClick={sendChat} disabled={!draft.trim() || isChatResponding}><PaperPlaneTilt size={18} />发送</button></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
