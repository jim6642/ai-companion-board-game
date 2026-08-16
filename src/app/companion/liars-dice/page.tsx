"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChatCircleDots, DiceFive, PaperPlaneTilt, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import { COMPANION_CHARACTERS, getCompanionCharacter, type CompanionCharacter } from "@/lib/companion/characters";
import {
  chooseLiarsDiceChatIntent,
  chooseLiarsDiceEventIntent,
  createLiarsDiceRelationshipMemories,
  describeLiarsDiceSpeech,
  markLiarsDiceSpeech,
  rememberLiarsDiceEvents,
  rememberLiarsDicePlayerLine,
  type LiarsDiceDialogueIntent,
  type LiarsDiceRelationshipMemories,
} from "@/lib/companion/liars-dice-dialogue";
import { prepareTextForTts } from "@/lib/companion/speech-text";
import { describeLiarsDiceSnapshot } from "@/lib/liars-dice/context";
import { CompanionLiarsDiceEngine, type LiarsDiceGameEvent, type LiarsDiceMove, type LiarsDiceSnapshot } from "@/lib/liars-dice/engine";
import styles from "./liars-dice.module.css";

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

function makeSpecs(ids: string[]) {
  return [
    { id: HUMAN_ID, name: readPlayerName(), isHuman: true },
    ...ids.map((id) => ({ id, name: getCompanionCharacter(id)?.name ?? id })),
  ];
}

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, small = false, wild = false }: { value: number; small?: boolean; wild?: boolean }) {
  return (
    <span className={`${styles.die} ${small ? styles.smallDie : ""} ${wild || value === 1 ? styles.wildDie : ""}`} aria-label={`${value}点`}>
      {Array.from({ length: 9 }, (_, index) => <i key={index} className={PIPS[value]?.includes(index) ? styles.pip : ""} />)}
    </span>
  );
}

function offlineReply(characterId: string, prompt: string) {
  const lost = prompt.includes("失去一颗") || prompt.includes("离开本局");
  const challenged = prompt.includes("质疑");
  const lines: Record<string, string> = {
    "lin-xia": lost ? "先别懊恼，我记得刚才是谁把你逼到那一手了。" : challenged ? "你真要开我吗？好吧，我其实更想看你信我一次。" : "你叫得这么稳，我差点就真的信了。",
    "su-yao": lost ? "让你别上头。下一轮看我干什么，我又不会替你撒谎。" : challenged ? "敢开我？行啊，输了可别装作不在意。" : "这点数也敢往上抬，你是心虚还是故意逗我？",
    "gu-qinglan": lost ? "上一手加得太快了。记住轨迹，别只记结果。" : challenged ? "开盅吧。你要是判断错了，待会儿别躲开我的眼神。" : "叫点在抬，语气倒越来越轻。有人开始虚了。",
    "tang-guo": lost ? "掉一颗而已！下一轮跟我赌，我赢了你就多看我一会儿。" : challenged ? "来呀，开我！不过你要是错了，得答应我一个小条件。" : "我可没吹牛——至少现在不能告诉你。",
    "chen-hang": lost ? "兄弟，嘴比骰子硬是吧？这颗掉得不冤。" : challenged ? "开，必须开。怂一秒都算咱俩白混这么久。" : "你这叫点一听就有故事，我先不拆你。",
    "xiao-man": lost ? "哥，你撒谎时果然还是那个表情，少装镇定啦。" : challenged ? "你真要开？行，错了回家别赖我没提醒。" : "哥你别盯我的杯子，自己的谎先圆好。",
    "shen-ning": lost ? "少一颗就少一颗，先把刚才为什么上头想清楚。" : challenged ? "想好了就开，姐姐不替你承担这次判断。" : "别被别人一句挑衅带着加，慢一点也不丢人。",
  };
  return lines[characterId] ?? "这手我先记着，开盅再说。";
}

export default function CompanionLiarsDicePage() {
  const router = useRouter();
  const engineRef = useRef<CompanionLiarsDiceEngine | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<LiarsDiceSnapshot | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedFace, setSelectedFace] = useState(2);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [latestEvent, setLatestEvent] = useState("摇好骰盅，准备叫点。");
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [keys, setKeys] = useState({ minimaxApiKey: "", minimaxGroupId: "", siliconflowApiKey: "" });
  const chatRef = useRef<ChatEntry[]>([]);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const memoriesRef = useRef<LiarsDiceRelationshipMemories>({});
  const reactionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingVoiceCountRef = useRef(0);
  const lastReactionTurnRef = useRef(-3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Incremented every time we (re)start a match. Async chains created
  // before the bump see a stale id and bail out without touching the
  // new match's chat, voice queue, or chatResponding state. Without
  // this guard, a long bot turn that gets its /api/companion/respond
  // reply AFTER the player hits "重开整场" would pollute the new game.
  const matchIdRef = useRef(0);

  const selectedCharacters = useMemo(
    () => selectedIds.map((id) => getCompanionCharacter(id)).filter((item): item is CompanionCharacter => Boolean(item)),
    [selectedIds],
  );
  const human = snapshot?.players.find((player) => player.id === HUMAN_ID);
  const legalMoves = snapshot?.phase === "play" && snapshot.currentPlayerId === HUMAN_ID ? engineRef.current?.legalMoves() ?? [] : [];
  const legalBids = legalMoves.filter((move) => move.kind === "bid");
  const legalQuantities = [...new Set(legalBids.map((move) => move.quantity!))];
  const legalFaces = [...new Set(legalBids.filter((move) => move.quantity === selectedQuantity).map((move) => move.face!))];
  const chosenBid = legalBids.find((move) => move.quantity === selectedQuantity && move.face === selectedFace);
  const canChallenge = legalMoves.some((move) => move.kind === "challenge");

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

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  useEffect(() => {
    if (legalBids.length === 0) return;
    if (!chosenBid) {
      setSelectedQuantity(legalBids[0].quantity!);
      setSelectedFace(legalBids[0].face!);
    }
  }, [chosenBid, legalBids]);

  useEffect(() => {
    if (legalFaces.length > 0 && !legalFaces.includes(selectedFace)) setSelectedFace(legalFaces[0]);
  }, [legalFaces, selectedFace]);

  const addChat = useCallback((entries: ChatEntry[]) => {
    setChat((previous) => {
      const next = [...previous, ...entries].slice(-120);
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
    const spoken = prepareTextForTts(text);
    if (!character || !spoken) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (keys.minimaxApiKey) headers["x-minimax-api-key"] = keys.minimaxApiKey;
    if (keys.minimaxGroupId) headers["x-minimax-group-id"] = keys.minimaxGroupId;
    const response = await fetch("/api/companion/tts", { method: "POST", headers, body: JSON.stringify({ text: spoken, voiceId: character.voiceId }) });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      const done = () => { URL.revokeObjectURL(url); if (audioRef.current === audio) audioRef.current = null; resolve(); };
      audio.addEventListener("ended", done, { once: true });
      audio.addEventListener("error", done, { once: true });
      void audio.play().catch(done);
    });
  }, [keys.minimaxApiKey, keys.minimaxGroupId, voiceEnabled]);

  const enqueueVoice = useCallback((characterId: string, text: string, dropIfBusy: boolean) => {
    if (dropIfBusy && pendingVoiceCountRef.current > 0) return;
    const matchId = matchIdRef.current;
    pendingVoiceCountRef.current += 1;
    voiceQueueRef.current = voiceQueueRef.current.then(() => {
      // If the player restarted mid-game, drop the queued line entirely.
      if (matchIdRef.current !== matchId) return;
      return playVoice(characterId, text);
    }).catch(() => undefined).finally(() => {
      pendingVoiceCountRef.current = Math.max(0, pendingVoiceCountRef.current - 1);
    });
  }, [playVoice]);

  const requestReply = useCallback((characterId: string, prompt: string, intent: LiarsDiceDialogueIntent, autoSpeech: boolean) => {
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
            mode: "liars-dice",
            playerText: `${prompt}\n${describeLiarsDiceSpeech(characterId, intent, memoriesRef.current[characterId])}`,
            characterIds: [characterId],
            history: chatRef.current.slice(-20).map(({ speakerId, speakerName, text }) => ({ speakerId, speakerName, text })),
          }),
        });
        // The fetch may have raced a restart; drop the result so the new
        // match's chat feed stays clean. Also avoids enqueueing a stale
        // TTS line into the new match's voice queue.
        if (matchIdRef.current !== matchId) return;
        const result = await response.json().catch(() => null) as { replies?: Array<{ characterId: string; text: string }> } | null;
        if (matchIdRef.current !== matchId) return;
        const reply = response.ok && result?.replies?.[0] ? result.replies[0] : { characterId, text: offlineReply(characterId, prompt) };
        const character = getCompanionCharacter(reply.characterId);
        addChat([{ id: makeId("dice-ai"), speakerId: reply.characterId, speakerName: character?.name ?? reply.characterId, text: reply.text, kind: "ai" }]);
        markLiarsDiceSpeech(memoriesRef.current, reply.characterId, intent);
        enqueueVoice(reply.characterId, reply.text, autoSpeech);
      } finally {
        if (matchIdRef.current === matchId) setIsChatResponding(false);
      }
    }).catch(() => {
      if (matchIdRef.current === matchId) setIsChatResponding(false);
    });
  }, [addChat, enqueueVoice, keys.minimaxApiKey, selectedIds]);

  const reactionSpeaker = useCallback((event: LiarsDiceGameEvent, current: LiarsDiceSnapshot) => {
    if (selectedIds.includes(event.actorId)) return event.actorId;
    const direct = event.targetIds.find((id) => selectedIds.includes(id));
    return direct ?? selectedIds[(current.turn + event.text.length) % selectedIds.length];
  }, [selectedIds]);

  const publishEvents = useCallback((events: LiarsDiceGameEvent[], current: LiarsDiceSnapshot | null) => {
    if (!current || events.length === 0) return;
    rememberLiarsDiceEvents(memoriesRef.current, events, HUMAN_ID);
    const summary = events.map((event) => event.text).join(" ");
    setLatestEvent(summary);
    addChat([{ id: makeId("dice-event"), speakerId: "director", speakerName: "开盅播报", text: summary, kind: "event" }]);
    const priority = [...events].reverse().find((event) => event.kind === "game-win")
      ?? [...events].reverse().find((event) => event.kind === "eliminate")
      ?? [...events].reverse().find((event) => event.kind === "die-lost")
      ?? [...events].reverse().find((event) => event.kind === "challenge");
    const heartbeat = current.turn - lastReactionTurnRef.current >= 4 ? [...events].reverse().find((event) => event.kind === "bid") : undefined;
    const reaction = priority ?? heartbeat;
    if (!reaction) return;
    lastReactionTurnRef.current = current.turn;
    const speaker = reactionSpeaker(reaction, current);
    requestReply(
      speaker,
      `已经发生的公开事件：${reaction.text}\n当前公开桌面：${describeLiarsDiceSnapshot(current)}\n只能评价公开叫点与已经开盅的结果，绝不能声称知道任何隐藏骰子。`,
      chooseLiarsDiceEventIntent(speaker, reaction, HUMAN_ID),
      true,
    );
  }, [addChat, reactionSpeaker, requestReply]);

  const startGame = useCallback(() => {
    if (selectedIds.length !== 4) return;
    matchIdRef.current += 1;
    // Drop any pending async replies/voices from a previous match.
    // The old chain is now orphaned: closures in it will see the bumped
    // matchId in the requestReply/enqueueVoice guards and bail out
    // before touching state.
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    engineRef.current = new CompanionLiarsDiceEngine(makeSpecs(selectedIds));
    memoriesRef.current = createLiarsDiceRelationshipMemories(selectedIds);
    const welcome: ChatEntry = {
      id: makeId("dice-welcome"), speakerId: "director", speakerName: "开盅播报",
      text: `五人吹牛骰子开局。${selectedCharacters.map((item) => item.name).join("、")}和你同桌；1点可作万能点，最后留在桌上的人获胜。`, kind: "director",
    };
    chatRef.current = [welcome];
    setChat([welcome]);
    lastReactionTurnRef.current = -3;
    setLatestEvent("你是第一轮先手。看好自己的骰子，叫出第一手吧。");
    refresh();
  }, [refresh, selectedCharacters, selectedIds]);

  const restart = useCallback(() => {
    if (selectedIds.length !== 4) return;
    matchIdRef.current += 1;
    audioRef.current?.pause();
    // Same drain as startGame: long bot turns in the previous match
    // may still have an in-flight /api/companion/respond or TTS
    // request that would otherwise land in the new match's UI.
    reactionQueueRef.current = Promise.resolve();
    voiceQueueRef.current = Promise.resolve();
    pendingVoiceCountRef.current = 0;
    engineRef.current = new CompanionLiarsDiceEngine(makeSpecs(selectedIds));
    memoriesRef.current = createLiarsDiceRelationshipMemories(selectedIds);
    const line: ChatEntry = { id: makeId("dice-restart"), speakerId: "director", speakerName: "开盅播报", text: "新的一场已经摇好。所有人恢复五颗骰子，你先叫。", kind: "director" };
    chatRef.current = [line];
    setChat([line]);
    setLatestEvent("新的一场开始。先看自己的骰子。 ");
    lastReactionTurnRef.current = -3;
    refresh();
  }, [refresh, selectedIds]);

  const playHuman = useCallback((move: LiarsDiceMove) => {
    try {
      const events = engineRef.current?.playHuman(move) ?? [];
      const next = refresh();
      publishEvents(events, next);
    } catch (error) {
      setLatestEvent(error instanceof Error ? error.message : "这个行动现在不能执行。");
    }
  }, [publishEvents, refresh]);

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
    if (!snapshot || snapshot.phase !== "play" || snapshot.currentPlayerId === HUMAN_ID) { setIsBotRunning(false); return; }
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
    }, 210);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [publishEvents, refresh, snapshot]);

  const sendChat = useCallback(() => {
    if (!snapshot || !human || !draft.trim() || isChatResponding) return;
    const text = draft.trim();
    addChat([{ id: makeId("dice-human"), speakerId: HUMAN_ID, speakerName: human.name, text, kind: "human" }]);
    setDraft("");
    const mentioned = selectedCharacters.find((character) => text.includes(character.name));
    const responder = mentioned?.id ?? selectedIds[(snapshot.turn + chatRef.current.length) % selectedIds.length];
    rememberLiarsDicePlayerLine(memoriesRef.current, [responder], text);
    requestReply(
      responder,
      `玩家在吹牛骰子桌上说：${text}\n当前公开桌面：${describeLiarsDiceSnapshot(snapshot)}\n直接回应玩家；不能透露、猜定或编造任何隐藏骰子。`,
      chooseLiarsDiceChatIntent(text),
      false,
    );
  }, [addChat, draft, human, isChatResponding, requestReply, selectedCharacters, selectedIds, snapshot]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }, []);

  if (!snapshot) {
    return (
      <main className={styles.setupPage}>
        <header className={styles.setupHeader}>
          <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
          <div><span>AI BOARD COMPANION</span><h1>雾杯夜话 · 吹牛骰子</h1><p>选择四位真正参与本局的 AI 陪玩</p></div>
          <strong>{selectedIds.length} / 4</strong>
        </header>
        <section className={styles.setupPanel}>
          <div className={styles.setupCopy}><DiceFive size={46} weight="duotone" /><h2>今晚想和谁互相诈唬？</h2><p>所有骰子、叫点与质疑都由本地规则引擎处理。AI 只能看见自己的骰子，模型只负责围绕公开局势陪你聊天。</p></div>
          <div className={styles.characterGrid}>
            {COMPANION_CHARACTERS.map((character) => {
              const selected = selectedIds.includes(character.id);
              return <button type="button" key={character.id} className={selected ? styles.characterSelected : ""} style={{ "--character-color": character.color } as CSSProperties} onClick={() => toggleSelection(character.id)}><span>{character.name.slice(-1)}</span><div><strong>{character.name}</strong><small>{character.relationLabel}</small><p>{character.archetype}</p></div><b>{selected ? "已入座" : "邀请"}</b></button>;
            })}
          </div>
          <footer><div><strong>核心规则</strong><p>1点可代替2～6点；叫1点时需要按减半或翻倍加一换档。质疑失败或吹牛被抓都会失去一颗骰子。</p></div><button type="button" disabled={selectedIds.length !== 4} onClick={startGame}>和这四人开局</button></footer>
        </section>
      </main>
    );
  }

  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const bidder = snapshot.players.find((player) => player.id === snapshot.currentBid?.bidderId);
  const winner = snapshot.players.find((player) => player.id === snapshot.winnerId);
  const lastReveal = snapshot.lastReveal;

  return (
    <main className={styles.gamePage}>
      <header className={styles.gameHeader}>
        <button type="button" onClick={() => router.push("/companion")}><ArrowLeft size={18} />游戏大厅</button>
        <div><span>雾杯夜话</span><strong>五人吹牛骰子 · AI 陪玩局</strong></div>
        <p>第 {snapshot.round} 轮 · {snapshot.phase === "play" ? `轮到${current?.name}` : snapshot.phase === "round-over" ? "已经开盅" : "整场结算"}</p>
        <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>{voiceEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}{voiceEnabled ? "语音开" : "语音关"}</button>
        <button type="button" onClick={restart}>重开整场</button>
      </header>
      <div className={styles.gameLayout}>
        <section className={styles.tablePanel}>
          <div className={styles.playerStrip}>
            {snapshot.players.map((player) => {
              const character = getCompanionCharacter(player.id);
              const isCurrent = player.id === snapshot.currentPlayerId && snapshot.phase === "play";
              return <article key={player.id} className={`${isCurrent ? styles.currentPlayer : ""} ${!player.active ? styles.outPlayer : ""}`} style={{ "--character-color": character?.color ?? "#60a5fa" } as CSSProperties}><span>{player.id === HUMAN_ID ? "你" : player.name.slice(-1)}</span><div><strong>{player.name}</strong><small>{player.active ? `${player.diceRemaining} 颗骰子` : "已经出局"}</small></div>{isCurrent ? <b>正在想</b> : null}</article>;
            })}
          </div>
          <div className={styles.diceArena}>
            <div className={styles.bidBoard}>
              <span>{snapshot.currentBid ? "当前叫点" : "等待第一手"}</span>
              {snapshot.currentBid ? <><strong>{snapshot.currentBid.quantity}</strong><Die value={snapshot.currentBid.face} small /><p>{bidder?.name} 叫出 · 1点为万能点</p></> : <><DiceFive size={46} weight="duotone" /><h2>你先叫</h2><p>叫出你认为全桌至少拥有的数量</p></>}
            </div>
            <div className={styles.yourCup}>
              <header><div><span>只对你可见</span><h2>你的骰盅</h2></div><small>1 点可以代替 2～6 点</small></header>
              <div className={styles.diceRow}>{snapshot.humanDice.length ? snapshot.humanDice.map((die, index) => <Die key={`${snapshot.round}-${index}`} value={die} />) : <p>你已经出局，可以继续看他们互相吹牛。</p>}</div>
            </div>
            <div className={styles.latest}><strong>桌边动态</strong><p>{latestEvent}</p></div>
            {snapshot.phase === "play" && snapshot.currentPlayerId === HUMAN_ID ? (
              <div className={styles.actionPanel}>
                <div><strong>我要叫</strong><select aria-label="叫点数量" value={selectedQuantity} onChange={(event) => setSelectedQuantity(Number(event.target.value))}>{legalQuantities.map((quantity) => <option key={quantity} value={quantity}>{quantity} 个</option>)}</select><select aria-label="骰子点数" value={selectedFace} onChange={(event) => setSelectedFace(Number(event.target.value))}>{legalFaces.map((face) => <option key={face} value={face}>{face} 点</option>)}</select></div>
                <button type="button" className={styles.bidButton} disabled={!chosenBid} onClick={() => chosenBid && playHuman(chosenBid)}>确认叫点</button>
                <button type="button" className={styles.challengeButton} disabled={!canChallenge} onClick={() => playHuman({ kind: "challenge" })}>不信，开盅</button>
              </div>
            ) : null}
            {snapshot.phase !== "play" && lastReveal ? (
              <div className={styles.roundOverlay}>
                <span>{snapshot.phase === "game-over" ? "整场结束" : "开盅结果"}</span>
                <h2>{lastReveal.actualCount} 个 {lastReveal.bid.face} 点</h2>
                <p>上一手叫了 {lastReveal.bid.quantity} 个；{snapshot.players.find((player) => player.id === lastReveal.loserId)?.name} 失去一颗骰子。</p>
                <div className={styles.revealGrid}>{Object.entries(lastReveal.dice).map(([id, dice]) => <div key={id}><strong>{snapshot.players.find((player) => player.id === id)?.name}</strong><span>{dice.map((value, index) => <Die key={index} value={value} small />)}</span></div>)}</div>
                {snapshot.phase === "round-over" ? <button type="button" onClick={nextRound}>开始下一轮</button> : <><h3>{winner?.name} 是最后赢家</h3><button type="button" onClick={restart}>再来一场</button></>}
              </div>
            ) : null}
            {isBotRunning ? <div className={styles.botThinking}>{current?.name} 正在叫点……</div> : null}
          </div>
        </section>
        <aside className={styles.chatPanel}>
          <header><ChatCircleDots size={24} /><div><h2>杯边闲聊</h2><p>聊天不会暂停本地 AI 行动</p></div><span>{chat.length} 条</span></header>
          <div className={styles.chatFeed} ref={feedRef}>
            {chat.map((entry) => {
              const character = getCompanionCharacter(entry.speakerId);
              return <article key={entry.id} className={`${styles.chatEntry} ${entry.kind === "human" ? styles.humanEntry : ""} ${entry.kind === "event" || entry.kind === "director" ? styles.eventEntry : ""}`}><span className={styles.chatAvatar} style={{ "--character-color": character?.color ?? "#8795a7" } as CSSProperties}>{entry.kind === "event" || entry.kind === "director" ? "盅" : entry.kind === "human" ? "你" : entry.speakerName.slice(-1)}</span><div><strong>{entry.speakerName}</strong><p>{entry.text}</p></div></article>;
            })}
            {isChatResponding ? <div className={styles.thinking}>有人正压低声音回你……</div> : null}
          </div>
          <div className={styles.composer}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="和他们说点什么，或直接点名……" maxLength={300} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} /><div><VoiceRecorder disabled={isChatResponding} isNight sttApiKey={keys.siliconflowApiKey} sttEnabled holdToTalk onTranscript={setDraft} /><button type="button" onClick={sendChat} disabled={!draft.trim() || isChatResponding}><PaperPlaneTilt size={18} />发送</button></div></div>
        </aside>
      </div>
    </main>
  );
}
