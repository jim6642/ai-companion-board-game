"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Moon, NotebookPen, RotateCcw, Send, SkipForward, Sun, Volume2, VolumeX, X } from "lucide-react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useTypewriter } from "@/hooks/useTypewriter";
import { audioManager } from "@/lib/audio-manager";
import { COMPANION_CHARACTERS } from "@/lib/companion/characters";
import { cleanGeneratedSpeech, parseRoleRevealMessage, parseVoteResultMessage, stripSpeakerPrefix } from "@/lib/companion/speech-text";
import { hasPersistedGameInProgress, PHASE_CONFIGS } from "@/store/game-machine";
import { isWolfRole, type Phase, type Player, type Role } from "@/types/game";
import styles from "./werewolf.module.css";

const ROLE_LABELS: Record<Role, string> = {
  Villager: "平民",
  Werewolf: "狼人",
  Seer: "预言家",
  Witch: "女巫",
  Hunter: "猎人",
  Guard: "守卫",
  Idiot: "白痴",
  WhiteWolfKing: "白狼王",
};

const ROLE_HELP: Record<Role, string> = {
  Villager: "白天听发言、找出狼人，用投票守住好人阵营。",
  Werewolf: "夜晚和狼队选择目标，白天隐藏身份并影响票型。",
  Seer: "每晚查验一名玩家的阵营，把验人信息安全地带到白天。",
  Witch: "拥有一瓶解药和一瓶毒药，每瓶整局只能使用一次。",
  Hunter: "被狼人或投票带走时，可以选择开枪带走一名玩家。",
  Guard: "每晚守护一名玩家，但不能连续两晚守同一个人。",
  Idiot: "被公投出局时会翻牌免死，但之后失去投票权。",
  WhiteWolfKing: "属于狼队，白天可以自爆并带走一名玩家。",
};

const ROLE_ORDER: Role[] = ["Werewolf", "WhiteWolfKing", "Villager", "Seer", "Witch", "Hunter", "Guard"];
const NOTE_STORAGE_PREFIX = "companion.werewolf.notes.";

function buildCompanionRoleDeck(): Role[] {
  const deck: Role[] = [
    "Villager",
    "Villager",
    "Seer",
    "Witch",
    "Hunter",
    "Werewolf",
    "Werewolf",
    "WhiteWolfKing",
  ];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapWith]] = [deck[swapWith], deck[index]];
  }
  return deck;
}

const PHASE_LABELS: Record<Phase, string> = {
  LOBBY: "等待入座",
  SETUP: "正在发牌",
  NIGHT_START: "天黑请闭眼",
  NIGHT_GUARD_ACTION: "守卫行动",
  NIGHT_WOLF_ACTION: "狼人行动",
  NIGHT_WITCH_ACTION: "女巫行动",
  NIGHT_SEER_ACTION: "预言家行动",
  NIGHT_RESOLVE: "夜晚结算",
  DAY_START: "天亮了",
  DAY_BADGE_SIGNUP: "警长竞选",
  DAY_BADGE_SPEECH: "警上发言",
  DAY_BADGE_ELECTION: "警长投票",
  DAY_PK_SPEECH: "平票 PK",
  DAY_SPEECH: "自由发言",
  DAY_LAST_WORDS: "遗言",
  DAY_VOTE: "放逐投票",
  DAY_RESOLVE: "投票结算",
  BADGE_TRANSFER: "移交警徽",
  HUNTER_SHOOT: "猎人开枪",
  WHITE_WOLF_KING_BOOM: "白狼王自爆",
  GAME_END: "本局结束",
};

function companionFor(player: Player) {
  return COMPANION_CHARACTERS.find((character) => character.name === player.displayName);
}

function visibleRole(player: Player, humanPlayer: Player | null | undefined, phase: Phase) {
  if (player.isHuman || phase === "GAME_END") return ROLE_LABELS[player.role];
  if (humanPlayer && isWolfRole(humanPlayer.role) && isWolfRole(player.role)) return "狼队友";
  return player.alive ? "身份未知" : "已出局";
}

export default function CompanionWerewolfPage() {
  const {
    gameStarted,
    gameState,
    isLoading,
    isWaitingForAI,
    waitingForNextRound,
    currentDialogue,
    inputText,
    setInputText,
    humanPlayer,
    isNight,
    startGame,
    continueAfterRoleReveal,
    restartGame,
    handleHumanSpeech,
    handleFinishSpeaking,
    handleBadgeSignup,
    handleHumanVote,
    handleNightAction,
    handleHumanBadgeTransfer,
    handleWhiteWolfKingBoom,
    handleNextRound,
    resumeCurrentSpeech,
    advanceSpeech,
    markCurrentSegmentCompleted,
  } = useGameLogic();

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [talkingPlayerId, setTalkingPlayerId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ phase: Phase; seat: number } | null>(null);
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [isFinishingSpeech, setIsFinishingSpeech] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [noteSeat, setNoteSeat] = useState(0);
  const [playerNotes, setPlayerNotes] = useState<Record<number, string>>({});
  const submittingActionRef = useRef(false);
  const autoStartedRef = useRef(false);
  const autoAdvanceRef = useRef<number | null>(null);
  const lastAdvanceSignatureRef = useRef("");
  const chatRef = useRef<HTMLDivElement>(null);
  const keepChatPinnedRef = useRef(true);
  const notesGameIdRef = useRef("");

  const startFreshGame = useCallback(async () => {
    autoStartedRef.current = true;
    const requestedRole = new URLSearchParams(window.location.search).get("qaRole");
    const preferredRole = requestedRole && requestedRole in ROLE_LABELS
      ? requestedRole as Role
      : undefined;
    await startGame({
      playerCount: 8,
      difficulty: "normal",
      isGenshinMode: false,
      isSpectatorMode: false,
      preferredRole,
      fixedRoles: preferredRole ? undefined : buildCompanionRoleDeck(),
    });
  }, [startGame]);

  useEffect(() => {
    if (gameStarted || isLoading || autoStartedRef.current) return;
    // useGameLogic restores the persisted atom in an earlier effect. Avoid
    // racing it with an automatic new deal during this same mount.
    if (hasPersistedGameInProgress()) return;
    void startFreshGame();
  }, [gameStarted, isLoading, startFreshGame]);

  useEffect(() => {
    audioManager.setCallbacks(setTalkingPlayerId, () => setTalkingPlayerId(null));
    return () => {
      audioManager.clearQueue();
      audioManager.setEnabled(false);
    };
  }, []);

  useEffect(() => {
    audioManager.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  const phaseConfig = PHASE_CONFIGS[gameState.phase];
  const needsHumanInput = phaseConfig.requiresHumanInput(humanPlayer, gameState);
  const actionType = phaseConfig.actionType;
  const selectedSeat = selection?.phase === gameState.phase ? selection.seat : null;
  const selectedPlayer = gameState.players.find((player) => player.seat === selectedSeat);
  const currentSpeaker = gameState.players.find((player) => player.seat === gameState.currentSpeakerSeat);
  const dialogueText = currentDialogue
    ? stripSpeakerPrefix(currentDialogue.text, currentDialogue.speaker, currentSpeaker?.seat)
    : "";
  const roleRevealOpen = Boolean(
    gameStarted && humanPlayer && gameState.phase === "NIGHT_START" && gameState.day === 1 && !roleRevealed,
  );
  const hasPendingSeerResult = gameState.phase === "NIGHT_SEER_ACTION"
    && humanPlayer?.role === "Seer"
    && gameState.nightActions.seerTarget !== undefined;

  const { displayedText, isTyping, completedText } = useTypewriter({
    text: dialogueText,
    speed: 18,
    enabled: Boolean(currentDialogue?.isStreaming),
  });

  useEffect(() => {
    if (!currentDialogue?.isStreaming || !completedText || completedText !== dialogueText) return;
    markCurrentSegmentCompleted();
  }, [completedText, currentDialogue, dialogueText, markCurrentSegmentCompleted]);

  useEffect(() => {
    if (!gameState.gameId) return;
    notesGameIdRef.current = gameState.gameId;
    try {
      const saved = localStorage.getItem(`${NOTE_STORAGE_PREFIX}${gameState.gameId}`);
      setPlayerNotes(saved ? JSON.parse(saved) as Record<number, string> : {});
    } catch {
      setPlayerNotes({});
    }
  }, [gameState.gameId]);

  useEffect(() => {
    if (!gameState.gameId || notesGameIdRef.current !== gameState.gameId) return;
    localStorage.setItem(`${NOTE_STORAGE_PREFIX}${gameState.gameId}`, JSON.stringify(playerNotes));
  }, [gameState.gameId, playerNotes]);

  const advanceDialogue = useCallback(async (manual = false) => {
    if (manual) audioManager.stopCurrent();
    if (currentDialogue) {
      const result = await advanceSpeech();
      if (result?.shouldAdvanceToNextSpeaker) await handleNextRound();
      return;
    }
    if (waitingForNextRound) await handleNextRound();
  }, [advanceSpeech, currentDialogue, handleNextRound, waitingForNextRound]);

  useEffect(() => {
    if (autoAdvanceRef.current !== null) window.clearTimeout(autoAdvanceRef.current);
    if (roleRevealOpen || needsHumanInput || isWaitingForAI) return;

    let signature = "";
    let delay = 0;
    if (currentDialogue) {
      if (currentDialogue.isStreaming && (isTyping || completedText !== currentDialogue.text)) return;
      signature = `dialogue:${currentDialogue.speaker}:${currentDialogue.text}`;
      delay = hasPendingSeerResult
        ? 6500
        : Math.min(5200, Math.max(2200, 1500 + currentDialogue.text.length * 32));
    } else if (waitingForNextRound) {
      signature = `round:${gameState.phase}:${gameState.day}:${gameState.currentSpeakerSeat ?? ""}`;
      delay = 1200;
    } else {
      return;
    }
    if (lastAdvanceSignatureRef.current === signature) return;
    lastAdvanceSignatureRef.current = signature;
    autoAdvanceRef.current = window.setTimeout(() => void advanceDialogue(false), delay);
    return () => {
      if (autoAdvanceRef.current !== null) window.clearTimeout(autoAdvanceRef.current);
    };
  }, [advanceDialogue, completedText, currentDialogue, gameState.currentSpeakerSeat, gameState.day, gameState.phase, hasPendingSeerResult, isTyping, isWaitingForAI, needsHumanInput, roleRevealOpen, waitingForNextRound]);

  useEffect(() => {
    if (
      gameState.phase !== "DAY_PK_SPEECH"
      || !currentSpeaker
      || currentSpeaker.isHuman
      || isWaitingForAI
      || currentDialogue?.speaker === currentSpeaker.displayName
    ) return;
    const timer = window.setTimeout(() => void resumeCurrentSpeech(), 4200);
    return () => window.clearTimeout(timer);
  }, [currentDialogue?.speaker, currentSpeaker, gameState.phase, isWaitingForAI, resumeCurrentSpeech]);

  useEffect(() => {
    if (!keepChatPinnedRef.current || !chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [gameState.messages.length, displayedText]);

  const selectableSeats = useMemo(
    () => new Set(gameState.players.filter((player) => phaseConfig.canSelectPlayer(humanPlayer, player, gameState)).map((player) => player.seat)),
    [gameState, humanPlayer, phaseConfig],
  );

  const roleComposition = useMemo(() => ROLE_ORDER.flatMap((role) => {
    const count = gameState.players.filter((player) => player.role === role).length;
    return count ? [{ role, count }] : [];
  }), [gameState.players]);
  const badgeCandidateNames = useMemo(() => (gameState.badge.candidates || [])
    .map((seat) => gameState.players.find((player) => player.seat === seat))
    .filter((player): player is Player => Boolean(player))
    .map((player) => `${player.seat + 1}号 ${player.displayName}`), [gameState.badge.candidates, gameState.players]);

  const phaseInstruction = useMemo(() => {
    if (gameState.phase === "GAME_END") return gameState.winner === "village" ? "好人阵营获胜" : "狼人阵营获胜";
    if (hasPendingSeerResult) return "查验已完成。记住结果，然后继续夜晚。";
    if (needsHumanInput && actionType === "speech") return "轮到你发言：可以分段发送，确认说完后再结束发言。";
    if (gameState.phase === "DAY_BADGE_ELECTION" && badgeCandidateNames.length > 0) {
      return `本轮竞选：${badgeCandidateNames.join("、")}。点选其中一人，再确认投票。`;
    }
    if (needsHumanInput && actionType === "vote") return "点选一名发光的玩家，再确认你的选择。";
    if (needsHumanInput && actionType === "night_action") return "选择一名可行动的玩家，再确认目标。";
    if (needsHumanInput && gameState.phase === "DAY_BADGE_SIGNUP") return "你要参与警长竞选吗？";
    if (needsHumanInput && gameState.phase === "NIGHT_WITCH_ACTION") return "选择使用解药、毒药，或者本晚不用药。";
    if (isWaitingForAI) return "AI 正在结合身份、票型和角色性格思考……";
    if (currentDialogue) return `${currentDialogue.speaker}正在发言`;
    return isNight ? "夜间信息只会告诉能看见它的角色。" : "留意谁改口、谁跟票，以及每个人承担的结果。";
  }, [actionType, badgeCandidateNames, currentDialogue, gameState.phase, gameState.winner, hasPendingSeerResult, isNight, isWaitingForAI, needsHumanInput]);

  const submitNightAction = useCallback(async (targetSeat: number, witchAction?: "save" | "poison" | "pass") => {
    if (submittingActionRef.current) return;
    submittingActionRef.current = true;
    setIsSubmittingAction(true);
    try {
      await handleNightAction(targetSeat, witchAction);
    } finally {
      submittingActionRef.current = false;
      setIsSubmittingAction(false);
    }
  }, [handleNightAction]);

  const confirmTarget = useCallback(async () => {
    if (selectedSeat === null) return;
    if (gameState.phase === "DAY_BADGE_ELECTION" || gameState.phase === "DAY_VOTE") {
      await handleHumanVote(selectedSeat);
    } else if (gameState.phase === "BADGE_TRANSFER") {
      await handleHumanBadgeTransfer(selectedSeat);
    } else if (gameState.phase === "NIGHT_WITCH_ACTION") {
      await submitNightAction(selectedSeat, "poison");
    } else {
      await submitNightAction(selectedSeat);
    }
    setSelection(null);
  }, [gameState.phase, handleHumanBadgeTransfer, handleHumanVote, selectedSeat, submitNightAction]);

  const resetGame = useCallback(async () => {
    audioManager.clearQueue();
    if (gameState.gameId) localStorage.removeItem(`${NOTE_STORAGE_PREFIX}${gameState.gameId}`);
    restartGame();
    setRoleRevealed(false);
    setSelection(null);
    setShowNotebook(false);
    setPlayerNotes({});
    lastAdvanceSignatureRef.current = "";
    await startFreshGame();
  }, [gameState.gameId, restartGame, startFreshGame]);

  const leaveGame = useCallback(() => {
    audioManager.clearQueue();
    restartGame();
  }, [restartGame]);

  const mentionPlayer = useCallback((player: Player) => {
    setInputText((current) => `${current}${current.trim() ? " " : ""}${player.displayName}，`);
  }, [setInputText]);

  const finishSpeech = useCallback(async () => {
    if (isFinishingSpeech) return;
    setIsFinishingSpeech(true);
    try {
      await handleFinishSpeaking();
    } finally {
      setIsFinishingSpeech(false);
    }
  }, [handleFinishSpeaking, isFinishingSpeech]);

  const actionLabel = gameState.phase === "DAY_BADGE_ELECTION" || gameState.phase === "DAY_VOTE"
    ? "确认投票"
    : gameState.phase === "BADGE_TRANSFER"
      ? "移交警徽"
      : gameState.phase === "NIGHT_WITCH_ACTION"
        ? "确认毒杀"
        : gameState.phase === "HUNTER_SHOOT"
          ? "确认开枪"
          : gameState.phase === "WHITE_WOLF_KING_BOOM"
            ? "确认带走"
            : "确认目标";

  return (
    <main className={`${styles.shell} ${isNight ? styles.night : styles.day}`}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <Link className={styles.backLink} href="/zh/companion" onClick={leaveGame}>← 游戏大厅</Link>
          <div>
            <h1>月下密谈</h1>
            <p>八人狼人杀 · AI 陪玩局</p>
          </div>
        </div>
        <div className={styles.phasePill}>
          {isNight ? <Moon size={16} /> : <Sun size={16} />}
          <strong>{gameState.day > 0 ? `第 ${gameState.day} 天` : "准备中"}</strong>
          <span>{PHASE_LABELS[gameState.phase]}</span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setVoiceEnabled((value) => !value)} title="切换 AI 语音">
            {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{voiceEnabled ? "语音开" : "语音关"}</span>
          </button>
          <button type="button" onClick={() => void resetGame()} title="重新发牌">
            <RotateCcw size={16} />
            <span>重开</span>
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <section className={styles.tablePanel} aria-label="狼人杀牌桌">
          <div className={styles.seatGrid}>
            {gameState.players.map((player) => {
              const companion = companionFor(player);
              const selectable = selectableSeats.has(player.seat);
              const mentionable = needsHumanInput && actionType === "speech" && !player.isHuman;
              const badgeCandidate = (gameState.badge.candidates || []).includes(player.seat)
                && ["DAY_BADGE_SPEECH", "DAY_BADGE_ELECTION", "DAY_PK_SPEECH"].includes(gameState.phase);
              const speaking = gameState.currentSpeakerSeat === player.seat || currentDialogue?.speaker === player.displayName;
              const talking = talkingPlayerId === player.playerId;
              return (
                <button
                  type="button"
                  key={player.playerId}
                  className={`${styles.seat} ${player.isHuman ? styles.humanSeat : ""} ${!player.alive ? styles.deadSeat : ""} ${selectable ? styles.selectableSeat : ""} ${mentionable ? styles.mentionableSeat : ""} ${selectedSeat === player.seat ? styles.selectedSeat : ""} ${speaking ? styles.speakingSeat : ""}`}
                  onClick={() => selectable ? setSelection({ phase: gameState.phase, seat: player.seat }) : mentionable ? mentionPlayer(player) : undefined}
                  disabled={!selectable && !mentionable}
                  style={{ "--seat-color": companion?.color || "#7dd3fc" } as React.CSSProperties}
                >
                  <span className={styles.seatNumber}>{player.seat + 1}</span>
                  <span className={styles.avatar}>{player.isHuman ? "你" : (player.displayName || "?").slice(0, 1)}</span>
                  <span className={styles.seatInfo}>
                    <strong>{player.displayName || `玩家 ${player.seat + 1}`}</strong>
                    <small>{visibleRole(player, humanPlayer, gameState.phase)}</small>
                  </span>
                  {gameState.badge.holderSeat === player.seat ? <span className={styles.badge}>警长</span> : null}
                  {badgeCandidate ? <span className={styles.candidateBadge}>{gameState.phase === "DAY_PK_SPEECH" ? "PK" : "竞选"}</span> : null}
                  {playerNotes[player.seat]?.trim() ? <span className={styles.noteDot} title="已有局内备注" /> : null}
                  {talking ? <span className={styles.soundWave}><i /><i /><i /></span> : null}
                </button>
              );
            })}
          </div>

          <div className={styles.centerStage}>
            <div className={styles.moonDisc}>{isNight ? <Moon /> : <Sun />}</div>
            <div className={styles.stageCopy}>
              <span>{PHASE_LABELS[gameState.phase]}</span>
              <h2>{currentDialogue?.speaker || currentSpeaker?.displayName || (isWaitingForAI ? "正在思考" : "等待行动")}</h2>
              <p>{currentDialogue ? displayedText : phaseInstruction}</p>
            </div>
            {(currentDialogue || waitingForNextRound) && !needsHumanInput && !isWaitingForAI ? (
              <button className={styles.skipButton} type="button" onClick={() => void advanceDialogue(true)}>
                <SkipForward size={15} /> 跳过等待
              </button>
            ) : null}
          </div>

          <div className={styles.actionBar}>
            <div className={styles.actionPrompt}>
              <span>当前提示</span>
              <strong>{phaseInstruction}</strong>
              {badgeCandidateNames.length > 0 && ["DAY_BADGE_SPEECH", "DAY_BADGE_ELECTION", "DAY_PK_SPEECH"].includes(gameState.phase) ? (
                <small>候选人：{badgeCandidateNames.join("、")}</small>
              ) : null}
            </div>

            {gameState.phase === "DAY_BADGE_SIGNUP" && needsHumanInput ? (
              <div className={styles.actionButtons}>
                <button className={styles.primaryButton} type="button" onClick={() => void handleBadgeSignup(true)}>上警竞选</button>
                <button className={styles.secondaryButton} type="button" onClick={() => void handleBadgeSignup(false)}>不上警</button>
              </div>
            ) : null}

            {gameState.phase === "NIGHT_WITCH_ACTION" && needsHumanInput ? (
              <div className={styles.actionButtons}>
                {!gameState.roleAbilities.witchHealUsed && gameState.nightActions.wolfTarget !== undefined ? (
                  <button className={styles.primaryButton} type="button" disabled={isSubmittingAction} onClick={() => void submitNightAction(-1, "save")}>
                    解救 {gameState.players.find((player) => player.seat === gameState.nightActions.wolfTarget)?.displayName || "今晚的目标"}
                  </button>
                ) : null}
                <button className={styles.secondaryButton} type="button" disabled={isSubmittingAction} onClick={() => void submitNightAction(-1, "pass")}>本晚不用药</button>
              </div>
            ) : null}

            {hasPendingSeerResult ? (
              <button className={styles.primaryButton} type="button" onClick={() => void advanceDialogue(true)}>
                记住结果，继续夜晚
              </button>
            ) : null}

            {needsHumanInput && (actionType === "vote" || actionType === "night_action" || gameState.phase === "NIGHT_WITCH_ACTION") ? (
              <div className={styles.actionButtons}>
                <span className={styles.targetText}>{selectedPlayer ? `已选择：${selectedPlayer.displayName}` : "请先点选发光的座位"}</span>
                <button className={styles.primaryButton} type="button" disabled={!selectedPlayer || isSubmittingAction} onClick={() => void confirmTarget()}>{actionLabel}</button>
                {(gameState.phase === "HUNTER_SHOOT" || gameState.phase === "WHITE_WOLF_KING_BOOM") ? (
                  <button className={styles.secondaryButton} type="button" disabled={isSubmittingAction} onClick={() => void submitNightAction(-1)}>不带人</button>
                ) : null}
              </div>
            ) : null}

            {needsHumanInput && actionType === "speech" && humanPlayer?.role === "WhiteWolfKing" && !gameState.roleAbilities.whiteWolfKingBoomUsed ? (
              <button className={styles.dangerButton} type="button" onClick={() => void handleWhiteWolfKingBoom()}>自爆带人</button>
            ) : null}
          </div>
        </section>

        <aside className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div><Headphones size={17} /><strong>牌桌聊天</strong></div>
            <button type="button" className={styles.notebookButton} onClick={() => setShowNotebook((value) => !value)}>
              <NotebookPen size={14} /> 本局角色与备注
            </button>
            <span>{gameState.messages.length} 条</span>
          </div>
          {showNotebook ? (
            <section className={styles.notebook} aria-label="本局角色与局内备注">
              <header><strong>本局公开配置</strong><button type="button" onClick={() => setShowNotebook(false)} aria-label="关闭"><X size={15} /></button></header>
              <p>只公开角色构成，不公开角色对应的玩家。</p>
              <div className={styles.roleTags}>
                {roleComposition.map(({ role, count }) => <span key={role}>{ROLE_LABELS[role]}{count > 1 ? ` × ${count}` : ""}</span>)}
              </div>
              <label className={styles.noteEditor}>
                <span>给玩家做局内备注</span>
                <select value={noteSeat} onChange={(event) => setNoteSeat(Number(event.target.value))}>
                  {gameState.players.map((player) => <option key={player.playerId} value={player.seat}>{player.seat + 1}号 {player.displayName}</option>)}
                </select>
                <textarea
                  value={playerNotes[noteSeat] || ""}
                  onChange={(event) => setPlayerNotes((current) => ({ ...current, [noteSeat]: event.target.value.slice(0, 300) }))}
                  placeholder="例如：第一轮改口、跟票很快……"
                  rows={3}
                />
              </label>
            </section>
          ) : null}
          <div
            className={styles.chatHistory}
            ref={chatRef}
            onScroll={(event) => {
              const element = event.currentTarget;
              keepChatPinnedRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 72;
            }}
          >
            {gameState.messages.length === 0 ? <p className={styles.emptyChat}>游戏信息和玩家发言会留在这里。你可以随时向上滚动查看。</p> : null}
            {gameState.messages.map((message, index) => {
              const speaker = gameState.players.find((player) => player.playerId === message.playerId);
              const roleReveal = parseRoleRevealMessage(message.content);
              const voteResult = parseVoteResultMessage(message.content);
              const displayContent = speaker
                ? cleanGeneratedSpeech(message.content, speaker.displayName, speaker.seat, speaker.displayName === "陆野" ? 80 : 160)
                : message.content;
              return (
                <div key={`${message.timestamp}-${index}`} className={`${styles.message} ${message.isSystem ? styles.systemMessage : ""} ${speaker?.isHuman ? styles.myMessage : ""}`}>
                  <div><strong>{message.isSystem ? "主持人" : message.playerName || speaker?.displayName || "玩家"}</strong><span>{message.day ? `第${message.day}天` : ""}</span></div>
                  {roleReveal ? (
                    <div className={styles.roleRevealResult}>
                      <strong>{roleReveal.title}</strong>
                      <div className={styles.roleRevealGrid}>
                        {roleReveal.players.map((player) => (
                          <p key={`${player.seat}-${player.name}`}>
                            <b>{player.seat + 1}号 · {player.name}{player.isHuman ? "（你）" : ""}</b>
                            <span>{ROLE_LABELS[player.role]}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : voteResult ? (
                    <div className={styles.voteResult}>
                      <strong>{voteResult.title}</strong>
                      {voteResult.results.map((result) => (
                        <p key={`${result.targetSeat}-${result.targetName}`}>
                          <b>{result.targetSeat + 1}号 {result.targetName}</b>
                          <span>{result.voteCount} 票 · 来自 {result.voterSeats.map((seat) => `${seat + 1}号`).join("、") || "无人"}</span>
                        </p>
                      ))}
                    </div>
                  ) : message.content.startsWith("[ROLE_REVEAL]") ? (
                    <p>身份揭晓信息暂时无法显示。</p>
                  ) : <p>{displayContent}</p>}
                </div>
              );
            })}
            {currentDialogue ? (
              <div className={`${styles.message} ${styles.liveMessage}`}>
                <div><strong>{currentDialogue.speaker}</strong><span>正在说</span></div>
                <p>{displayedText}<i className={isTyping ? styles.cursor : ""} /></p>
              </div>
            ) : null}
          </div>

          <div className={styles.composer}>
            {needsHumanInput && actionType === "speech" ? (
              <>
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleHumanSpeech();
                    }
                  }}
                  placeholder="说点什么……语音识别后会先显示在这里"
                  rows={3}
                />
                <div className={styles.composerActions}>
                  <VoiceRecorder
                    isNight={isNight}
                    holdToTalk
                    onTranscript={(text) => setInputText(inputText.trim() ? `${inputText.trim()} ${text}` : text)}
                  />
                  <button className={styles.sendButton} type="button" disabled={!inputText.trim()} onClick={() => void handleHumanSpeech()}>
                    <Send size={15} /> 发送
                  </button>
                  <button className={styles.finishButton} type="button" disabled={isFinishingSpeech} onClick={() => void finishSpeech()}>
                    {isFinishingSpeech ? "正在交给下一位…" : "说完了"}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.composerWaiting}>{roleRevealOpen ? "先查看你的身份牌" : "轮到你发言时，可打字或按住说话"}</div>
            )}
          </div>
        </aside>
      </section>

      {roleRevealOpen && humanPlayer ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.roleCard}>
            <span className={styles.roleEyebrow}>你的秘密身份</span>
            <div className={`${styles.roleIcon} ${isWolfRole(humanPlayer.role) ? styles.wolfRole : ""}`}>{ROLE_LABELS[humanPlayer.role].slice(0, 1)}</div>
            <h2>{ROLE_LABELS[humanPlayer.role]}</h2>
            <p>{ROLE_HELP[humanPlayer.role]}</p>
            {isWolfRole(humanPlayer.role) ? (
              <div className={styles.teamHint}>狼队友：{gameState.players.filter((player) => !player.isHuman && isWolfRole(player.role)).map((player) => player.displayName).join("、") || "无"}</div>
            ) : null}
            <button type="button" onClick={() => {
              setRoleRevealed(true);
              void continueAfterRoleReveal();
            }}>记住身份，进入第一夜</button>
          </section>
        </div>
      ) : null}

      {isLoading && !gameStarted ? <div className={styles.loadingScreen}><Moon /><span>正在邀请七位伙伴入座……</span></div> : null}
    </main>
  );
}
