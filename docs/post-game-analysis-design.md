# 赛后复盘页面设计文档

## 1. 概述
本页面旨在游戏结束后为玩家提供详尽的对局回顾，包括胜负结算、关键事件复盘、个人表现分析及趣味性的选手互评，以增强用户的获得感和分享欲。

## 2. 核心模块与功能

### 2.1 对局总览 (Game Overview)
展示本局游戏的基础结果信息。

*   **UI 元素**：
    *   **胜负横幅**：醒目展示“好人获胜”或“狼人获胜” (根据 `GameState.winner`)。
    *   **对局编号**：`GameState.gameId` 或 `session_id` (截取部分)。
    *   **用户名称**：`humanPlayer.displayName` (明确展示这是谁的复盘)。
    *   **MVP & SVP**：
        *   **MVP (Most Valuable Player)**：获胜阵营表现最佳者。
        *   **SVP (Second Valuable Player)**：败方阵营表现最佳者。
        *   *获取方式*：游戏结束时由 AI 根据贡献度（存活轮次、投票正确率、技能成功率）评选，或基于规则的简单加权计算。

### 2.2 复盘回顾 (Timeline Review)
按游戏时间线（天数/轮次）展示关键剧情，支持交互式回溯。

*   **数据源**：`GameState.dailySummaries`, `GameState.nightHistory`, `GameState.dayHistory`, `GameState.messages`, `GameState.players`.
*   **核心组件**：
    *   **身份总览表 (Identity Dashboard)**：
        *   **布局**：角色按照游戏内的座位号分为两排排列（1-6号上排，7-12号下排）。
        *   **顶部信息**：
            *   当前轮次状态（如：游戏开局、第1天结束、第2天结束）。
            *   存活统计：好人数量 vs 狼人数量。
        *   **角色状态**：
            *   显示头像、座位号、角色名称。
            *   **头像来源**：必须与游戏中生成的头像保持一致（需在游戏进行时记录各角色头像）。
            *   **出局状态**：根据当前选中的时间点，若该角色已出局，头像置灰并标记出局方式（被刀/被票/被毒等）。
            *   **警徽状态**：在警长头像旁显示金色皇冠图标。
            *   **身份揭示**：默认展示所有角色身份（上帝视角）。
            *   **点击交互**：点击头像弹出角色详情弹窗，显示座位号、角色、阵营、存活状态、死因等信息。
        *   **时间轴进度条 (Timeline Slider)**：
            *   **交互**：底部设有进度条，用户可左右拖动或点击节点跳转到不同轮次。
            *   **轮次标签**：只显示轮次（开局、D1、D2），不区分白天和夜晚。
            *   **默认状态**：未拖动时（或默认进入页面时），展示**游戏开局**状态（所有角色存活，身份明牌）。
            *   **联动效果**：
                *   拖动进度条时，**身份总览表**实时回溯到该轮次结束时的状态（例如：拖动到D2，第1、2天死的人头像置灰，警徽流转）。
                *   下方的**轮次详情**区域自动切换展示该轮次的关键事件和发言，**其他轮次隐藏**。
        *   **轮次详情 (Round Details)**（随进度条切换）：
            *   **默认展示**：用户未拖动进度条时，默认展示**所有轮次**的关键信息流。
            *   **选中展示**：用户拖动进度条选中特定轮次后，**仅展示该轮次**的详情，其他轮次隐藏。
            *   **一句话概括**：例如"昨晚平安夜，白天3号被放逐"。
            *   **夜晚详情**：
                *   使用**座位号**展示（如"6号守护6号"、"狼人刀3号"），不显示玩家名称。
                *   狼人刀法：X号刀了Y号。
                *   女巫行动：X号救/毒了Y号。
                *   预言家查验：X号查验Y号，结果为狼人/好人。
                *   守卫目标：X号守护了Y号。
            *   **白天详情**：
                *   **白天阶段划分**：区分竞选阶段(election)、讨论阶段(discussion)、PK阶段(pk)。
                *   警长竞选（仅第1天）：当选者及票数，支持点击查看投票详情弹窗。
                *   出局投票：放逐者及票数，支持点击查看投票详情弹窗（显示各候选人得票明细）。
                *   **发言详情折叠区**：底部设置可展开的折叠区域，展示该轮次所有玩家的发言内容。

### 2.3 个人战绩 (Personal Performance)
聚焦玩家个人的表现分析。

*   **核心指标**：
    *   **身份**：展示玩家本局角色牌。
    *   **四字称号 (Evaluation Tags)**：
        *   *获取方式*：基于规则判定，按 **优先级 (高光/重大失误 > 技能表现 > 通用数据)** 展示最显著的 **1 个**。
        *   *示例规则*（优先级从高到低）：
            *   **狼人**：
                *   狼队友全部出局仅自己存活获胜 -> “孤狼啸月”
                *   没有狼队友出局赢得胜利 -> “完美猎杀”
                *   悍跳拿到警徽 -> “演技大师”
                *   首夜自刀骗药 -> “绝命赌徒”
                *   被预言家查杀后抗推好人 -> “绝地反击”
                *   被首验查杀 -> “出师未捷”
                *   狼人获胜（普通） -> “嗜血猎手”
                *   狼人失败（普通） -> “长夜难明”
            *   **守卫**：
                *   同守同救（奶穿） -> “致命守护”
                *   成功守卫两人或以上 -> “铜墙铁壁”
                *   成功守卫一人 -> “坚实盾牌”
                *   从未成功守卫 -> “生锈盾牌”
            *   **预言家**：
                *   查杀两只狼或以上 -> “洞悉之眼”
                *   查杀一只狼 -> “初露锋芒”
                *   首夜被刀 -> “天妒英才”
            *   **女巫**：
                *   同守同救（奶穿） -> “药物冲突”
                *   毒死狼 -> “致命毒药”
                *   救对人（救了好人） -> “妙手回春”
                *   救错人（救了狼） -> “助纣为虐”
                *   毒错人（毒了好人） -> “误入歧途”
            *   **猎人**：
                *   带走狼人 -> “一枪致命”
                *   带走好人 -> “擦枪走火”
                *   未开枪 -> “仁慈之枪”
            *   **平民 (及其他角色通用)**：
                *   投票准确率 ≥ 50% -> “明察秋毫”
                *   35% < 投票准确率 < 50% -> “随波逐流”
                *   投票准确率 ≤ 35% -> “全场划水”
    *   **雷达图分析 (Ability Radar)**：
        *   *维度*（根据阵营区分）：
            *   **好人阵营**：
                1.  **逻辑严密度**：AI 分析发言逻辑漏洞（0-100分）。
                2.  **发言清晰度**：AI 分析表达清晰度（0-100分）。
                3.  **存活评分**：存活轮次 / 总轮次。
                4.  **技能价值**：关键技能是否释放成功（如预言家验狼、女巫救人）。
                5.  **投票准确率**：投给狼人的次数 / 总投票次数（只计算出局投票）。
            *   **狼人阵营**：
                1.  **冲票贡献**：投给好人的次数 / 总投票次数（只计算出局投票）。
                2.  **逻辑严密度**：AI 分析伪逻辑的自洽程度（0-100分）。
                3.  **发言清晰度**：AI 分析表达清晰度（0-100分）。
                4.  **存活评分**：存活轮次 / 总轮次。
                5.  **隐匿程度**：100 - (被指认为狼人的次数 * 权重)。
    *   **本轮金句 (Highlight Quote)**：
        *   *获取方式*：从 `GameState.messages` 中筛选该玩家 AI 判定逻辑最强的一句话。
    *   **交互体验 (Interaction)**：
        *   **卡片翻转**：点击雷达图区域或称号标签，卡片翻转显示称号对应的精美立绘。
        *   **背面展示**：
            *   **立绘图片**：展示称号对应的角色或概念立绘（如"洞悉之眼"对应预言家插画）。
            *   **称号文字**：采用金色丝带样式展示称号名称，具有阴影和渐变效果，增强视觉冲击力。

### 2.4 选手评价 (Player Reviews)
模拟其他角色对玩家的评价，增加沉浸感。

*   **内容**：
    *   **队友评价 (2条)**：来自同一阵营（或认为你是队友的人）。
    *   **对手评价 (1条)**：来自对立阵营。
*   **获取方式**：
    *   在游戏结算阶段，调用 LLM，输入整局 Context，要求以特定角色口吻（Persona）对玩家进行简短点评。
    *   *Prompt 示例*："作为[角色名]，请用一句话评价[玩家名]本局的表现，风格要符合你的人设（傲娇/冷静/鲁莽）。"

### 2.5 分享 (Share)
*   **功能**：生成长图或直接分享链接。
*   **元素**：包含上述核心数据的精简版，附带游戏 Logo 和二维码（指向复盘页 URL）。

---

## 3. 数据结构设计 (TypeScript Interface)

已在 `src/types/analysis.ts` 中定义：

```typescript
// 投票记录
export interface VoteRecord {
  voterSeat: number;
  targetSeat: number;
}

// 夜晚事件
export interface NightEvent {
  type: "kill" | "save" | "poison" | "check" | "guard";
  source: string;  // 座位号，如 "6号"
  target: string;  // 座位号，如 "3号"
  result?: string;
  blocked?: boolean;
}

// 白天事件
export interface DayEvent {
  type: "exile" | "badge" | "hunter_shot";
  target: string;
  voteCount?: number;
  votes?: VoteRecord[];  // 详细投票记录，用于投票详情弹窗
}

// 玩家发言
export interface PlayerSpeech {
  seat: number;
  content: string;
}

// 白天阶段（竞选/讨论/PK）
export interface DayPhase {
  type: "election" | "discussion" | "pk";
  summary?: string;
  speeches?: PlayerSpeech[];
  event?: DayEvent;
}

// 时间轴条目
export interface TimelineEntry {
  day: number;
  summary: string;
  nightEvents: NightEvent[];
  dayEvents: DayEvent[];
  dayPhases?: DayPhase[];  // 可选，细分白天阶段
  speeches?: PlayerSpeech[];
}

// 玩家快照（用于身份总览表回溯）
export interface PlayerSnapshot {
  seat: number;
  name: string;
  avatar: string;
  role: Role;
  alignment: Alignment;
  isAlive: boolean;
  deathDay?: number;
  deathCause?: "killed" | "exiled" | "poisoned" | "shot";
  isSheriff?: boolean;
  isHumanPlayer?: boolean;
}

// 轮次状态
export interface RoundState {
  day: number;
  phase: "night" | "day";
  sheriffSeat?: number;
  aliveCount: { village: number; wolf: number };
  players: PlayerSnapshot[];
}

// 完整分析数据
export interface GameAnalysisData {
  gameId: string;
  timestamp: number;
  duration: number;
  playerCount: number;
  result: "village_win" | "wolf_win";

  awards: {
    mvp: PlayerAward;
    svp: PlayerAward;
  };

  timeline: TimelineEntry[];
  players: PlayerSnapshot[];
  roundStates: RoundState[];
  personalStats: PersonalStats;
  reviews: PlayerReview[];
}
```

## 4. 技术实现路径

### 4.1 数据生成层 (AI Service)
由于 MVP 评选、金句提取、选手评价需要语义理解，建议新增一个 AI 处理流程 `generateGameAnalysis(gameState)`。

*   **时机**：`GAME_END` 状态触发后。
*   **调用**：前端调用 Server Action 或 API Route。
*   **Prompt 策略**：将 `dailySummaries` 和关键 `history` 喂给 LLM，要求输出 JSON 格式的 `GameAnalysisData`。

### 4.2 存储层
*   **短期**：直接存储在 React State / Jotai Atom 中（刷新消失）。
*   **长期**：存入 Supabase `game_sessions` 表的 `analysis_data` JSONB 字段（需修改 Schema）。

### 4.3 UI 组件层
已创建 `src/components/analysis/` 目录，包含以下组件：

| 组件 | 文件 | 状态 | 说明 |
|------|------|------|------|
| **IdentityDashboard** | `IdentityDashboard.tsx` | ✅ 已完成 | 身份总览表，两排角色头像，支持时间轴回溯和点击查看详情 |
| **PlayerDetailModal** | `PlayerDetailModal.tsx` | ✅ 已完成 | 角色详情弹窗，显示座位、角色、阵营、状态等 |
| **TimelineReview** | `TimelineReview.tsx` | ✅ 已完成 | 时间轴复盘，包含夜晚事件、白天阶段、投票详情弹窗 |
| **PlayerReviews** | `PlayerReviews.tsx` | ✅ 已完成 | 选手评价区，垂直列表展示队友/对手评价 |
| **PersonalStats** | `PersonalStats.tsx` | ✅ 已完成 | 个人战绩，含雷达图和称号展示 |
| **GameOverview** | `GameOverview.tsx` | ✅ 已完成 | 对局总览，MVP/SVP展示 |
| **constants** | `constants.ts` | ✅ 已完成 | 角色图标、名称等常量定义 |
| **mockData** | `mockData.ts` | ✅ 已完成 | 开发用 Mock 数据 |

## 5. 开发计划 (TODO)

### 已完成
- [x] 定义 `GameAnalysisData` 类型 (`src/types/analysis.ts`)
- [x] 开发 UI 组件并集成
  - [x] IdentityDashboard（身份总览表 + 时间轴滑块）
  - [x] PlayerDetailModal（角色详情弹窗）
  - [x] TimelineReview（时间轴复盘 + 投票详情弹窗）
  - [x] PlayerReviews（选手评价）
  - [x] PersonalStats（个人战绩 + 卡片翻转立绘）
  - [x] GameOverview（对局总览）
- [x] 实现 `generateGameAnalysis` 工具函数 (`src/lib/game-analysis.ts`)
  - [x] 从 GameState 解析时间轴、玩家快照、轮次状态
  - [x] 基于规则的四字称号评估系统
  - [x] AI 生成 MVP/SVP、金句提取、选手评价
  - [x] 雷达图数据计算（按阵营区分维度）
- [x] 修改 GameMachine，在 `GAME_END` 时触发分析生成
  - [x] 添加 `gameAnalysisAtom`、`analysisLoadingAtom`、`analysisErrorAtom`
  - [x] 创建 `useGameAnalysis` Hook 自动触发分析
- [x] 接入真实数据替换 Mock 数据
  - [x] 分析页面优先使用真实数据，无数据时回退到 Mock

### 待完成
- [x] 分享功能（生成长图/链接）
  - [x] Web Share API 支持（移动端原生分享）
  - [x] 剪贴板复制回退方案
  - [x] 分享文案生成（包含战绩摘要）
  - [ ] 长图生成（需安装 html2canvas，可选增强）
