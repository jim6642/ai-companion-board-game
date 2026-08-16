"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  Airplane,
  ChatsCircle,
  DiceFive,
  GameController,
  GearSix,
  Heart,
  PaperPlaneTilt,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  UsersThree,
} from "@phosphor-icons/react";
import { VoiceRecorder } from "@/components/game/VoiceRecorder";
import {
  COMPANION_CHARACTERS,
  HUMAN_SEAT,
  getCompanionCharacter,
  type CompanionCharacter,
} from "@/lib/companion/characters";
import {
  createDirectorMemory,
  directTableTurn,
  type DirectorMemory,
} from "@/lib/companion/director";
import styles from "./companion.module.css";
import { clearPersistedGameState } from "@/store/game-machine";
import { prepareTextForTts } from "@/lib/companion/speech-text";

type AppSection = "games" | "lobby" | "private";

interface ChatEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  kind: "human" | "ai" | "director";
}

interface BrowserKeys {
  minimaxApiKey: string;
  minimaxGroupId: string;
  siliconflowApiKey: string;
}

const EMPTY_KEYS: BrowserKeys = {
  minimaxApiKey: "",
  minimaxGroupId: "",
  siliconflowApiKey: "",
};

const SESSION_KEYS = {
  minimaxApiKey: "companion.minimax_api_key",
  minimaxGroupId: "companion.minimax_group_id",
  siliconflowApiKey: "companion.siliconflow_api_key",
} as const;

const PLAYER_NAME_KEY = "companion.player_name";
const WEREWOLF_PLAYER_NAME_KEY = "aicb_human_name";

function readStoredName(key: string) {
  const raw = localStorage.getItem(key);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

const INITIAL_LOBBY_CHAT: ChatEntry[] = [
  {
    id: "lobby-director-welcome",
    speakerId: "director",
    speakerName: "桌面导演",
    text: "大家都在客厅。这里的聊天不会进入游戏记录，也不会出现在角色私聊里。",
    kind: "director",
  },
  {
    id: "lobby-chen-hang-welcome",
    speakerId: "chen-hang",
    speakerName: "陆野",
    text: "人齐了。想闲聊就在这儿，想开局就去点上面的开始游戏。",
    kind: "ai",
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPrivateWelcome(character: CompanionCharacter): ChatEntry[] {
  const openings: Record<string, string> = {
    "lin-xia": "过来坐吧。这里只有我们两个，你今天想聊游戏，还是想聊点别的？",
    "su-yao": "突然单独找我干嘛？先说好，我可没有一直等你。",
    "gu-qinglan": "私聊比牌桌安静多了。说吧，找我什么事？",
    "tang-guo": "欸，只叫我一个人？那你今天得陪我多聊一会儿。",
    "chen-hang": "兄弟局外单聊是吧？行，你说，我不往群里抖。",
    "xiao-man": "哥，你可算想起还有个妹妹了。说吧，什么事？",
    "shen-ning": "怎么单独过来了？是有事情不方便当着大家说吗？",
  };
  return [
    {
      id: `private-welcome-${character.id}`,
      speakerId: character.id,
      speakerName: character.name,
      text: openings[character.id] || "这里没有别人，慢慢说。",
      kind: "ai",
    },
  ];
}

function demoReply(characterId: string, playerText: string) {
  const character = getCompanionCharacter(characterId);
  const templates: Record<string, string> = {
    "lin-xia": playerText.includes("怀疑")
      ? "你先把最不舒服的那一点说清楚，我陪你一起顺。"
      : "我在听。你不用急着给结论，慢慢讲就好。",
    "su-yao": "我只是觉得你刚才那句有点躲问题。你把它说清楚，我就认真听。",
    "gu-qinglan": "先把情绪和事实分开。你真正想确认的是什么？",
    "tang-guo": "那我可记住了！你待会儿要是改口，我一定第一个抓你。",
    "chen-hang": "行，你把话讲全。兄弟归兄弟，我可不负责无脑站边。",
    "xiao-man": "你每次心虚就特别爱说一大串。不过这次我先听你讲完。",
    "shen-ning": "慢一点。先说你掌握了什么，再说你担心什么。",
  };
  return templates[characterId] || `${character?.name ?? "她"}认真想了想，暂时没有补充。`;
}

function SeatCard({
  id,
  seat,
  name,
  relationLabel,
  color,
  active,
  selected,
  onClick,
}: {
  id: string;
  seat: number;
  name: string;
  relationLabel: string;
  color: string;
  active: boolean;
  selected: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.seatCard} ${active ? styles.seatActive : ""} ${selected ? styles.seatSelected : ""}`}
      onClick={onClick}
      aria-label={`${seat}号位 ${name} ${relationLabel}`}
    >
      <span className={styles.seatNumber}>{seat}</span>
      <span className={styles.avatar} style={{ "--avatar-color": color } as CSSProperties}>
        {id === "human" ? "你" : name.slice(-1)}
      </span>
      <span className={styles.seatCopy}>
        <strong>{name}</strong>
        <small>{relationLabel}</small>
      </span>
      {active ? <span className={styles.speakingDot}>发言中</span> : null}
    </button>
  );
}

export default function CompanionPrototypePage() {
  const router = useRouter();
  const [section, setSection] = useState<AppSection>("lobby");
  const [privateCharacterId, setPrivateCharacterId] = useState("lin-xia");
  const [lobbyMessages, setLobbyMessages] = useState<ChatEntry[]>(INITIAL_LOBBY_CHAT);
  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatEntry[]>>({});
  const [draft, setDraft] = useState("");
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [directorNote, setDirectorNote] = useState("大厅聊天与游戏记录完全隔离");
  const [keys, setKeys] = useState<BrowserKeys>(EMPTY_KEYS);
  const [keyDraft, setKeyDraft] = useState<BrowserKeys>(EMPTY_KEYS);
  const [showSettings, setShowSettings] = useState(false);
  const [playerName, setPlayerName] = useState("你");
  const [playerNameDraft, setPlayerNameDraft] = useState("你");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const directorMemoryRef = useRef<DirectorMemory>(createDirectorMemory());
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFinishRef = useRef<(() => void) | null>(null);
  const voiceEnabledRef = useRef(true);
  const voiceQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const restored = {
      minimaxApiKey: sessionStorage.getItem(SESSION_KEYS.minimaxApiKey) || "",
      minimaxGroupId: sessionStorage.getItem(SESSION_KEYS.minimaxGroupId) || "",
      siliconflowApiKey: sessionStorage.getItem(SESSION_KEYS.siliconflowApiKey) || "",
    };
    setKeys(restored);
    setKeyDraft(restored);
    const restoredName = (readStoredName(PLAYER_NAME_KEY) || readStoredName(WEREWOLF_PLAYER_NAME_KEY) || "你").trim().slice(0, 12) || "你";
    setPlayerName(restoredName);
    setPlayerNameDraft(restoredName);
  }, []);

  const selectedPrivateCharacter = useMemo(
    () => getCompanionCharacter(privateCharacterId) ?? COMPANION_CHARACTERS[0],
    [privateCharacterId],
  );

  const currentMessages = useMemo(() => {
    if (section === "lobby") return lobbyMessages;
    if (section === "private") {
      return privateMessages[privateCharacterId] ?? createPrivateWelcome(selectedPrivateCharacter);
    }
    return [];
  }, [lobbyMessages, privateCharacterId, privateMessages, section, selectedPrivateCharacter]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentMessages, isResponding]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioFinishRef.current?.();
    };
  }, []);

  const replaceCurrentMessages = useCallback((next: ChatEntry[] | ((current: ChatEntry[]) => ChatEntry[])) => {
    if (section === "lobby") {
      setLobbyMessages(next);
      return;
    }
    if (section === "private") {
      setPrivateMessages((all) => {
        const current = all[privateCharacterId] ?? createPrivateWelcome(selectedPrivateCharacter);
        return {
          ...all,
          [privateCharacterId]: typeof next === "function" ? next(current) : next,
        };
      });
    }
  }, [privateCharacterId, section, selectedPrivateCharacter]);

  const switchSection = useCallback((next: AppSection) => {
    setSection(next);
    setDraft("");
    setPendingTranscript(null);
    setActiveCharacterId(null);
    setDirectorNote(
      next === "lobby"
        ? "大厅聊天与游戏记录完全隔离"
        : next === "private"
          ? `只显示你和${selectedPrivateCharacter.name}的私聊`
          : "选择一款桌游后进入独立游戏界面",
    );
  }, [selectedPrivateCharacter.name]);

  const saveKeys = useCallback(() => {
    (Object.keys(SESSION_KEYS) as Array<keyof BrowserKeys>).forEach((key) => {
      const value = keyDraft[key].trim();
      if (value) sessionStorage.setItem(SESSION_KEYS[key], value);
      else sessionStorage.removeItem(SESSION_KEYS[key]);
    });
    setKeys({
      minimaxApiKey: keyDraft.minimaxApiKey.trim(),
      minimaxGroupId: keyDraft.minimaxGroupId.trim(),
      siliconflowApiKey: keyDraft.siliconflowApiKey.trim(),
    });
    const nextPlayerName = playerNameDraft.trim().slice(0, 12) || "你";
    localStorage.setItem(PLAYER_NAME_KEY, nextPlayerName);
    localStorage.setItem(WEREWOLF_PLAYER_NAME_KEY, JSON.stringify(nextPlayerName));
    setPlayerName(nextPlayerName);
    setPlayerNameDraft(nextPlayerName);
    setShowSettings(false);
  }, [keyDraft, playerNameDraft]);

  const synthesizeAndPlay = useCallback(async (characterId: string, text: string) => {
    if (!voiceEnabledRef.current) return;
    const character = getCompanionCharacter(characterId);
    if (!character) return;
    const spokenText = prepareTextForTts(text);
    if (!spokenText) return;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (keys.minimaxApiKey) headers["X-Minimax-Api-Key"] = keys.minimaxApiKey;
    if (keys.minimaxGroupId) headers["X-Minimax-Group-Id"] = keys.minimaxGroupId;

    try {
      const response = await fetch("/api/companion/tts", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: spokenText, voiceId: character.voiceId }),
      });
      if (!response.ok || !voiceEnabledRef.current) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        const finish = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          if (audioFinishRef.current === finish) audioFinishRef.current = null;
          resolve();
        };
        audioFinishRef.current = finish;
        audio.addEventListener("ended", finish, { once: true });
        audio.addEventListener("error", finish, { once: true });
        void audio.play().catch(finish);
      });
    } catch {
      // Text chat remains usable if a voice fails.
    }
  }, [keys.minimaxApiKey, keys.minimaxGroupId]);

  const enqueueVoice = useCallback((characterId: string, text: string) => {
    if (!voiceEnabledRef.current) return;
    voiceQueueRef.current = voiceQueueRef.current
      .catch(() => undefined)
      .then(() => synthesizeAndPlay(characterId, text));
  }, [synthesizeAndPlay]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((current) => {
      const next = !current;
      voiceEnabledRef.current = next;
      if (!next) {
        audioRef.current?.pause();
        audioFinishRef.current?.();
        voiceQueueRef.current = Promise.resolve();
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (rawText?: string) => {
    if (section === "games") return;
    const playerText = (rawText ?? draft).trim();
    if (!playerText || isResponding) return;

    const humanMessage: ChatEntry = {
      id: makeId("human"),
      speakerId: "human",
      speakerName: playerName,
      text: playerText,
      kind: "human",
    };
    const historyBeforeReply = [...currentMessages, humanMessage];
    replaceCurrentMessages(historyBeforeReply);
    setDraft("");
    setPendingTranscript(null);
    setIsResponding(true);

    let characterIds: string[];
    if (section === "private") {
      characterIds = [privateCharacterId];
      setDirectorNote(`私聊对象：${selectedPrivateCharacter.name}`);
    } else {
      const decision = directTableTurn(
        playerText,
        historyBeforeReply.map((message) => ({ speakerId: message.speakerId, text: message.text })),
        directorMemoryRef.current,
      );
      directorMemoryRef.current = decision.nextMemory;
      characterIds = decision.selected.map((item) => item.character.id);
      setDirectorNote(`本轮回应：${decision.selected.map((item) => item.character.name).join("、")}`);
      replaceCurrentMessages((current) => [
        ...current,
        {
          id: makeId("director"),
          speakerId: "director",
          speakerName: "桌面导演",
          text: `${decision.note} 镜头给到 ${decision.selected.map((item) => item.character.name).join("、")}。`,
          kind: "director",
        },
      ]);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (keys.minimaxApiKey) headers["X-Minimax-Api-Key"] = keys.minimaxApiKey;

    let replies: Array<{ characterId: string; text: string }>;
    try {
      const response = await fetch("/api/companion/respond", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: section,
          playerText,
          characterIds,
          history: historyBeforeReply.map((message) => ({
            speakerId: message.speakerId,
            speakerName: message.speakerName,
            text: message.text,
          })),
        }),
      });
      const result = (await response.json()) as { replies?: Array<{ characterId: string; text: string }> };
      if (!response.ok || !Array.isArray(result.replies)) throw new Error("live model unavailable");
      replies = result.replies;
    } catch {
      replies = characterIds.map((characterId) => ({ characterId, text: demoReply(characterId, playerText) }));
      setDirectorNote((current) => `${current} · 当前使用离线示例台词`);
    }

    for (const reply of replies) {
      const character = getCompanionCharacter(reply.characterId);
      if (!character) continue;
      setActiveCharacterId(character.id);
      replaceCurrentMessages((current) => [
        ...current,
        {
          id: makeId(character.id),
          speakerId: character.id,
          speakerName: character.name,
          text: reply.text,
          kind: "ai",
        },
      ]);
      enqueueVoice(character.id, reply.text);
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    }

    setActiveCharacterId(null);
    setIsResponding(false);
  }, [currentMessages, draft, enqueueVoice, isResponding, keys.minimaxApiKey, playerName, privateCharacterId, replaceCurrentMessages, section, selectedPrivateCharacter.name]);

  const visibleCharacters = section === "private" ? [selectedPrivateCharacter] : COMPANION_CHARACTERS;
  const isChatSection = section !== "games";

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>AI BOARD COMPANION</span>
          <h1>今晚有局</h1>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.iconButton} onClick={toggleVoice}>
            {voiceEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
            <span>{voiceEnabled ? "语音开" : "语音关"}</span>
          </button>
          <button type="button" className={styles.iconButton} onClick={() => setShowSettings(true)}>
            <GearSix size={20} />
            <span>设置</span>
          </button>
        </div>
      </header>

      <nav className={styles.roomTabs} aria-label="主要功能">
        {([
          ["games", "开始游戏", <GameController key="games" size={18} />],
          ["lobby", "八人大厅", <UsersThree key="lobby" size={18} />],
          ["private", "角色私聊", <Heart key="private" size={18} />],
        ] as Array<[AppSection, string, React.ReactNode]>).map(([value, label, icon]) => (
          <button key={value} type="button" className={section === value ? styles.tabActive : ""} onClick={() => switchSection(value)}>
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <section className={styles.workspace}>
        {section === "games" ? (
          <div className={styles.gameLibrary}>
            <header>
              <span className={styles.eyebrow}>选择桌游</span>
              <h2>今天想玩什么？</h2>
              <p>每款游戏拥有独立的规则状态和聊天记录；大厅与私聊不会混进对局。</p>
            </header>
            <div className={styles.gameCards}>
              <article className={styles.gameCardFeatured}>
                <span className={styles.availableBadge}>推荐原型 · 8 人</span>
                <div className={styles.gameIcon}>UNO</div>
                <h3>UNO</h3>
                <p>规则和机器人策略全部在浏览器本地运行；MiniMax 只负责角色对公开出牌事件的聊天评价。</p>
                <button type="button" className={styles.launchButton} onClick={() => router.push("/companion/uno")}>
                  <Play size={18} weight="fill" />
                  进入 UNO
                </button>
              </article>
              <article className={styles.gameCardFeatured}>
                <span className={styles.availableBadge}>新原型 · 4 人</span>
                <div className={styles.gameIcon}><Airplane size={38} weight="duotone" /></div>
                <h3>飞行棋</h3>
                <p>开局前由你挑选三位 AI 陪玩；起飞、跳跃、撞机与机器人走棋全部在本地运行，MiniMax 只负责根据当前局势和你聊天。</p>
                <button type="button" className={styles.launchButton} onClick={() => router.push("/companion/aeroplane")}>
                  <Play size={18} weight="fill" />
                  进入飞行棋
                </button>
              </article>
              <article className={styles.gameCardFeatured}>
                <span className={styles.availableBadge}>新游戏 · 4 人</span>
                <div className={styles.gameIcon}><Heart size={38} weight="duotone" /></div>
                <h3>心动密函</h3>
                <p>经典四人情书玩法。你选择三位 AI 陪玩，本地引擎负责隐藏手牌、猜牌、淘汰与好感结算，角色只根据公开事件和你互动。</p>
                <button type="button" className={styles.launchButton} onClick={() => router.push("/companion/love-letter")}>
                  <Play size={18} weight="fill" />
                  进入心动密函
                </button>
              </article>
              <article className={styles.gameCardFeatured}>
                <span className={styles.availableBadge}>新游戏 · 5 人</span>
                <div className={styles.gameIcon}><DiceFive size={38} weight="duotone" /></div>
                <h3>雾杯夜话</h3>
                <p>五人吹牛骰子。你选择四位 AI 陪玩，本地引擎负责隐藏骰子、合法叫点、质疑开盅与淘汰，角色只围绕公开局势和你互相诈唬。</p>
                <button type="button" className={styles.launchButton} onClick={() => router.push("/companion/liars-dice")}>
                  <Play size={18} weight="fill" />
                  进入吹牛骰子
                </button>
              </article>
              <article className={styles.gameCardFeatured}>
                <span className={styles.availableBadge}>已可游玩 · 8 人</span>
                <div className={styles.gameIcon}><ChatsCircle size={38} weight="duotone" /></div>
                <h3>狼人杀</h3>
                <p>固定八人配置：2 村民、预言家、女巫、猎人、2 狼人和白狼王；AI 负责按身份行动并陪你讨论。</p>
                <button type="button" className={styles.launchButton} onClick={() => {
                  clearPersistedGameState();
                  router.push("/companion/werewolf");
                }}>
                  <Play size={18} weight="fill" />
                  进入狼人杀
                </button>
              </article>
            </div>
          </div>
        ) : (
          <div className={styles.communityShell}>
            <aside className={styles.peoplePanel}>
              {section === "private" ? (
                <label className={styles.privatePicker}>
                  <span>私聊对象</span>
                  <select
                    value={privateCharacterId}
                    onChange={(event) => {
                      setPrivateCharacterId(event.target.value);
                      const next = getCompanionCharacter(event.target.value);
                      setDirectorNote(`只显示你和${next?.name ?? "该角色"}的私聊`);
                    }}
                  >
                    {COMPANION_CHARACTERS.map((character) => (
                      <option key={character.id} value={character.id}>{character.name} · {character.relationLabel}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className={styles.seatGrid}>
                {section === "lobby" ? <SeatCard {...HUMAN_SEAT} name={playerName} active={false} selected={false} /> : null}
                {visibleCharacters.map((character) => (
                  <SeatCard
                    key={character.id}
                    {...character}
                    active={activeCharacterId === character.id}
                    selected={section === "private" && privateCharacterId === character.id}
                    onClick={() => {
                      if (section === "private") {
                        setPrivateCharacterId(character.id);
                        setDirectorNote(`只显示你和${character.name}的私聊`);
                      } else {
                        setDraft((current) => `${current}${current ? " " : ""}${character.name}，`);
                      }
                    }}
                  />
                ))}
              </div>
            </aside>

            <section className={styles.chatPanel}>
              <div className={styles.phaseBar}>
                <div>
                  <strong>{section === "lobby" ? "八人大厅" : `与 ${selectedPrivateCharacter.name} 私聊`}</strong>
                  <span>{directorNote}</span>
                </div>
                {isResponding ? <span className={styles.thinking}>角色正在接话…</span> : <span className={styles.ready}>等待发言</span>}
              </div>

              <div className={styles.feed} aria-live="polite">
                {currentMessages.map((message) => {
                  const character = getCompanionCharacter(message.speakerId);
                  return (
                    <article key={message.id} className={`${styles.message} ${styles[message.kind]}`}>
                      <div className={styles.messageMeta}>
                        <span style={{ color: character?.color }}>{message.speakerName}</span>
                        {character ? <small>{character.relationLabel}</small> : null}
                      </div>
                      <p>{message.text}</p>
                    </article>
                  );
                })}
                <div ref={feedEndRef} />
              </div>

              {pendingTranscript !== null ? (
                <div className={styles.transcriptConfirm}>
                  <label htmlFor="voice-transcript">语音识别结果 · 确认后才会发送</label>
                  <textarea id="voice-transcript" value={pendingTranscript} onChange={(event) => setPendingTranscript(event.target.value)} autoFocus />
                  <div>
                    <button type="button" onClick={() => setPendingTranscript(null)}>取消</button>
                    <button type="button" className={styles.primaryButton} onClick={() => void sendMessage(pendingTranscript)}>确认发送</button>
                  </div>
                </div>
              ) : (
                <div className={styles.composer}>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={section === "private" ? `和${selectedPrivateCharacter.name}说点什么…` : "说点什么，或直接点名某个角色…"}
                    disabled={isResponding}
                  />
                  <div className={styles.composerActions}>
                    <VoiceRecorder
                      disabled={isResponding}
                      holdToTalk
                      sttApiKey={keys.siliconflowApiKey}
                      onTranscript={(text) => setPendingTranscript(text)}
                    />
                    <button type="button" className={styles.sendButton} disabled={!draft.trim() || isResponding} onClick={() => void sendMessage()}>
                      <PaperPlaneTilt size={17} weight="fill" />
                      发送
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      <footer className={styles.prototypeNote}>
        <strong>记录隔离：</strong>{isChatSection ? (section === "lobby" ? "当前仅显示大厅记录。" : `当前仅显示与${selectedPrivateCharacter.name}的私聊记录。`) : "游戏对局使用独立记录。"}
      </footer>

      {showSettings ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setShowSettings(false)}>
          <section className={styles.settingsModal} role="dialog" aria-modal="true" aria-label="模型密钥" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span className={styles.eyebrow}>仅保存到当前浏览器会话</span>
                <h2>模型连接</h2>
              </div>
              <button type="button" onClick={() => setShowSettings(false)}>×</button>
            </header>
            <label>
              你的称呼
              <input type="text" maxLength={12} value={playerNameDraft} onChange={(event) => setPlayerNameDraft(event.target.value)} placeholder="例如：小浩" />
            </label>
            <label>
              MiniMax API Key
              <input type="password" autoComplete="off" value={keyDraft.minimaxApiKey} onChange={(event) => setKeyDraft((current) => ({ ...current, minimaxApiKey: event.target.value }))} />
            </label>
            <label>
              MiniMax Group ID
              <input type="password" autoComplete="off" value={keyDraft.minimaxGroupId} onChange={(event) => setKeyDraft((current) => ({ ...current, minimaxGroupId: event.target.value }))} />
            </label>
            <label>
              硅基流动 API Key
              <input type="password" autoComplete="off" value={keyDraft.siliconflowApiKey} onChange={(event) => setKeyDraft((current) => ({ ...current, siliconflowApiKey: event.target.value }))} />
            </label>
            <p>密钥不会写入项目文件，也不会由服务端持久化。关闭浏览器标签页后会话存储自动清除。</p>
            <button type="button" className={styles.primaryButton} onClick={saveKeys}>保存到本次会话</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
