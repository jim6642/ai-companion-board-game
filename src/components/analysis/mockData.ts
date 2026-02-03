import type { GameAnalysisData, PlayerSnapshot, RoundState } from "@/types/analysis";

const PLAYERS: PlayerSnapshot[] = [
  { seat: 1, name: "QiLin", avatar: "QiLin", role: "Seer", alignment: "village", isAlive: false, deathDay: 1, deathCause: "exiled", isHumanPlayer: true },
  { seat: 2, name: "DeepSeek 2", avatar: "DeepSeek2", role: "Villager", alignment: "village", isAlive: true },
  { seat: 3, name: "glm", avatar: "glm", role: "Villager", alignment: "village", isAlive: true },
  { seat: 4, name: "glm 3", avatar: "glm3", role: "Hunter", alignment: "village", isAlive: true },
  { seat: 5, name: "Gemini", avatar: "Gemini", role: "Witch", alignment: "village", isAlive: false, deathDay: 2, deathCause: "killed" },
  { seat: 6, name: "DeepSeek", avatar: "DeepSeek", role: "Guard", alignment: "village", isAlive: true },
  { seat: 7, name: "glm 2", avatar: "glm2", role: "Werewolf", alignment: "wolf", isAlive: true, isSheriff: true },
  { seat: 8, name: "minimax 2", avatar: "minimax2", role: "Werewolf", alignment: "wolf", isAlive: true },
  { seat: 9, name: "Gemini 2", avatar: "Gemini2", role: "Werewolf", alignment: "wolf", isAlive: true },
  { seat: 10, name: "Qwen", avatar: "Qwen", role: "Villager", alignment: "village", isAlive: false, deathDay: 2, deathCause: "exiled" },
  { seat: 11, name: "DeepSeek 3", avatar: "DeepSeek3", role: "Werewolf", alignment: "wolf", isAlive: true },
  { seat: 12, name: "minimax", avatar: "minimax", role: "Villager", alignment: "village", isAlive: false, deathDay: 2, deathCause: "poisoned" },
];

const ROUND_STATES: RoundState[] = [
  {
    day: 0,
    phase: "day",
    aliveCount: { village: 8, wolf: 4 },
    players: PLAYERS.map(p => ({ ...p, isAlive: true, isSheriff: false })),
  },
  {
    day: 1,
    phase: "day",
    sheriffSeat: 7,
    aliveCount: { village: 7, wolf: 4 },
    players: PLAYERS.map(p => ({
      ...p,
      isAlive: p.seat !== 1,
      isSheriff: p.seat === 7,
      deathDay: p.seat === 1 ? 1 : undefined,
      deathCause: p.seat === 1 ? "exiled" : undefined,
    })),
  },
  {
    day: 2,
    phase: "day",
    sheriffSeat: 7,
    aliveCount: { village: 4, wolf: 4 },
    players: PLAYERS.map(p => ({
      ...p,
      isAlive: ![1, 5, 10, 12].includes(p.seat),
      isSheriff: p.seat === 7,
      deathDay: p.seat === 1 ? 1 : [5, 10, 12].includes(p.seat) ? 2 : undefined,
      deathCause: p.seat === 1 ? "exiled" : p.seat === 5 ? "killed" : p.seat === 10 ? "exiled" : p.seat === 12 ? "poisoned" : undefined,
    })),
  },
];

export const MOCK_ANALYSIS_DATA: GameAnalysisData = {
  gameId: "9fe315d0-e5c4-43a0-b8e3-38cc528f4807",
  timestamp: Date.now(),
  duration: 2821,
  playerCount: 12,
  result: "wolf_win",

  players: PLAYERS,
  roundStates: ROUND_STATES,

  awards: {
    mvp: {
      playerId: "player-7",
      playerName: "glm 2",
      reason: "悍跳夺警\n控场到底",
      avatar: "glm2",
      role: "Werewolf",
    },
    svp: {
      playerId: "player-1",
      playerName: "QiLin",
      reason: "首验查狼\n惨遭归票",
      avatar: "QiLin",
      role: "Seer",
    },
  },

  timeline: [
    {
      day: 1,
      summary:
        "6号守卫自守，狼人刀3号被女巫救起，平安夜。1号(你)跳预言家报出9号查杀，7号悍跳对立查杀你。7号以10票当选警长，你被全票放逐出局。",
      nightEvents: [
        {
          type: "guard",
          source: "6",
          target: "6",
          result: "自守",
        },
        {
          type: "kill",
          source: "狼人",
          target: "3",
          blocked: true,
        },
        {
          type: "save",
          source: "5",
          target: "3",
        },
        {
          type: "check",
          source: "1",
          target: "9",
          result: "狼人",
        },
      ],
      dayEvents: [
        {
          type: "badge",
          target: "7",
          voteCount: 10,
          votes: [
            { voterSeat: 2, targetSeat: 1 }, { voterSeat: 3, targetSeat: 7 }, { voterSeat: 4, targetSeat: 7 },
            { voterSeat: 5, targetSeat: 7 }, { voterSeat: 6, targetSeat: 7 }, { voterSeat: 8, targetSeat: 7 },
            { voterSeat: 9, targetSeat: 7 }, { voterSeat: 10, targetSeat: 1 }, { voterSeat: 11, targetSeat: 7 },
            { voterSeat: 12, targetSeat: 7 },
          ],
        },
        {
          type: "exile",
          target: "1",
          voteCount: 11,
          votes: [
            { voterSeat: 2, targetSeat: 1 }, { voterSeat: 3, targetSeat: 1 }, { voterSeat: 4, targetSeat: 1 },
            { voterSeat: 5, targetSeat: 1 }, { voterSeat: 6, targetSeat: 1 }, { voterSeat: 7, targetSeat: 1 },
            { voterSeat: 8, targetSeat: 1 }, { voterSeat: 9, targetSeat: 7 }, { voterSeat: 10, targetSeat: 7 },
            { voterSeat: 11, targetSeat: 1 }, { voterSeat: 12, targetSeat: 1 },
          ],
        },
      ],
      dayPhases: [
        {
          type: "election",
          summary: "1号和7号均声明自己是预言家并上警竞选。1号查杀9号，7号反查杀1号。",
          speeches: [
            { seat: 1, content: "我是预言家，昨晚看了9号底牌，是狼人，查杀。警徽流3号和7号。守卫藏好自己不要暴露，在女巫用药救我之前不要守护我，防止奶穿。" },
            { seat: 7, content: "我是预言家，首夜验人结果是1号查杀。1号首置位直接查杀后置位9号，这种激进的抢警徽打法，狼面远大于神职。" },
          ],
          event: {
            type: "badge",
            target: "7",
            voteCount: 10,
            votes: [
              { voterSeat: 2, targetSeat: 1 }, { voterSeat: 3, targetSeat: 7 }, { voterSeat: 4, targetSeat: 7 },
              { voterSeat: 5, targetSeat: 7 }, { voterSeat: 6, targetSeat: 7 }, { voterSeat: 8, targetSeat: 7 },
              { voterSeat: 9, targetSeat: 7 }, { voterSeat: 10, targetSeat: 1 }, { voterSeat: 11, targetSeat: 7 },
              { voterSeat: 12, targetSeat: 7 },
            ],
          },
        },
        {
          type: "discussion",
          summary: "7号当选警长后，各玩家就两位预言家的真假进行讨论。最终1号被全票放逐。",
          speeches: [
            { seat: 8, content: "目前场上两个预言家对跳，1号查杀9号，7号查杀1号，信息量很大但我需要再听一轮发言才能判断。" },
            { seat: 9, content: "这里是接了1号查杀的9号，我底牌绝对是好人牌，1号这种首置位起跳强搏杀的行为太鲁莽了。我站边7号。" },
            { seat: 10, content: "当前核心矛盾是1号和7号对跳预言家。7号拿到10票上警，说明多数人已初步站边他。我暂时倾向7号是真预。" },
            { seat: 2, content: "1号和7号对跳，我暂时看不清局势，先听听其他人的发言。" },
            { seat: 3, content: "昨晚平安夜，说明女巫救人了。两边都有可能，但7号的逻辑更稳。" },
          ],
          event: {
            type: "exile",
            target: "1",
            voteCount: 11,
            votes: [
              { voterSeat: 2, targetSeat: 1 }, { voterSeat: 3, targetSeat: 1 }, { voterSeat: 4, targetSeat: 1 },
              { voterSeat: 5, targetSeat: 1 }, { voterSeat: 6, targetSeat: 1 }, { voterSeat: 7, targetSeat: 1 },
              { voterSeat: 8, targetSeat: 1 }, { voterSeat: 9, targetSeat: 7 }, { voterSeat: 10, targetSeat: 7 },
              { voterSeat: 11, targetSeat: 1 }, { voterSeat: 12, targetSeat: 1 },
            ],
          },
        },
      ],
    },
    {
      day: 2,
      summary:
        "狼人刀5号女巫，女巫临死毒12号。10号质疑7、9联动被放逐。狼人成功控场。",
      nightEvents: [
        {
          type: "kill",
          source: "狼人",
          target: "5",
        },
        {
          type: "poison",
          source: "5",
          target: "12",
        },
      ],
      dayEvents: [
        {
          type: "exile",
          target: "10",
          voteCount: 8,
          votes: [
            { voterSeat: 2, targetSeat: 10 }, { voterSeat: 3, targetSeat: 10 }, { voterSeat: 4, targetSeat: 10 },
            { voterSeat: 6, targetSeat: 10 }, { voterSeat: 7, targetSeat: 10 }, { voterSeat: 8, targetSeat: 10 },
            { voterSeat: 9, targetSeat: 10 }, { voterSeat: 11, targetSeat: 10 },
          ],
        },
      ],
      dayPhases: [
        {
          type: "discussion",
          summary: "昨晚5号女巫和12号村民双死。10号质疑7号和9号是狼人联动，被全场归票放逐。",
          speeches: [
            { seat: 2, content: "昨晚死了两个人，5号女巫和12号，局势对好人很不利。" },
            { seat: 3, content: "7号警长验12号是好人，但12号死了，有点奇怪。" },
            { seat: 7, content: "我验了12号是好人，狼人故意刀我验的人来混淆视听。10号很可疑，建议投他。" },
            { seat: 10, content: "7号和9号明显是一伙的！昨天就是他们联手投死了1号真预言家！" },
          ],
          event: {
            type: "exile",
            target: "10",
            voteCount: 8,
            votes: [
              { voterSeat: 2, targetSeat: 10 }, { voterSeat: 3, targetSeat: 10 }, { voterSeat: 4, targetSeat: 10 },
              { voterSeat: 6, targetSeat: 10 }, { voterSeat: 7, targetSeat: 10 }, { voterSeat: 8, targetSeat: 10 },
              { voterSeat: 9, targetSeat: 10 }, { voterSeat: 11, targetSeat: 10 },
            ],
          },
        },
      ],
    },
  ],

  personalStats: {
    role: "Seer",
    userName: "QiLin",
    avatar: "QiLin",
    alignment: "village",
    tags: ["洞悉之眼", "天妒英才"],
    radarStats: {
      logic: 78,
      speech: 85,
      survival: 10,
      skillOrHide: 90,
      voteOrTicket: 0,
    },
    highlightQuote:
      "我是真预言家，首验9号是狼人！7号悍跳狼，警徽流为7、9、2，大家不要被带节奏！",
    totalScore: 52,
  },

  reviews: [
    {
      fromPlayerId: "player-5",
      fromCharacterName: "Gemini",
      avatar: "Gemini",
      content:
        "我救了3号银水证明你的身份，但场上被7号带节奏太厉害了，可惜没能保住你。",
      relation: "ally",
      role: "Witch",
    },
    {
      fromPlayerId: "player-6",
      fromCharacterName: "DeepSeek",
      avatar: "DeepSeek",
      content:
        "守卫第一晚自守了，没能守到你。早知道7号是狼就该守你了，抱歉。",
      relation: "ally",
      role: "Guard",
    },
    {
      fromPlayerId: "player-7",
      fromCharacterName: "glm 2",
      avatar: "glm2",
      content:
        "哈哈，你验得确实准，可惜场上没人信你。悍跳拿警徽，这局赢得舒服！",
      relation: "enemy",
      role: "Werewolf",
    },
  ],
};
