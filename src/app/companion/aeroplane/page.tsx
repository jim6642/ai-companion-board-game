"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Airplane, ArrowCounterClockwise, PaperPlaneTilt, SpeakerHigh, SpeakerSlash, UsersThree } from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import { COMPANION_CHARACTERS, getCompanionCharacter, type CompanionCharacter } from "@/lib/companion/characters";
import {
  chooseAeroplaneChatIntent,
  chooseAeroplaneEventIntent,
  createAeroplaneRelationshipMemories,
  markAeroplaneSpeech,
  rememberAeroplaneEvents,
  rememberAeroplanePlayerLine,
  type AeroplaneDialogueIntent,
  type AeroplaneRelationshipMemories,
} from "@/lib/companion/aeroplane-dialogue";
import { prepareTextForTts } from "@/lib/companion/speech-text";
import {
  AEROPLANE_SHORTCUT,
  AEROPLANE_COLOR_ORDER,
  AEROPLANE_SHORTCUT_ROUTES,
  AEROPLANE_START_OFFSETS,
  CompanionAeroplaneEngine,
  aeroplaneTrackCellColor,
  type AeroplaneColor,
  type AeroplaneGameEvent,
  type AeroplanePlayerSpec,
  type AeroplanePlayerView,
  type AeroplaneSnapshot,
  type AeroplaneTokenView,
} from "@/lib/aeroplane/engine";
import {
  aeroplaneTextNeedsDetailedContext,
  describeAeroplaneSnapshot,
  describeDetailedAeroplaneSnapshot,
} from "@/lib/aeroplane/context";
import styles from "./aeroplane.module.css";

interface ChatEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  kind: "event" | "human" | "ai" | "director";
}

interface RollFeedback {
  actorName: string;
  dice: number;
  message: string;
}

interface ShortcutFeedback {
  eventId: string;
  tokenId: string;
  color: AeroplaneColor;
  actorName: string;
  showRule: boolean;
}

type ReactionFrequency = "quiet" | "balanced" | "lively";

const HUMAN_ID = "human";
const PLAYER_NAME_KEY = "companion.player_name";
const SESSION_KEYS = {
  minimaxApiKey: "companion.minimax_api_key",
  minimaxGroupId: "companion.minimax_group_id",
  siliconflowApiKey: "companion.siliconflow_api_key",
} as const;

const COLOR_LABELS: Record<AeroplaneColor, string> = {
  red: "红方",
  blue: "蓝方",
  yellow: "黄方",
  green: "绿方",
};

const COLOR_HEX: Record<AeroplaneColor, string> = {
  red: "#f25f75",
  blue: "#5794e8",
  yellow: "#f0b53c",
  green: "#43b98a",
};

const COLOR_ORDER = AEROPLANE_COLOR_ORDER;
const START_OFFSETS = AEROPLANE_START_OFFSETS;
const DETAILED_CONTEXT_REFRESH_TURNS = 12;
const REACTION_FREQUENCIES: Record<ReactionFrequency, { label: string; cooldownTurns: number }> = {
  quiet: { label: "少", cooldownTurns: 8 },
  balanced: { label: "适中", cooldownTurns: 5 },
  lively: { label: "多", cooldownTurns: 3 },
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readPlayerName() {
  if (typeof window === "undefined") return "你";
  const raw = localStorage.getItem(PLAYER_NAME_KEY) || localStorage.getItem("aicb_human_name") || "你";
  try {
    const parsed = JSON.parse(raw) as unknown;
    return (typeof parsed === "string" ? parsed : raw).trim().slice(0, 12) || "你";
  } catch {
    return raw.trim().slice(0, 12) || "你";
  }
}

function polarPoint(index: number, radius = 44) {
  const angle = (-90 + (index * 360) / 52) * Math.PI / 180;
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

const SHORTCUT_ROUTES = AEROPLANE_SHORTCUT_ROUTES.map((route) => {
  const entryIndex = route.entryTrackIndex;
  const exitIndex = route.exitTrackIndex;
  return {
    color: route.color,
    entryIndex,
    exitIndex,
    entry: polarPoint(entryIndex),
    exit: polarPoint(exitIndex),
  };
});

function homeLanePoint(color: AeroplaneColor, progress: number) {
  const entry = polarPoint((START_OFFSETS[color] + 50) % 52);
  const step = Math.min(5, Math.max(1, progress - 50));
  const ratio = step / 6;
  return { x: entry.x + (50 - entry.x) * ratio, y: entry.y + (50 - entry.y) * ratio };
}

function tokenPoint(player: AeroplanePlayerView, token: AeroplaneTokenView) {
  const playerIndex = COLOR_ORDER.indexOf(player.color);
  if (token.status === "track" && token.trackIndex !== null) return polarPoint(token.trackIndex);
  if (token.status === "home-lane") return homeLanePoint(player.color, token.progress);
  if (token.status === "finished") {
    const angle = ((playerIndex * 90 - 135) * Math.PI) / 180;
    const spread = 2.2 + token.number * 0.7;
    return { x: 50 + Math.cos(angle) * spread, y: 50 + Math.sin(angle) * spread };
  }
  const centers = [
    { x: 9.5, y: 9.5 },
    { x: 90.5, y: 9.5 },
    { x: 90.5, y: 90.5 },
    { x: 9.5, y: 90.5 },
  ];
  const offsets = [{ x: -3.1, y: -3.1 }, { x: 3.1, y: -3.1 }, { x: -3.1, y: 3.1 }, { x: 3.1, y: 3.1 }];
  const center = centers[playerIndex];
  const offset = offsets[token.number - 1];
  return { x: center.x + offset.x, y: center.y + offset.y };
}

function offlineReply(characterId: string, context: string) {
  const replies: Record<string, string> = {
    "lin-xia": context.includes("撞回") ? "先别急，我知道被撞回去很气。下一次六点出来，我们再追。" : "这局还早，你稳稳走就好，我会一直看着你的进度。",
    "su-yao": context.includes("飞了") ? "运气不错嘛。先说好，待会被我追上可别说我针对你。" : "你掷骰子的时候也太认真了吧，我都快替你紧张了。",
    "gu-qinglan": context.includes("撞回") ? "这次撞机收益很高，场上的领先关系已经变了。" : "先把能进终点的飞机送进去，别为了热闹把优势放在外面。",
    "tang-guo": context.includes("撞回") ? "好啊，你还真舍得撞我。记住了，我下一架就追着你飞。" : "快点快点，我可不会因为喜欢你就故意放慢。",
    "chen-hang": "兄弟，飞行棋就别装运筹帷幄了，六点掷不出来谁都得在机库蹲着。",
    "xiao-man": "哥，你那架飞机都快成全桌重点保护对象了，别一得意又送回机库。",
    "shen-ning": "别只盯着一架飞机跑，适当分散风险，至少被撞时不会整轮都停住。",
  };
  return replies[characterId] ?? "这一手有点意思，继续看。";
}

function makeSpecs(characterIds: string[]): AeroplanePlayerSpec[] {
  const colors: AeroplaneColor[] = ["blue", "yellow", "green"];
  return [
    { id: HUMAN_ID, name: readPlayerName(), color: "red", isHuman: true },
    ...characterIds.map((id, index) => {
      const character = getCompanionCharacter(id)!;
      return { id, name: character.name, color: colors[index] };
    }),
  ];
}

export default function CompanionAeroplanePage() {
  const router = useRouter();
  const engineRef = useRef<CompanionAeroplaneEngine | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<AeroplaneSnapshot | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [rollFeedback, setRollFeedback] = useState<RollFeedback | null>(null);
  const [shortcutFeedback, setShortcutFeedback] = useState<ShortcutFeedback | null>(null);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [reactionFrequency, setReactionFrequency] = useState<ReactionFrequency>("balanced");
  const [keys, setKeys] = useState({ minimaxApiKey: "", minimaxGroupId: "", siliconflowApiKey: "" });
  const chatRef = useRef<ChatEntry[]>([]);
  const relationshipMemoriesRef = useRef<AeroplaneRelationshipMemories>({});
  const reactionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingVoiceCountRef = useRef(0);
  const lastAutoReactionTurnRef = useRef(-REACTION_FREQUENCIES.balanced.cooldownTurns);
  const lastDetailedContextTurnRef = useRef(-DETAILED_CONTEXT_REFRESH_TURNS);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Incremented every time we (re)start a match. Async chains created
  // before the bump see a stale id and bail out without touching the
  // new match's chat, voice queue, or chatResponding state. Without
  // this guard, a long bot turn whose /api/companion/respond reply
  // arrives AFTER the player hits "重开整场" / "换陪玩" would pollute
  // the new match's UI.
  const matchIdRef = useRef(0);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const rollFeedbackTimerRef = useRef<number | null>(null);
  const shortcutFeedbackTimerRef = useRef<number | null>(null);
  const hasShownShortcutRuleRef = useRef(false);

  const selectedCharacters = useMemo(
    () => selectedIds.map((id) => getCompanionCharacter(id)).filter((item): item is CompanionCharacter => Boolean(item)),
    [selectedIds],
  );
  const human = snapshot?.players.find((player) => player.id === HUMAN_ID);
  const currentPlayer = snapshot?.players.find((player) => player.id === snapshot.currentPlayerId);
  const winner = snapshot?.players.find((player) => player.id === snapshot.winnerId);
  const activeShortcutRoute = shortcutFeedback
    ? SHORTCUT_ROUTES.find((route) => route.color === shortcutFeedback.color)
    : undefined;

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
    if (rollFeedbackTimerRef.current !== null) window.clearTimeout(rollFeedbackTimerRef.current);
    if (shortcutFeedbackTimerRef.current !== null) window.clearTimeout(shortcutFeedbackTimerRef.current);
  }, []);

  const clearRollFeedback = useCallback(() => {
    if (rollFeedbackTimerRef.current !== null) {
      window.clearTimeout(rollFeedbackTimerRef.current);
      rollFeedbackTimerRef.current = null;
    }
    setRollFeedback(null);
  }, []);

  const clearShortcutFeedback = useCallback((resetFirstTrigger = false) => {
    if (shortcutFeedbackTimerRef.current !== null) {
      window.clearTimeout(shortcutFeedbackTimerRef.current);
      shortcutFeedbackTimerRef.current = null;
    }
    if (resetFirstTrigger) hasShownShortcutRuleRef.current = false;
    setShortcutFeedback(null);
  }, []);

  const holdSkippedRoll = useCallback((events: AeroplaneGameEvent[], duration: number) => {
    const roll = events.find((event) => event.kind === "roll" && typeof event.dice === "number");
    const pass = events.find((event) => event.kind === "pass");
    if (!roll?.dice || !pass) return false;
    if (rollFeedbackTimerRef.current !== null) window.clearTimeout(rollFeedbackTimerRef.current);
    setRollFeedback({
      actorName: roll.actorName,
      dice: roll.dice,
      message: pass.kind === "pass" && pass.text.includes("没有能走") ? "没有能走的飞机，本轮跳过" : pass.text,
    });
    rollFeedbackTimerRef.current = window.setTimeout(() => {
      rollFeedbackTimerRef.current = null;
      setRollFeedback(null);
    }, duration);
    return true;
  }, []);

  const addChat = useCallback((entries: ChatEntry[]) => {
    setChat((previous) => {
      const next = [...previous, ...entries].slice(-90);
      chatRef.current = next;
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    const next = engineRef.current?.snapshot() ?? null;
    setSnapshot(next);
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
        // If the player restarted or switched companions mid-game, drop
        // the queued line entirely instead of playing a stale TTS clip.
        if (matchIdRef.current !== matchId) return;
        return playVoice(characterId, text);
      })
      .catch(() => undefined)
      .finally(() => { pendingVoiceCountRef.current = Math.max(0, pendingVoiceCountRef.current - 1); });
  }, [playVoice]);

  const requestReplies = useCallback((
    characterIds: string[],
    prompt: string,
    autoSpeech = false,
    speechIntents: Partial<Record<string, AeroplaneDialogueIntent>> = {},
  ) => {
    const allowed = characterIds.filter((id) => selectedIds.includes(id)).slice(0, 2);
    const matchId = matchIdRef.current;
    reactionQueueRef.current = reactionQueueRef.current.then(async () => {
      if (allowed.length === 0) return;
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
            mode: "aeroplane",
            playerText: prompt,
            characterIds: allowed,
            history: chatRef.current.map(({ speakerId, speakerName, text }) => ({ speakerId, speakerName, text })),
            speechIntents,
            relationshipMemories: Object.fromEntries(
              allowed.map((characterId) => [characterId, relationshipMemoriesRef.current[characterId]]),
            ),
          }),
        });
        // The fetch may have raced a restart; drop the result so the new
        // match's chat feed stays clean and we don't enqueue a stale TTS
        // line into the new match's voice queue.
        if (matchIdRef.current !== matchId) return;
        const result = await response.json().catch(() => null) as { replies?: Array<{ characterId: string; text: string }> } | null;
        if (matchIdRef.current !== matchId) return;
        const replies = response.ok && result?.replies?.length
          ? result.replies
          : allowed.map((characterId) => ({ characterId, text: offlineReply(characterId, prompt) }));
        const entries = replies.map((reply) => ({
          id: makeId(`flight-ai-${reply.characterId}`),
          speakerId: reply.characterId,
          speakerName: getCompanionCharacter(reply.characterId)?.name ?? reply.characterId,
          text: reply.text,
          kind: "ai" as const,
        }));
        addChat(entries);
        replies.forEach((reply) => {
          markAeroplaneSpeech(
            relationshipMemoriesRef.current,
            reply.characterId,
            speechIntents[reply.characterId] ?? "quick-reaction",
          );
          enqueueVoice(reply.characterId, reply.text, autoSpeech);
        });
      } finally {
        if (matchIdRef.current === matchId) setIsChatResponding(false);
      }
    }).catch(() => {
      if (matchIdRef.current === matchId) setIsChatResponding(false);
    });
  }, [addChat, enqueueVoice, keys.minimaxApiKey, selectedIds]);

  const reactionSpeaker = useCallback((event: AeroplaneGameEvent, current: AeroplaneSnapshot) => {
    if (event.actorId !== HUMAN_ID && selectedIds.includes(event.actorId)) return event.actorId;
    const target = event.targetIds.find((id) => selectedIds.includes(id));
    if (target) return target;
    return selectedIds[current.turn % selectedIds.length];
  }, [selectedIds]);

  const publishEvents = useCallback((events: AeroplaneGameEvent[], current: AeroplaneSnapshot | null) => {
    if (!current || events.length === 0) return;
    rememberAeroplaneEvents(relationshipMemoriesRef.current, events, HUMAN_ID);
    const shortcutEvent = events.find((event) => event.jumpType === "shortcut" && event.tokenId);
    if (shortcutEvent?.tokenId) {
      const owner = current.players.find((player) => player.tokens.some((token) => token.id === shortcutEvent.tokenId));
      if (owner) {
        if (shortcutFeedbackTimerRef.current !== null) window.clearTimeout(shortcutFeedbackTimerRef.current);
        const showRule = !hasShownShortcutRuleRef.current;
        hasShownShortcutRuleRef.current = true;
        setShortcutFeedback({ eventId: shortcutEvent.id, tokenId: shortcutEvent.tokenId, color: owner.color, actorName: shortcutEvent.actorName, showRule });
        shortcutFeedbackTimerRef.current = window.setTimeout(() => {
          shortcutFeedbackTimerRef.current = null;
          setShortcutFeedback(null);
        }, showRule ? 3600 : 1300);
      }
    }
    const summary = events.map((event) => event.text).join(" ");
    addChat([{
      id: makeId("flight-event"),
      speakerId: "director",
      speakerName: "飞行播报",
      text: summary,
      kind: "event",
    }]);
    const winEvent = events.find((event) => event.kind === "win");
    const cooldownReady = current.turn - lastAutoReactionTurnRef.current >= REACTION_FREQUENCIES[reactionFrequency].cooldownTurns;
    const notable = cooldownReady
      ? [...events].reverse().find((event) => event.significant && (
          reactionFrequency === "lively"
          || event.actorId === HUMAN_ID
          || event.targetIds.includes(HUMAN_ID)
          || event.kind === "capture"
          || event.kind === "finish"
        ))
      : undefined;
    const silenceTurns = current.turn - lastAutoReactionTurnRef.current;
    const overdueFallback = silenceTurns >= REACTION_FREQUENCIES[reactionFrequency].cooldownTurns + 2
      ? [...events].reverse().find((event) => event.kind !== "roll") ?? events[events.length - 1]
      : undefined;
    const reactionEvent = winEvent ?? notable ?? overdueFallback;
    if (reactionEvent) {
      lastAutoReactionTurnRef.current = current.turn;
      const speaker = reactionSpeaker(reactionEvent, current);
      const intent = chooseAeroplaneEventIntent(speaker, reactionEvent, HUMAN_ID);
      const needsDetailedContext = reactionEvent.kind === "finish"
        || reactionEvent.kind === "win"
        || current.turn - lastDetailedContextTurnRef.current >= DETAILED_CONTEXT_REFRESH_TURNS;
      const publicContext = needsDetailedContext
        ? describeDetailedAeroplaneSnapshot(current)
        : describeAeroplaneSnapshot(current);
      if (needsDetailedContext) lastDetailedContextTurnRef.current = current.turn;
      requestReplies(
        [speaker],
        `公开飞行棋事件：${reactionEvent.text}\n当前公开局势：${publicContext}\n只评价已经发生的事件，可以得意、吐槽、安慰或挑衅，但不要替任何人决定下一步。`,
        true,
        { [speaker]: intent },
      );
    }
  }, [addChat, reactionFrequency, reactionSpeaker, requestReplies]);

  const startGame = useCallback(() => {
    if (selectedIds.length !== 3) return;
    matchIdRef.current += 1;
    // Drop any pending async replies/voices from a previous match.
    // The old chain is now orphaned: closures in it will see the
    // bumped matchId in the requestReplies/enqueueVoice guards and
    // bail out before touching state.
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    audioRef.current?.pause();
    clearRollFeedback();
    clearShortcutFeedback(true);
    engineRef.current = new CompanionAeroplaneEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createAeroplaneRelationshipMemories(selectedIds);
    const next = engineRef.current.snapshot();
    lastAutoReactionTurnRef.current = -REACTION_FREQUENCIES[reactionFrequency].cooldownTurns;
    lastDetailedContextTurnRef.current = -DETAILED_CONTEXT_REFRESH_TURNS;
    const welcome: ChatEntry[] = [{
      id: makeId("flight-welcome"),
      speakerId: "director",
      speakerName: "飞行播报",
      text: `四人到齐。你是红方，${selectedCharacters.map((character, index) => `${character.name}是${COLOR_LABELS[COLOR_ORDER[index + 1]]}`).join("，")}。掷出6点可以起飞和追加回合。`,
      kind: "director",
    }];
    chatRef.current = welcome;
    setChat(welcome);
    setSnapshot(next);
  }, [clearRollFeedback, clearShortcutFeedback, reactionFrequency, selectedCharacters, selectedIds]);

  const restart = useCallback(() => {
    matchIdRef.current += 1;
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    audioRef.current?.pause();
    clearRollFeedback();
    clearShortcutFeedback(true);
    engineRef.current = new CompanionAeroplaneEngine(makeSpecs(selectedIds));
    relationshipMemoriesRef.current = createAeroplaneRelationshipMemories(selectedIds);
    lastAutoReactionTurnRef.current = -REACTION_FREQUENCIES[reactionFrequency].cooldownTurns;
    lastDetailedContextTurnRef.current = -DETAILED_CONTEXT_REFRESH_TURNS;
    const nextChat: ChatEntry[] = [{ id: makeId("flight-restart"), speakerId: "director", speakerName: "飞行播报", text: "新的一局已经摆好。规则与机器人走棋仍全部在浏览器本地运行。", kind: "director" }];
    chatRef.current = nextChat;
    setChat(nextChat);
    setSnapshot(engineRef.current.snapshot());
  }, [clearRollFeedback, clearShortcutFeedback, reactionFrequency, selectedIds]);

  const rollHuman = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !engine.isHumanTurn()) return;
    const events = engine.rollCurrentPlayer();
    holdSkippedRoll(events, 1500);
    const next = refresh();
    publishEvents(events, next);
  }, [holdSkippedRoll, publishEvents, refresh]);

  const moveHuman = useCallback((tokenId: string) => {
    const engine = engineRef.current;
    if (!engine || !engine.isHumanTurn()) return;
    try {
      const events = engine.moveCurrentToken(tokenId);
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      addChat([{ id: makeId("flight-error"), speakerId: "director", speakerName: "规则提示", text: error instanceof Error ? error.message : "这架飞机现在不能移动。", kind: "director" }]);
    }
  }, [addChat, publishEvents, refresh]);

  useEffect(() => {
    if (!snapshot || snapshot.winnerId || snapshot.currentPlayerId === HUMAN_ID || rollFeedback) {
      setIsBotRunning(false);
      return;
    }
    setIsBotRunning(true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const events = engineRef.current?.runAutomatedTurn() ?? [];
        const next = refresh();
        publishEvents(events, next);
      } catch (error) {
        addChat([{ id: makeId("flight-bot-error"), speakerId: "director", speakerName: "规则提示", text: `机器人回合失败：${error instanceof Error ? error.message : "未知错误"}。请重新开局。`, kind: "director" }]);
      } finally {
        if (!cancelled) setIsBotRunning(false);
      }
    }, 620);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [addChat, publishEvents, refresh, rollFeedback, snapshot]);

  const sendChat = useCallback(() => {
    if (!snapshot || !human || !draft.trim() || isChatResponding) return;
    const text = draft.trim();
    addChat([{ id: makeId("flight-human"), speakerId: HUMAN_ID, speakerName: human.name, text, kind: "human" }]);
    setDraft("");
    const mentioned = selectedCharacters.filter((character) => text.includes(character.name)).map((character) => character.id);
    const wantsEveryone = /大家|你们|都说说/.test(text);
    const fallback = selectedIds[(snapshot.turn + chatRef.current.length) % selectedIds.length];
    const responders = mentioned.length > 0 ? mentioned.slice(0, 2) : wantsEveryone ? selectedIds.slice(0, 2) : [fallback];
    const characterNames = Object.fromEntries(selectedCharacters.map((character) => [character.id, character.name]));
    rememberAeroplanePlayerLine(relationshipMemoriesRef.current, responders, text, characterNames);
    const speechIntents = Object.fromEntries(
      responders.map((characterId) => [characterId, chooseAeroplaneChatIntent(characterId, text)]),
    ) as Partial<Record<string, AeroplaneDialogueIntent>>;
    const needsDetailedContext = aeroplaneTextNeedsDetailedContext(text);
    const publicContext = needsDetailedContext
      ? describeDetailedAeroplaneSnapshot(snapshot)
      : describeAeroplaneSnapshot(snapshot);
    if (needsDetailedContext) lastDetailedContextTurnRef.current = snapshot.turn;
    requestReplies(
      responders,
      `玩家在飞行棋桌上说：${text}\n当前公开局势：${publicContext}\n请直接回应玩家，也可以联系当前棋局。`,
      false,
      speechIntents,
    );
  }, [addChat, draft, human, isChatResponding, requestReplies, selectedCharacters, selectedIds, snapshot]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }, []);

  if (!snapshot) {
    return (
      <main className={styles.setupPage}>
        <header className={styles.setupHeader}>
          <button type="button" onClick={() => router.push("/companion")}>← 游戏大厅</button>
          <div><span>AI BOARD COMPANION</span><h1>云端航线 · 飞行棋</h1><p>先选择三位真正参与本局的 AI 陪玩</p></div>
          <span className={styles.selectionCount}>{selectedIds.length} / 3</span>
        </header>
        <section className={styles.setupPanel}>
          <div className={styles.setupCopy}>
            <Airplane size={42} weight="duotone" />
            <h2>今晚想和谁一起飞？</h2>
            <p>规则和机器人走棋全部在浏览器本地运行。模型只看到公开骰点与棋局进度，用来陪你聊天，不会替任何人选飞机。</p>
          </div>
          <div className={styles.characterGrid}>
            {COMPANION_CHARACTERS.map((character) => {
              const selected = selectedIds.includes(character.id);
              const order = selectedIds.indexOf(character.id);
              return (
                <button key={character.id} type="button" className={selected ? styles.characterSelected : ""} onClick={() => toggleSelection(character.id)}>
                  <span className={styles.setupAvatar} style={{ "--character-color": character.color } as CSSProperties}>{character.name.slice(-1)}</span>
                  <span><strong>{character.name}</strong><small>{character.relationLabel}</small></span>
                  <b>{selected ? order + 1 : "+"}</b>
                </button>
              );
            })}
          </div>
          <button type="button" className={styles.startButton} disabled={selectedIds.length !== 3} onClick={startGame}>
            <UsersThree size={20} weight="fill" /> {selectedIds.length === 3 ? "四人到齐，开始游戏" : `还需选择 ${3 - selectedIds.length} 位`}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/companion")}>← 游戏大厅</button>
        <div className={styles.brand}><Airplane size={25} weight="duotone" /><span><strong>云端航线 · 飞行棋</strong><small>本地规则 · AI 只负责陪聊</small></span></div>
        <div className={styles.headerActions}>
          <label><span>发言</span><select value={reactionFrequency} onChange={(event) => setReactionFrequency(event.target.value as ReactionFrequency)}>{Object.entries(REACTION_FREQUENCIES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</select></label>
          <span>第 {snapshot.turn} 回合</span>
          <button type="button" onClick={() => setVoiceEnabled((value) => !value)} title={voiceEnabled ? "关闭语音" : "打开语音"}>{voiceEnabled ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}</button>
          <button type="button" onClick={restart} title="重新开局"><ArrowCounterClockwise size={18} /></button>
          <button type="button" onClick={() => {
            matchIdRef.current += 1;
            reactionQueueRef.current = Promise.resolve();
            voiceQueueRef.current = Promise.resolve();
            pendingVoiceCountRef.current = 0;
            audioRef.current?.pause();
            clearRollFeedback();
            clearShortcutFeedback(true);
            engineRef.current = null;
            setSnapshot(null);
            setSelectedIds([]);
            setChat([]);
          }}>换陪玩</button>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.gamePanel}>
          <div className={styles.playerStrip}>
            {snapshot.players.map((player) => {
              const character = getCompanionCharacter(player.id);
              return (
                <article key={player.id} className={player.isCurrent ? styles.playerActive : ""} style={{ "--player-color": COLOR_HEX[player.color] } as CSSProperties}>
                  <span className={styles.playerAvatar} style={{ "--character-color": character?.color ?? COLOR_HEX[player.color] } as CSSProperties}>{player.isHuman ? "你" : player.name.slice(-1)}</span>
                  <div><strong>{player.name}</strong><small>{COLOR_LABELS[player.color]} · 到达 {player.finishedCount}/4</small></div>
                  {player.isCurrent ? <i>{isBotRunning ? "思考中" : "当前回合"}</i> : null}
                </article>
              );
            })}
          </div>

          <div className={styles.boardWrap}>
            <div className={styles.board} aria-label="飞行棋棋盘">
              <svg className={styles.shortcutLayer} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <defs>
                  {SHORTCUT_ROUTES.map((route) => (
                    <marker key={`marker-${route.color}`} id={`shortcut-arrow-${route.color}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                      <path d="M0,0 L5,2.5 L0,5 Z" fill={COLOR_HEX[route.color]} />
                    </marker>
                  ))}
                </defs>
                {SHORTCUT_ROUTES.map((route) => (
                  <path
                    key={`shortcut-${route.color}`}
                    className={`${styles.shortcutPath} ${shortcutFeedback?.color === route.color ? styles.shortcutPathActive : ""}`}
                    d={`M ${route.entry.x} ${route.entry.y} Q 50 50 ${route.exit.x} ${route.exit.y}`}
                    markerEnd={`url(#shortcut-arrow-${route.color})`}
                    style={{ "--route-color": COLOR_HEX[route.color] } as CSSProperties}
                  />
                ))}
              </svg>
              {Array.from({ length: 52 }, (_, index) => {
                const point = polarPoint(index);
                const route = SHORTCUT_ROUTES.find((item) => item.entryIndex === index || item.exitIndex === index);
                const isShortcutEntry = route?.entryIndex === index;
                const isShortcutExit = route?.exitIndex === index;
                const color = aeroplaneTrackCellColor(index);
                const isStart = Object.values(START_OFFSETS).includes(index);
                const shortcutLabel = isShortcutEntry ? `${COLOR_LABELS[color]}中央航线入口，正好停下会自动前进${AEROPLANE_SHORTCUT.distance}格` : isShortcutExit ? `${COLOR_LABELS[color]}中央航线出口` : undefined;
                return (
                  <span
                    key={`track-${index}`}
                    className={`${styles.trackCell} ${isStart ? styles.startCell : ""} ${isShortcutEntry ? styles.shortcutEntry : ""} ${isShortcutExit ? styles.shortcutExit : ""}`}
                    style={{ "--x": `${point.x}%`, "--y": `${point.y}%`, "--cell-color": COLOR_HEX[color] } as CSSProperties}
                    title={shortcutLabel}
                    aria-label={shortcutLabel}
                    data-route-color={route?.color}
                  >{isStart ? "▲" : isShortcutEntry ? `${COLOR_LABELS[color].slice(0, 1)}✈` : isShortcutExit ? `${COLOR_LABELS[color].slice(0, 1)}◆` : ""}</span>
                );
              })}
              {snapshot.players.flatMap((player) => Array.from({ length: 5 }, (_, index) => {
                const point = homeLanePoint(player.color, index + 51);
                return <span key={`${player.id}-home-${index}`} className={styles.homeCell} style={{ "--x": `${point.x}%`, "--y": `${point.y}%`, "--cell-color": COLOR_HEX[player.color] } as CSSProperties} />;
              }))}
              {snapshot.players.map((player, index) => <span key={`${player.id}-base`} className={styles.baseZone} data-index={index} style={{ "--cell-color": COLOR_HEX[player.color] } as CSSProperties}><b>{player.name}</b><small>机库</small></span>)}
              <span className={styles.finishZone}><Airplane size={25} weight="fill" /><small>终点</small></span>
              {shortcutFeedback && activeShortcutRoute ? (
                <svg key={shortcutFeedback.eventId} className={styles.shortcutFlightLayer} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                  <g className={styles.shortcutFlightMarker}>
                    <circle r="3" fill={COLOR_HEX[shortcutFeedback.color]} stroke="#fff" strokeWidth="0.8" />
                    <text x="0" y="1.15" textAnchor="middle">✈</text>
                    <animateMotion
                      dur="0.72s"
                      fill="freeze"
                      path={`M ${activeShortcutRoute.entry.x} ${activeShortcutRoute.entry.y} Q 50 50 ${activeShortcutRoute.exit.x} ${activeShortcutRoute.exit.y}`}
                    />
                  </g>
                </svg>
              ) : null}
              {snapshot.players.flatMap((player) => player.tokens.map((token) => {
                const point = tokenPoint(player, token);
                const clickable = player.isHuman && token.canMove;
                return (
                  <button
                    key={token.id}
                    type="button"
                    className={`${styles.token} ${clickable ? styles.tokenPlayable : ""} ${token.status === "finished" ? styles.tokenFinished : ""} ${shortcutFeedback?.tokenId === token.id ? styles.tokenShortcut : ""}`}
                    style={{ "--x": `${point.x}%`, "--y": `${point.y}%`, "--token-color": COLOR_HEX[player.color] } as CSSProperties}
                    onClick={clickable ? () => moveHuman(token.id) : undefined}
                    disabled={!clickable}
                    aria-label={`${player.name}${token.number}号飞机，${token.status}${clickable ? "，可以移动" : ""}`}
                  >{token.number}</button>
                );
              }))}
              {shortcutFeedback?.showRule ? (
                <div className={styles.shortcutNotice} role="status" aria-live="polite">
                  <strong>中央捷径触发</strong>
                  <span>{shortcutFeedback.actorName}正好停在 ✈ 入口，自动飞到 ◆ 出口，额外前进 {AEROPLANE_SHORTCUT.distance} 格。</span>
                  <small>入口和出口落点都可以撞回对手飞机</small>
                </div>
              ) : null}
            </div>
            <div className={styles.turnConsole}>
              <div>
                <small>{winner ? "本局结束" : rollFeedback ? `${rollFeedback.actorName}刚刚掷骰` : currentPlayer?.id === HUMAN_ID ? "轮到你" : `${currentPlayer?.name}的回合`}</small>
                <strong>{winner ? `${winner.name}赢了` : rollFeedback ? `掷出 ${rollFeedback.dice} 点` : snapshot.phase === "move" && snapshot.dice ? `选择一架飞机走 ${snapshot.dice} 格` : "掷骰子"}</strong>
                {rollFeedback ? <em className={styles.rollFeedback} role="status">{rollFeedback.message}</em> : null}
              </div>
              <button type="button" className={styles.dice} data-feedback={rollFeedback ? "true" : undefined} onClick={snapshot.currentPlayerId === HUMAN_ID && snapshot.phase === "roll" && !winner && !rollFeedback ? rollHuman : undefined} disabled={snapshot.currentPlayerId !== HUMAN_ID || snapshot.phase !== "roll" || Boolean(winner) || Boolean(rollFeedback)}>
                <span>{rollFeedback?.dice ?? snapshot.dice ?? "?"}</span><small>{rollFeedback ? "本次点数" : snapshot.phase === "roll" ? "点击掷骰" : "本轮点数"}</small>
              </button>
              <div className={styles.shortcutRule} title="飞机必须正好停在入口；路过不会触发">
                <span><b>✈</b> 正好停在入口</span>
                <strong>自动 +{AEROPLANE_SHORTCUT.distance}</strong>
                <small>沿同色箭头飞到 ◆ 出口</small>
              </div>
              {winner ? <button type="button" className={styles.againButton} onClick={restart}>再来一局</button> : null}
            </div>
          </div>
        </div>

        <aside className={styles.chatPanel}>
          <header><span><strong>航线聊天</strong><small>只依据公开棋局聊天</small></span>{isChatResponding ? <i>有人正在回你…</i> : null}</header>
          <div className={styles.feed} ref={feedRef}>
            {chat.map((entry) => {
              const character = getCompanionCharacter(entry.speakerId);
              return <article key={entry.id} className={`${styles.message} ${styles[`message_${entry.kind}`]}`}><span style={{ "--character-color": character?.color ?? "#64748b" } as CSSProperties}>{entry.kind === "event" || entry.kind === "director" ? "航" : entry.speakerName.slice(-1)}</span><div><strong>{entry.speakerName}</strong><p>{entry.text}</p></div></article>;
            })}
          </div>
          <div className={styles.composer}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="和本局的三位陪玩聊两句…" maxLength={300} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} />
            <div><VoiceRecorder disabled={isChatResponding} isNight sttApiKey={keys.siliconflowApiKey} sttEnabled holdToTalk onTranscript={setDraft} /><button type="button" onClick={sendChat} disabled={!draft.trim() || isChatResponding}><PaperPlaneTilt size={18} />发送</button></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
