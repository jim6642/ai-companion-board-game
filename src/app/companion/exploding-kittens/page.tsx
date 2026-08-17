"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CaretRight,
  ChatCircleDots,
  Eye,
  PaperPlaneTilt,
  Pause,
  Play,
  Shuffle,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import {
  COMPANION_CHARACTERS,
  getCompanionCharacter,
  type CompanionCharacter,
} from "@/lib/companion/characters";
import {
  chooseEKChatIntent,
  chooseEKEventIntent,
  createEKRelationshipMemories,
  describeEKSpeech,
  markEKSpeech,
  rememberEKEvents,
  rememberEKPlayerLine,
  type EKDialogueIntent,
  type EKRelationshipMemories,
} from "@/lib/companion/exploding-kittens-dialogue";
import { prepareTextForTts } from "@/lib/companion/speech-text";
import { describeEKSnapshot } from "@/lib/exploding-kittens/context";
import {
  CompanionExplodingKittensEngine,
  EK_PLAYER_RANGE,
  type EKAction,
  type EKCard,
  type EKGameEvent,
  type EKLegalAction,
  type EKSnapshot,
} from "@/lib/exploding-kittens/engine";
import styles from "./exploding-kittens.module.css";

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
  const exploded = prompt.includes("炸") || prompt.includes("出局");
  const lines: Record<string, string> = {
    "lin-xia": exploded ? "你先别急，下一手我陪你把场子找回来。" : "你先稳住，我帮你看着牌堆。",
    "su-yao": exploded ? "别慌，炸都炸了，下一手我帮你盯死那个下家。" : "要出就快出，别在那儿装思考。",
    "gu-qinglan": exploded ? "先别急着出气，复盘一下谁把炸弹塞回你头上的。" : "先看清自己手牌，按顺序处理。",
    "tang-guo": exploded ? "欸别哭啊，下一手看我替你报仇！" : "我先押一手，你可得看准。",
    "chen-hang": exploded ? "兄弟稳住，下手我替你顶上。" : "兄弟稳住，先把手里的牌数清楚。",
    "xiao-man": exploded ? "哥你踩雷了？没事，我帮你看下一个该抽啥。" : "哥你快点出，别犹豫。",
    "shen-ning": exploded ? "先别气，先把手牌理一遍；姐姐帮你记着谁刚动过牌堆。" : "稳一点，按顺序出牌就行。",
  };
  return lines[characterId] ?? "这一步我记下了，下一手再算。";
}

function CardBack({ card, onClick, selected, playable, peek }: {
  card: EKCard;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  peek?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.cardSelected : ""} ${playable ? styles.cardPlayable : ""} ${peek ? styles.cardPeek : ""}`}
      style={{ "--card-tone": card.tone } as CSSProperties}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${card.name}，${card.effect}`}
    >
      <span className={styles.cardSymbol}>{card.symbol}</span>
      <span className={styles.cardName}>{card.name}</span>
      <small className={styles.cardEffect}>{card.effect}</small>
    </button>
  );
}

export default function CompanionExplodingKittensPage() {
  const router = useRouter();
  const engineRef = useRef<CompanionExplodingKittensEngine | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<EKSnapshot | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingLegal, setPendingLegal] = useState<EKLegalAction | null>(null);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiPaused, setAiPaused] = useState(false);
  const [latestEvent, setLatestEvent] = useState("选 1-4 位 AI 陪玩开局。");
  const [keys, setKeys] = useState({ minimaxApiKey: "", minimaxGroupId: "", siliconflowApiKey: "" });
  const [peekDismissed, setPeekDismissed] = useState(false);
  const chatRef = useRef<ChatEntry[]>([]);
  const relationshipMemoriesRef = useRef<EKRelationshipMemories>({});
  const reactionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingVoiceCountRef = useRef(0);
  const lastReactionTurnRef = useRef(-2);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const matchIdRef = useRef(0);

  const selectedCharacters = useMemo(
    () => selectedIds.map((id) => getCompanionCharacter(id)).filter((item): item is CompanionCharacter => Boolean(item)),
    [selectedIds],
  );
  const human = snapshot?.players.find((player) => player.id === HUMAN_ID);

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
    setPendingLegal(null);
    setPendingTarget(null);
    setPeekDismissed(false);
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
        if (matchIdRef.current !== matchId) return;
        return playVoice(characterId, text);
      })
      .catch(() => undefined)
      .finally(() => { pendingVoiceCountRef.current = Math.max(0, pendingVoiceCountRef.current - 1); });
  }, [playVoice]);

  const requestReply = useCallback((
    characterId: string,
    prompt: string,
    intent: EKDialogueIntent,
    autoSpeech: boolean,
  ) => {
    if (!selectedIds.includes(characterId)) return;
    const matchId = matchIdRef.current;
    reactionQueueRef.current = reactionQueueRef.current.then(async () => {
      if (matchIdRef.current !== matchId) return;
      setIsChatResponding(true);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
        const response = await fetch("/api/companion/respond", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mode: "exploding-kittens",
            playerText: `${prompt}\n${describeEKSpeech(characterId, intent, relationshipMemoriesRef.current[characterId])}`,
            characterIds: [characterId],
            history: chatRef.current.slice(-20).map(({ speakerId, speakerName, text }) => ({ speakerId, speakerName, text })),
          }),
        });
        if (matchIdRef.current !== matchId) return;
        const result = await response.json().catch(() => null) as { replies?: Array<{ characterId: string; text: string }> } | null;
        if (matchIdRef.current !== matchId) return;
        const reply = response.ok && result?.replies?.[0]
          ? result.replies[0]
          : { characterId, text: offlineReply(characterId, prompt) };
        const character = getCompanionCharacter(reply.characterId);
        addChat([{
          id: makeId(`ek-ai-${reply.characterId}`),
          speakerId: reply.characterId,
          speakerName: character?.name ?? reply.characterId,
          text: reply.text,
          kind: "ai",
        }]);
        markEKSpeech(relationshipMemoriesRef.current, reply.characterId, intent);
        enqueueVoice(reply.characterId, reply.text, autoSpeech);
      } finally {
        if (matchIdRef.current === matchId) setIsChatResponding(false);
      }
    }).catch(() => {
      if (matchIdRef.current === matchId) setIsChatResponding(false);
    });
  }, [addChat, enqueueVoice, keys.minimaxApiKey, selectedIds]);

  const reactionSpeaker = useCallback((event: EKGameEvent, current: EKSnapshot) => {
    if (selectedIds.includes(event.actorId)) return event.actorId;
    const target = event.targetIds.find((id) => selectedIds.includes(id));
    if (target) return target;
    return selectedIds[(current.turn + event.text.length) % selectedIds.length];
  }, [selectedIds]);

  const publishEvents = useCallback((events: EKGameEvent[], current: EKSnapshot | null) => {
    if (!current || events.length === 0) return;
    rememberEKEvents(relationshipMemoriesRef.current, events, HUMAN_ID);
    const summary = events.map((event) => event.text).join(" · ");
    setLatestEvent(summary);
    addChat([{
      id: makeId("ek-event"),
      speakerId: "director",
      speakerName: "炸弹猫播报",
      text: summary,
      kind: "event",
    }]);
    const priority = [...events].reverse().find((event) => event.kind === "game-win")
      ?? [...events].reverse().find((event) => event.kind === "explode")
      ?? [...events].reverse().find((event) => event.kind === "defuse")
      ?? [...events].reverse().find((event) => event.kind === "attack")
      ?? [...events].reverse().find((event) => event.kind === "favor" || event.kind === "cat-combo")
      ?? [...events].reverse().find((event) => event.kind === "nope")
      ?? [...events].reverse().find((event) => event.kind === "see-future");
    const overdue = current.turn - lastReactionTurnRef.current >= 3
      ? [...events].reverse().find((event) => event.kind === "play")
      : undefined;
    const reactionEvent = priority ?? overdue;
    if (!reactionEvent) return;
    lastReactionTurnRef.current = current.turn;
    const speaker = reactionSpeaker(reactionEvent, current);
    const intent = chooseEKEventIntent(speaker, reactionEvent, HUMAN_ID);
    requestReply(
      speaker,
      `已经发生的公开事件：${reactionEvent.text}\n当前公开牌桌：${describeEKSnapshot(current)}\n只能评价已发生的事，不能替玩家选牌，也不能声称知道任何人的隐藏手牌。`,
      intent,
      true,
    );
  }, [addChat, reactionSpeaker, requestReply]);

  const startGame = useCallback(() => {
    const total = selectedIds.length + 1;
    if (total < EK_PLAYER_RANGE.min || total > EK_PLAYER_RANGE.max) return;
    matchIdRef.current += 1;
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    audioRef.current?.pause();
    engineRef.current = new CompanionExplodingKittensEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createEKRelationshipMemories(selectedIds);
    const next = engineRef.current.snapshot();
    const welcome: ChatEntry[] = [{
      id: makeId("ek-welcome"),
      speakerId: "director",
      speakerName: "炸弹猫播报",
      text: `${total} 人炸弹猫开局。${selectedCharacters.map((c) => c.name).join("、")}陪你；先抽到爆炸猫又没拆弹的人出局，最后活着的人赢。`,
      kind: "director",
    }];
    chatRef.current = welcome;
    setChat(welcome);
    setLatestEvent("先手是你，回合内可任意出牌或直接抽 1 张。");
    lastReactionTurnRef.current = -2;
    setSnapshot(next);
  }, [selectedCharacters, selectedIds]);

  const restart = useCallback(() => {
    const total = selectedIds.length + 1;
    if (total < EK_PLAYER_RANGE.min || total > EK_PLAYER_RANGE.max) return;
    matchIdRef.current += 1;
    audioRef.current?.pause();
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    engineRef.current = new CompanionExplodingKittensEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createEKRelationshipMemories(selectedIds);
    const message: ChatEntry = { id: makeId("ek-restart"), speakerId: "director", speakerName: "炸弹猫播报", text: "新一局炸弹猫。所有手牌和弃牌重新洗过，还是你先手。", kind: "director" };
    chatRef.current = [message];
    setChat([message]);
    setLatestEvent("新的一局，回合内可任意出牌或直接抽 1 张。");
    lastReactionTurnRef.current = -2;
    refresh();
  }, [refresh, selectedIds]);

  const playLegal = useCallback((legal: EKLegalAction) => {
    try {
      const engine = engineRef.current;
      if (!engine) return;
      if (legal.kind === "draw") {
        const events = engine.draw();
        const next = refresh();
        publishEvents(events, next);
        return;
      }
      // Resolve the EKAction kind. legalActionsFor should always set
      // actionKind, but fall back to cardKind (cat -> cat-combo) for safety.
      const actionKind: EKAction["kind"] | undefined =
        legal.actionKind
        ?? (legal.cardKind === "cat" ? "cat-combo" : (legal.cardKind as EKAction["kind"] | undefined));
      if (!actionKind) {
        // Should be impossible now that legalActionsFor sets actionKind
        // explicitly. Throw rather than silently no-op so a future
        // regression is visible in dev.
        throw new Error("无法识别这张牌的 actionKind");
      }
      const action: Omit<EKAction, "id" | "resolved" | "cancelled" | "nopeChain"> = {
        kind: actionKind,
        actorId: HUMAN_ID,
        cardIds: [legal.cardId!],
        targetId: legal.targetId,
        comboSize: legal.comboSize,
        namedKind: legal.namedKind,
      };
      const events = engine.playCard(action);
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "这个行动现在不能执行。");
    }
  }, [publishEvents, refresh]);

  const pickCard = useCallback((card: EKCard) => {
    const engine = engineRef.current;
    if (!engine || !snapshot) return;
    const legal = snapshot.legalActions.find((action) => action.kind === "play-card" && action.cardId === card.id);
    if (!legal) return;
    if (legal.targetId === undefined) {
      playLegal(legal);
      return;
    }
    setPendingLegal(legal);
    setPendingTarget(null);
  }, [playLegal, snapshot]);

  const confirmComboTarget = useCallback(() => {
    if (!pendingLegal || !pendingTarget) return;
    const finalLegal: EKLegalAction = { ...pendingLegal, targetId: pendingTarget };
    playLegal(finalLegal);
  }, [pendingLegal, pendingTarget, playLegal]);

  const drawForHuman = useCallback(() => {
    playLegal({ kind: "draw", endsWithoutDraw: false });
  }, [playLegal]);

  const insertExplodingKitten = useCallback((position: number) => {
    try {
      const events = engineRef.current?.insertExplodingKitten(HUMAN_ID, position) ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "无法塞回爆炸猫。");
    }
  }, [publishEvents, refresh]);

  const chooseStolenCardForHuman = useCallback((cardId: string) => {
    try {
      const events = engineRef.current?.chooseStolenCard(HUMAN_ID, cardId) ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "交牌失败。");
    }
  }, [publishEvents, refresh]);

  const pickFromDiscardForHuman = useCallback((cardId: string) => {
    try {
      const events = engineRef.current?.pickFromDiscard(HUMAN_ID, cardId) ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "挑牌失败。");
    }
  }, [publishEvents, refresh]);

  const stepBot = useCallback(() => {
    if (!engineRef.current) return;
    if (!snapshot || snapshot.phase !== "play" || snapshot.currentPlayerId === HUMAN_ID) return;
    // Note: do NOT short-circuit on needsDefuseInsertion. When a bot is the
    // current player mid-insertion, runBotTurn() routes to
    // botInsertExplodingKitten() and resolves the deadlock itself.
    try {
      const events = engineRef.current.runBotTurn();
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(`机器人回合失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  }, [publishEvents, refresh, snapshot]);

  const toggleAiPaused = useCallback(() => {
    setAiPaused((current) => !current);
  }, []);

  useEffect(() => {
    if (!snapshot || snapshot.phase !== "play" || snapshot.currentPlayerId === HUMAN_ID) {
      setIsBotRunning(false);
      return;
    }
    // The bot can resolve its own defuse insertion via runBotTurn(), so we
    // never short-circuit on needsDefuseInsertion here either — the timer
    // keeps ticking until it's the human's turn.
    if (aiPaused) {
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
    }, 320);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [publishEvents, refresh, snapshot, aiPaused]);

  const sendChat = useCallback(() => {
    if (!snapshot || !human || !draft.trim() || isChatResponding) return;
    const text = draft.trim();
    addChat([{ id: makeId("ek-human"), speakerId: HUMAN_ID, speakerName: human.name, text, kind: "human" }]);
    setDraft("");
    const mentioned = selectedCharacters.filter((character) => text.includes(character.name)).map((character) => character.id);
    const responder = mentioned[0] ?? selectedIds[(snapshot.turn + chatRef.current.length) % Math.max(1, selectedIds.length)];
    rememberEKPlayerLine(relationshipMemoriesRef.current, [responder], text);
    const intent = chooseEKChatIntent(responder, text);
    requestReply(
      responder,
      `玩家在炸弹猫牌桌上说：${text}\n当前公开牌桌：${describeEKSnapshot(snapshot)}\n直接回应玩家；不能替玩家选牌或声称知道任何人的隐藏手牌。`,
      intent,
      false,
    );
  }, [addChat, draft, human, isChatResponding, requestReply, selectedCharacters, selectedIds, snapshot]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < EK_PLAYER_RANGE.max - 1 ? [...current, id] : current);
  }, []);

  const cardById = useMemo(() => {
    const map = new Map<string, EKCard>();
    if (snapshot) for (const card of snapshot.humanHand) map.set(card.id, card);
    return map;
  }, [snapshot]);

  const peekCards = snapshot?.humanPeek && !peekDismissed ? snapshot.humanPeek : null;
  const insertionOptions = snapshot?.defuseInsertionOptions ?? [];
  const needsInsertion = Boolean(snapshot?.needsDefuseInsertion)
    && snapshot?.phase === "play"
    && snapshot?.currentPlayerId === HUMAN_ID;
  // Picker states: 2-cat steals from the target, 5-cat picks from discard.
  const mustPickStolenCard = Boolean(snapshot?.pendingCatStealChoice)
    && snapshot?.pendingCatStealChoice?.targetId === HUMAN_ID
    && snapshot?.phase === "play";
  const mustPickFromDiscard = Boolean(snapshot?.pendingDiscardPick)
    && snapshot?.pendingDiscardPick?.actorId === HUMAN_ID
    && snapshot?.phase === "play";
  const isHumanTurn = snapshot?.phase === "play"
    && snapshot.currentPlayerId === HUMAN_ID
    && !needsInsertion
    && !mustPickStolenCard
    && !mustPickFromDiscard;
  const showPeek = Boolean(peekCards && peekCards.length > 0);

  if (!snapshot) {
    return (
      <main className={styles.setupPage}>
        <header className={styles.setupHeader}>
          <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
          <div><span>AI BOARD COMPANION</span><h1>炸弹猫</h1><p>选择 1-4 位 AI 陪玩（2-5 人局）</p></div>
          <strong>{selectedIds.length + 1} / {EK_PLAYER_RANGE.max}</strong>
        </header>
        <section className={styles.setupPanel}>
          <div className={styles.setupCopy}>
            <Shuffle size={44} weight="duotone" />
            <h2>今晚把炸弹猫传给谁？</h2>
            <p>规则、隐藏手牌、拆弹顺序和 AI 行动全部由本地引擎处理。模型只看到公开出牌、弃牌和聊天记录，不替玩家选牌。</p>
          </div>
          <div className={styles.characterGrid}>
            {COMPANION_CHARACTERS.map((character) => {
              const selected = selectedIds.includes(character.id);
              return (
                <button
                  key={character.id}
                  type="button"
                  className={selected ? styles.characterSelected : ""}
                  onClick={() => toggleSelection(character.id)}
                >
                  <span style={{ "--character-color": character.color } as CSSProperties}>{character.name.slice(-1)}</span>
                  <strong>{character.name}</strong>
                  <small>{character.relationLabel}</small>
                  <p>{character.archetype}</p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.startButton}
            disabled={selectedIds.length < EK_PLAYER_RANGE.min - 1 || selectedIds.length > EK_PLAYER_RANGE.max - 1}
            onClick={startGame}
          >
            <Play size={20} weight="fill" />开始发牌
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.gamePage}>
      <header className={styles.gameHeader}>
        <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
        <div><h1>炸弹猫</h1><p>经典 54 张牌 · 抽到爆炸猫又没拆弹就出局</p></div>
        <div className={styles.headerStatus}>第 {snapshot.turn} 行动 · 牌堆 {snapshot.deckCount} 张{snapshot.attackCarry > 1 ? " · 攻击连环" : ""}</div>
        <button
          type="button"
          className={aiPaused ? styles.aiPausedButton : styles.aiAutoButton}
          onClick={toggleAiPaused}
          aria-pressed={aiPaused}
        >
          {aiPaused ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
          {aiPaused ? "AI 暂停" : "AI 自动"}
        </button>
        <button
          type="button"
          className={styles.stepButton}
          onClick={stepBot}
          disabled={!aiPaused || snapshot.currentPlayerId === HUMAN_ID || snapshot.phase !== "play"}
        >
          <CaretRight size={20} weight="bold" />下一步
        </button>
        <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>
          {voiceEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}{voiceEnabled ? "语音开" : "语音关"}
        </button>
        <button type="button" onClick={restart}>重新开局</button>
      </header>

      <div className={styles.gameLayout}>
        <section className={styles.tablePanel}>
          <div className={styles.playerGrid}>
            {snapshot.players.map((player) => {
              const character = getCompanionCharacter(player.id);
              return (
                <article
                  key={player.id}
                  className={`${styles.playerSeat} ${player.isCurrent ? styles.currentSeat : ""} ${!player.alive ? styles.eliminatedSeat : ""}`}
                >
                  <span className={styles.avatar} style={{ "--character-color": character?.color ?? "#7dd3fc" } as CSSProperties}>
                    {player.isHuman ? "你" : player.name.slice(-1)}
                  </span>
                  <div>
                    <strong>{player.name}</strong>
                    <small>
                      {player.alive
                        ? player.isCurrent
                          ? "正在行动"
                          : `手牌 ${player.handCount} 张${player.hasDefuse ? " · 有拆弹" : ""}`
                        : "已炸"}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.tableCenter}>
            <div className={styles.deckStack}>
              <span className={styles.deckTop}>💥</span>
              <strong>{snapshot.deckCount}</strong>
              <small>牌堆</small>
            </div>
            <div className={styles.discardBoard}>
              {snapshot.discardPile.length === 0
                ? <em>弃牌堆暂无</em>
                : snapshot.discardPile.slice(-8).map((card) => (
                    <span key={card.id} className={styles.discardPill} style={{ "--card-tone": card.tone } as CSSProperties}>
                      <span>{card.symbol}</span>{card.name}
                    </span>
                  ))}
            </div>
          </div>

          <div className={styles.eventRibbon}>{isBotRunning ? "AI 正在本地选择行动……" : latestEvent}</div>

          {showPeek ? (
            <div className={styles.peekPanel}>
              <header>
                <Eye size={18} />
                <strong>只有你看到：牌堆顶部 3 张</strong>
                <button type="button" onClick={() => setPeekDismissed(true)} aria-label="关闭"><X size={16} /></button>
              </header>
              <div className={styles.peekCards}>
                {peekCards!.map((card, index) => (
                  <div key={`${card.id}-${index}`} className={styles.peekCard}>
                    <span className={styles.peekOrder}>第 {index + 1} 张</span>
                    <CardBack card={card} peek />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {needsInsertion ? (
            <div className={styles.insertionPanel}>
              <strong>你拆掉了一只爆炸猫</strong>
              <p>把它偷偷塞回牌堆的任意位置（0 = 顶部）。</p>
              <div className={styles.insertionGrid}>
                {insertionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.insertionButton}
                    onClick={() => insertExplodingKitten(option)}
                  >
                    {option === 0 ? "顶部" : `倒数第 ${option} 张`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mustPickStolenCard ? (
            <div className={styles.pickerPanel}>
              <strong>有人用 2 张猫牌勒索你</strong>
              <p>从你手牌里交出 1 张——规则规定由你决定交哪张。</p>
              <div className={styles.pickerGrid}>
                {snapshot.humanHand.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={styles.pickerButton}
                    style={{ "--card-tone": card.tone } as CSSProperties}
                    onClick={() => chooseStolenCardForHuman(card.id)}
                  >
                    <span className={styles.pickerSymbol}>{card.symbol}</span>
                    <span>{card.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mustPickFromDiscard ? (
            <div className={styles.pickerPanel}>
              <strong>用 5 张猫牌从弃牌堆里挑 1 张</strong>
              <p>规则规定由你决定拿哪张。</p>
              <div className={styles.pickerGrid}>
                {snapshot.discardPile.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={styles.pickerButton}
                    style={{ "--card-tone": card.tone } as CSSProperties}
                    onClick={() => pickFromDiscardForHuman(card.id)}
                  >
                    <span className={styles.pickerSymbol}>{card.symbol}</span>
                    <span>{card.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isHumanTurn ? (
            <>
              <div className={styles.handArea}>
                <div className={styles.handHeading}>
                  <span>你的手牌</span>
                  <small>可打出动作牌或直接抽 1 张（攻击 / 跳过 也会结束本回合不抽）</small>
                </div>
                <div className={styles.handCards}>
                  {snapshot.humanHand.map((card) => {
                    const legal = snapshot.legalActions.find((action) => action.kind === "play-card" && action.cardId === card.id);
                    return (
                      <CardBack
                        key={card.id}
                        card={card}
                        selected={pendingLegal?.cardId === card.id}
                        playable={Boolean(legal)}
                        onClick={legal ? () => pickCard(card) : undefined}
                      />
                    );
                  })}
                </div>
              </div>

              {pendingLegal ? (
                <div className={styles.targetPanel}>
                  <strong>选择这张牌的目标</strong>
                  <div className={styles.targetRow}>
                    {snapshot.players.filter((p) => p.alive && p.id !== HUMAN_ID && p.handCount > 0).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={pendingTarget === p.id ? styles.targetSelected : ""}
                        onClick={() => setPendingTarget(p.id)}
                      >
                        {p.name}（{p.handCount} 张）
                      </button>
                    ))}
                  </div>
                  {pendingLegal.comboSize === 3 && pendingTarget ? (
                    <div className={styles.namedRow}>
                      <strong>要对方哪张牌</strong>
                      <div className={styles.targetRow}>
                        {(["defuse", "attack", "see-future", "shuffle", "skip", "nope", "favor"] as const).map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            className={pendingLegal.namedKind === kind ? styles.targetSelected : ""}
                            onClick={() => setPendingLegal({ ...pendingLegal, namedKind: kind })}
                          >
                            {kind === "defuse" ? "拆弹" : kind === "attack" ? "攻击" : kind === "see-future" ? "预见" : kind === "shuffle" ? "洗牌" : kind === "skip" ? "跳过" : kind === "nope" ? "否决" : "索要"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className={styles.targetActions}>
                    <button type="button" onClick={() => { setPendingLegal(null); setPendingTarget(null); }}>取消</button>
                    <button
                      type="button"
                      className={styles.confirmButton}
                      disabled={!pendingTarget || (pendingLegal.comboSize === 3 && !pendingLegal.namedKind)}
                      onClick={confirmComboTarget}
                    >
                      确认打出
                    </button>
                  </div>
                </div>
              ) : null}

              {!pendingLegal ? (
                <div className={styles.drawBar}>
                  <button
                    type="button"
                    className={styles.drawButton}
                    disabled={!snapshot.canDraw}
                    onClick={drawForHuman}
                  >
                    抽 1 张牌
                  </button>
                  {!snapshot.canDraw ? <small>攻击 / 跳过 后不再抽牌，回合直接结束</small> : null}
                </div>
              ) : null}
            </>
          ) : null}

          {snapshot.phase === "game-over" ? (
            <div className={styles.gameOverOverlay}>
              <h2>整局结束</h2>
              <p>{snapshot.winnerId ? `${snapshot.players.find((player) => player.id === snapshot.winnerId)?.name} 是最后存活的人！` : "没有赢家。"}</p>
              <button type="button" onClick={restart}>再来一局</button>
            </div>
          ) : null}
        </section>

        <aside className={styles.chatPanel}>
          <header>
            <ChatCircleDots size={24} />
            <div>
              <h2>炸弹猫聊天</h2>
              <p>模型只看到公开出牌和弃牌</p>
            </div>
            <span>{chat.length} 条</span>
          </header>
          <div className={styles.chatFeed} ref={feedRef}>
            {chat.map((entry) => {
              const character = getCompanionCharacter(entry.speakerId);
              return (
                <article
                  key={entry.id}
                  className={`${styles.chatEntry} ${entry.kind === "human" ? styles.humanEntry : ""} ${entry.kind === "event" || entry.kind === "director" ? styles.eventEntry : ""}`}
                >
                  <span
                    className={styles.chatAvatar}
                    style={{ "--character-color": character?.color ?? "#94a3b8" } as CSSProperties}
                  >
                    {entry.kind === "event" || entry.kind === "director" ? "炸" : entry.kind === "human" ? "你" : entry.speakerName.slice(-1)}
                  </span>
                  <div>
                    <strong>{entry.speakerName}</strong>
                    <p>{entry.text}</p>
                  </div>
                </article>
              );
            })}
            {isChatResponding ? <div className={styles.thinking}>她正在想怎么回你……</div> : null}
          </div>
          <div className={styles.composer}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="直接聊天，或点名一位陪玩……"
              maxLength={300}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }}
            />
            <div>
              <VoiceRecorder disabled={isChatResponding} isNight sttApiKey={keys.siliconflowApiKey} sttEnabled holdToTalk onTranscript={setDraft} />
              <button type="button" onClick={sendChat} disabled={!draft.trim() || isChatResponding}>
                <PaperPlaneTilt size={18} />发送
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
