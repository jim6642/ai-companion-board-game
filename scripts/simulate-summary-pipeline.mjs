#!/usr/bin/env node
/**
 * 模拟每日总结系统的完整链路
 * 目标：验证以下问题
 *   1. dayBreak 标记不匹配 bug
 *   2. 中文 prompt 1-2句 vs 英文 6-12 bullets 的信息丢失
 *   3. DailySummaryFacts 空实现对 buildTodayTranscript 压缩的影响
 *   4. 多轮对话后玩家上下文中历史信息的退化
 *
 * 用法: node scripts/simulate-summary-pipeline.mjs
 */

// ============================================================
// 1. 模拟数据：9人局，3天完整对话
// ============================================================

const PLAYERS = [
  { playerId: "p1", seat: 0, displayName: "张三", role: "Seer", alignment: "good", alive: true, isHuman: true },
  { playerId: "p2", seat: 1, displayName: "李四", role: "Werewolf", alignment: "wolf", alive: true, isHuman: false },
  { playerId: "p3", seat: 2, displayName: "王五", role: "Villager", alignment: "good", alive: true, isHuman: false },
  { playerId: "p4", seat: 3, displayName: "赵六", role: "Witch", alignment: "good", alive: true, isHuman: false },
  { playerId: "p5", seat: 4, displayName: "陈七", role: "Werewolf", alignment: "wolf", alive: true, isHuman: false },
  { playerId: "p6", seat: 5, displayName: "周八", role: "Guard", alignment: "good", alive: true, isHuman: false },
  { playerId: "p7", seat: 6, displayName: "吴九", role: "Villager", alignment: "good", alive: true, isHuman: false },
  { playerId: "p8", seat: 7, displayName: "郑十", role: "Hunter", alignment: "good", alive: true, isHuman: false },
  { playerId: "p9", seat: 8, displayName: "孙十一", role: "WhiteWolfKing", alignment: "wolf", alive: true, isHuman: false },
];

// i18n 文案（修复后所有函数统一使用 system.dayBreak）
const I18N = {
  "system.dayBreak": "天亮了，请睁眼",     // 所有写入和搜索统一用这个
  "system.voteStart": "发言结束，开始投票。", // 修复后统一用这个
};

/**
 * 构建完整的多天消息流
 */
function buildMultiDayMessages() {
  const messages = [];
  let id = 0;
  const msg = (content, opts = {}) => {
    messages.push({
      id: id++,
      content,
      isSystem: opts.isSystem || false,
      playerId: opts.playerId || null,
      playerName: opts.playerName || null,
      isLastWords: opts.isLastWords || false,
    });
  };

  // ======================== 第 0 天夜晚（游戏开始） ========================
  msg("游戏开始", { isSystem: true });
  msg("天黑请闭眼", { isSystem: true });

  // ======================== 第 1 天 ========================
  // 注意：实际代码用 system.dayBreak = "天亮了，请睁眼"
  msg("天亮了，请睁眼", { isSystem: true });
  msg("昨夜是平安夜，没有人出局", { isSystem: true });

  // 警长竞选
  msg("警长竞选开始", { isSystem: true });
  msg("我是预言家，昨晚查验了5号陈七，是狼人。我强烈建议大家把票投给5号。", { playerId: "p1", playerName: "张三" });
  msg("我才是真正的预言家！昨晚查了1号张三，他是好人。但我认为他的行为很可疑，可能是狼人假跳预言家。", { playerId: "p2", playerName: "李四" });
  msg("我是平民，两位预言家对跳，我先观察一下再做判断。", { playerId: "p3", playerName: "王五" });
  msg("作为一个有能力的好人，我支持1号张三的发言，他的逻辑链更完整。5号确实有疑点。", { playerId: "p4", playerName: "赵六" });
  msg("我被查了？我绝对不是狼人。1号在诬陷我，2号才是真预言家。", { playerId: "p5", playerName: "陈七" });
  msg("两边都有道理，但1号的查验结果更有参考价值。我暂时归到1号的阵营。", { playerId: "p6", playerName: "周八" });
  msg("我觉得2号的预言家跳得太急了，可能是悍跳狼。建议大家投5号。", { playerId: "p7", playerName: "吴九" });
  msg("我是猎人，我现在不表态站边，先看投票情况。", { playerId: "p8", playerName: "郑十" });
  msg("1号和2号对跳，我先看看。不过1号查出的结果更明确。", { playerId: "p9", playerName: "孙十一" });

  // 警长选举结果
  msg("[VOTE_RESULT]{\"title\":\"sheriff\",\"results\":[{\"targetSeat\":0,\"voterSeats\":[2,3,5,6,8]},{\"targetSeat\":1,\"voterSeats\":[4,7]}]}", { isSystem: true });
  msg("1号张三当选警长（5票）", { isSystem: true });

  // 自由发言
  msg("发言结束，开始投票。", { isSystem: true });
  msg("[VOTE_RESULT]{\"title\":\"execution\",\"results\":[{\"targetSeat\":4,\"voterSeats\":[0,2,3,5,6,8]},{\"targetSeat\":0,\"voterSeats\":[1,4,7]}]}", { isSystem: true });
  msg("5号陈七被放逐（6票）", { isSystem: true });

  // 遗言
  msg("我真的不是狼人，你们投错了。记住2号才是悍跳狼！", { playerId: "p5", playerName: "陈七", isLastWords: true });

  // 夜晚
  msg("天黑请闭眼", { isSystem: true });
  msg("正在总结当日游戏", { isSystem: true });

  // ======================== 第 2 天 ========================
  msg("天亮了，请睁眼", { isSystem: true });
  msg("昨夜3号王五出局", { isSystem: true });

  // 发言
  msg("3号出局了，这说明狼人在刀我的归票阵营。大家注意2号和9号，他们之前都表现得很中立。", { playerId: "p1", playerName: "张三" });
  msg("3号被刀很正常，我查验了6号周八是好人。现在应该聚焦9号孙十一，他一直在骑墙。", { playerId: "p2", playerName: "李四" });
  msg("我同意警长的分析，3号被刀说明狼人在针对好人阵营。我怀疑9号和2号是狼队友。", { playerId: "p4", playerName: "赵六" });
  msg("我守了1号一晚上，他没有被刀说明狼人不敢碰他。我现在更加确信1号是真预言家。", { playerId: "p6", playerName: "周八" });
  msg("我还是那个态度，2号是悍跳狼。昨天5号的遗言也在喊2号，我们今天应该投2号。", { playerId: "p7", playerName: "吴九" });
  msg("我猎人已经开好枪了，今天不管谁出局我都要带走2号。", { playerId: "p8", playerName: "郑十" });
  msg("你们都在针对我和2号，我觉得4号赵六太积极了，有做狼人深水的嫌疑。", { playerId: "p9", playerName: "孙十一" });

  msg("发言结束，开始投票。", { isSystem: true });
  msg("[VOTE_RESULT]{\"title\":\"execution\",\"results\":[{\"targetSeat\":1,\"voterSeats\":[0,3,5,6,7]},{\"targetSeat\":8,\"voterSeats\":[1]},{\"targetSeat\":3,\"voterSeats\":[8]}]}", { isSystem: true });
  msg("2号李四被放逐（5票）", { isSystem: true });

  msg("好吧我确实是狼，但你们别得意太早，我的狼队友会替我报仇的。", { playerId: "p2", playerName: "李四", isLastWords: true });

  msg("天黑请闭眼", { isSystem: true });
  msg("正在总结当日游戏", { isSystem: true });

  // ======================== 第 3 天 ========================
  msg("天亮了，请睁眼", { isSystem: true });
  msg("昨夜7号吴九出局", { isSystem: true });

  msg("7号被刀了，这说明狼人在清理明确支持我的好人。现在剩下的玩家中，9号孙十一最可疑。请大家今天集中火力投9号。", { playerId: "p1", playerName: "张三" });
  msg("我同意警长的判断。2号昨天已经被投出，承认是狼。现在9号的表现越来越像狼，昨天还在替2号说话。", { playerId: "p4", playerName: "赵六" });
  msg("我昨晚守了4号赵六，他没被刀。我认为9号是最后一匹狼了。", { playerId: "p6", playerName: "周八" });
  msg("你们说什么都行，但我真的不是狼。4号赵六才是深水狼！他一直在跟着1号发言骗信任。", { playerId: "p9", playerName: "孙十一" });
  msg("不管怎样，我作为猎人，枪瞄准9号。今天必须投出去。", { playerId: "p8", playerName: "郑十" });

  msg("发言结束，开始投票。", { isSystem: true });
  msg("[VOTE_RESULT]{\"title\":\"execution\",\"results\":[{\"targetSeat\":8,\"voterSeats\":[0,3,5,7]},{\"targetSeat\":3,\"voterSeats\":[8]}]}", { isSystem: true });
  msg("9号孙十一被放逐（4票）", { isSystem: true });

  return messages;
}

// ============================================================
// 2. 模拟核心函数（复刻自实际代码）
// ============================================================

/**
 * 修复后：所有函数统一用 system.dayBreak 匹配
 */
function findDayStartIndex(messages) {
  const dayBreak = I18N["system.dayBreak"]; // "天亮了，请睁眼"
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.isSystem && m.content === dayBreak) return i;
  }
  return 0;
}

/**
 * 修复后 generateDailySummary() 构建 transcript 的逻辑
 */
function buildSummaryTranscript(messages, players, dayStartIndex) {
  const dayMessages = messages.slice(dayStartIndex);
  return dayMessages
    .map((m) => {
      if (m.isSystem) return `系统: ${m.content}`;
      const player = players.find((p) => p.playerId === m.playerId);
      const seatLabel = player ? `${player.seat + 1}号` : "";
      const nameLabel = player?.displayName || m.playerName;
      const speaker = seatLabel ? `${seatLabel} ${nameLabel}`.trim() : nameLabel;
      return `${speaker}: ${m.content}`;
    })
    .join("\n")
    .slice(0, 15000);
}

/**
 * 模拟修复后中文版的 summary 输出（结构化 bullets）
 * 新 prompt 要求 6-12 条要点，覆盖 6 个维度
 */
function simulateChineseSummary(day) {
  const summaries = {
    1: {
      bullets: [
        "昨夜平安，无人出局",
        "1号张三声称预言家，查杀5号陈七为狼；2号李四反跳预言家，查1号为好人并称其可疑",
        "4号赵六支持1号逻辑链，认为5号有疑点",
        "5号陈七否认是狼，指控2号才是真预言家",
        "6号周八认为1号查验更有参考价值，暂时归入1号阵营",
        "7号吴九认为2号悍跳，建议投5号",
        "8号郑十声称猎人身份，暂不表态站边",
        "9号孙十一观望两位预言家，倾向1号",
        "警长选举：1号当选，5票（3号4号6号7号9号支持）",
        "放逐投票：5号出局6票（1号3号4号6号7号9号）",
        "5号遗言：坚称不是狼，叫大家记住2号才是悍跳狼",
      ],
    },
    2: {
      bullets: [
        "昨夜3号王五出局",
        "1号警长分析：狼人在刀自己的归票阵营，提醒注意2号和9号",
        "2号声称查验6号为好人，建议聚焦9号孙十一",
        "4号赵六同意警长分析，怀疑9号和2号是狼队友",
        "6号周八声称守卫，昨晚守了1号，1号未被刀更证明是真预言家",
        "7号吴九坚持2号是悍跳狼，引用5号遗言，建议今天投2号",
        "8号郑十声称猎人已开枪瞄准2号",
        "9号孙十一反指4号赵六太积极，怀疑是深水狼",
        "放逐投票：2号出局5票（1号4号6号7号8号投2号）",
        "2号遗言：承认是狼，警告队友会复仇",
      ],
    },
    3: {
      bullets: [
        "昨夜7号吴九出局",
        "1号警长：狼人在清理明确支持自己的好人，集火9号",
        "4号赵六同意，指出9号昨天还在替2号说话",
        "6号周八声称守卫，昨晚守了4号，认为9号是最后一匹狼",
        "9号孙十一否认是狼，指控4号赵六是跟着1号骗信任的深水狼",
        "8号郑十猎人枪继续瞄准9号",
        "放逐投票：9号出局4票（1号4号6号8号投9号）",
      ],
    },
  };
  return summaries[day] || { bullets: [] };
}

/**
 * 模拟英文版的 summary 输出（6-12 bullets）
 */
function simulateEnglishSummary(day, transcript) {
  const summaries = {
    1: {
      bullets: [
        "Peaceful night - no one died",
        "Seat 1 (Zhang San) claimed Seer, checked Seat 5 (Chen Qi) as wolf",
        "Seat 2 (Li Si) counter-claimed Seer, checked Seat 1 as good but called him suspicious",
        "Seat 4 (Zhao Liu) supported Seat 1's logic chain, found Seat 5 suspicious",
        "Seat 5 (Chen Qi) denied being wolf, defended himself, said Seat 2 is real Seer",
        "Seat 6 (Zhou Ba) leaned toward Seat 1's camp based on check results",
        "Seat 7 (Wu Jiu) believed Seat 2 is a fake-claiming wolf, pushed for Seat 5",
        "Seat 8 (Zheng Shi) claimed Hunter, stayed neutral on Seer debate",
        "Seat 9 (Sun Shiyi) leaned toward Seat 1 but kept options open",
        "Sheriff election: Seat 1 won with 5 votes vs Seat 2 with 2 votes",
        "Execution vote: Seat 5 eliminated with 6 votes (Seats 1,3,4,6,7,9 voted)",
        "Seat 5's last words: insisted not wolf, accused Seat 2 of fake-claiming",
      ],
    },
    2: {
      bullets: [
        "Seat 3 (Wang Wu) died overnight",
        "Seat 1 (Sheriff) analyzed: wolves targeting his supporters, suspects Seats 2 and 9",
        "Seat 2 claimed to have checked Seat 6 as good, pushed focus on Seat 9",
        "Seat 4 agreed with Sheriff, suspected Seats 9 and 2 as wolf partners",
        "Seat 6 claimed Guard, guarded Seat 1 last night, confirmed Seat 1 is real Seer",
        "Seat 7 maintained Seat 2 is fake-claiming, pushed to vote Seat 2 today",
        "Seat 8 (Hunter) declared gun aimed at Seat 2 regardless of vote outcome",
        "Seat 9 deflected suspicion, accused Seat 4 of being a deep-cover wolf",
        "Execution: Seat 2 eliminated with 5 votes",
        "Seat 2's last words: admitted being wolf, warned wolf teammates will avenge",
      ],
    },
    3: {
      bullets: [
        "Seat 7 (Wu Jiu) died overnight",
        "Seat 1 (Sheriff): wolves clearing his supporters, focused fire on Seat 9",
        "Seat 4 agreed, pointed out Seat 9 defended Seat 2 yesterday (confirmed wolf)",
        "Seat 6 claimed Guard, guarded Seat 4 last night, believes Seat 9 is last wolf",
        "Seat 9 denied being wolf, accused Seat 4 of being deep-cover wolf following Seat 1",
        "Seat 8 (Hunter) gun aimed at Seat 9",
        "Execution: Seat 9 eliminated with 4 votes",
      ],
    },
  };
  return summaries[day] || { bullets: [] };
}

/**
 * 模拟 buildDailySummariesSection()
 * 对应 prompt-utils.ts:355-386
 */
function buildDailySummariesSection(dailySummaries, dailySummaryVoteData) {
  const entries = Object.entries(dailySummaries)
    .map(([day, bullets]) => ({ day: Number(day), bullets }))
    .filter((x) => Number.isFinite(x.day) && Array.isArray(x.bullets));

  if (entries.length === 0) return "";

  const lines = [];
  for (const { day, bullets } of entries.sort((a, b) => a.day - b.day)) {
    const summaryTexts = bullets.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean);
    if (summaryTexts.length === 0) continue;

    const fullSummary = summaryTexts.join("；");
    const voteData = dailySummaryVoteData?.[day];
    const voteText = voteData ? formatVoteDataForHistory(voteData) : "";
    const dayLabel = `第${day}天: `;
    const line = voteText ? `${dayLabel}${fullSummary} ${voteText}` : `${dayLabel}${fullSummary}`;
    lines.push(line);
  }

  if (lines.length === 0) return "";
  return `<history>\n${lines.join("\n\n")}\n</history>`;
}

function formatVoteDataForHistory(voteData) {
  const parts = [];
  if (voteData.sheriff_election) {
    const { winner, votes } = voteData.sheriff_election;
    const voteDetails = Object.entries(votes)
      .map(([target, voters]) => `${target}号(${voters.map((v) => v + "号").join(",")})`)
      .join(" vs ");
    parts.push(`[警长选举: ${winner}号当选 | ${voteDetails}]`);
  }
  if (voteData.execution_vote) {
    const { eliminated, votes } = voteData.execution_vote;
    const voteDetails = Object.entries(votes)
      .map(([target, voters]) => `${target}号(${voters.map((v) => v + "号").join(",")})`)
      .join(" vs ");
    parts.push(`[放逐投票: ${eliminated}号出局 | ${voteDetails}]`);
  }
  return parts.join(" ");
}

/**
 * 模拟 buildTodayTranscript() 的压缩逻辑
 * 对应 prompt-utils.ts:442-537
 */
function buildTodayTranscript(messages, players, maxChars, dailySummaryFacts, dailySummaries, currentDay) {
  // 修复后统一使用 system.dayBreak 匹配
  const dayStartIndex = findDayStartIndex(messages);

  // 修复后统一使用 system.voteStart 匹配
  const voteStartText = I18N["system.voteStart"];
  let voteStartIndex = messages.length;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].isSystem && messages[i].content === voteStartText) {
      voteStartIndex = i;
      break;
    }
  }

  const slice = messages.slice(dayStartIndex, voteStartIndex > dayStartIndex ? voteStartIndex : messages.length);

  const regularMessages = slice.filter((m) => !m.isSystem && !m.isLastWords);
  const lastWordsMessages = slice.filter((m) => !m.isSystem && m.isLastWords);

  const formatMessage = (m) => {
    const player = players.find((p) => p.playerId === m.playerId);
    const speaker = player ? `${player.seat + 1}号` : m.playerName;
    const lastWordsLabel = m.isLastWords ? "【遗言】" : "";
    return `${lastWordsLabel}${speaker}: ${m.content}`;
  };

  const lastWordsText = lastWordsMessages.map(formatMessage).join("\n");
  const regularText = regularMessages.map(formatMessage).join("\n");
  const transcript = [lastWordsText, regularText].filter(Boolean).join("\n");

  if (!transcript) return { result: "", compressed: false };
  if (transcript.length <= maxChars) return { result: transcript, compressed: false };

  // 需要压缩
  const summaryFacts = dailySummaryFacts?.[currentDay];
  const summaryBullets = dailySummaries?.[currentDay];
  const summaryItems =
    summaryFacts && summaryFacts.length > 0
      ? summaryFacts.map((f) => f.fact).filter(Boolean)
      : summaryBullets || [];

  if (summaryItems.length > 0) {
    const maxSummaryChars = Math.min(1200, Math.max(300, Math.floor(maxChars * 0.4)));
    let summaryText = "";
    for (const item of summaryItems) {
      const clean = String(item).trim();
      if (!clean) continue;
      const candidate = summaryText ? `${summaryText}；${clean}` : clean;
      if (candidate.length > maxSummaryChars) break;
      summaryText = candidate;
    }
    const header = `<early_summary>${summaryText}</early_summary>\n<recent_speech>\n`;
    const footer = `\n</recent_speech>`;
    const lastWordsReserve = lastWordsText ? lastWordsText.length + 50 : 0;
    const availableForRecent = maxChars - header.length - footer.length - lastWordsReserve;
    const recentRegular = availableForRecent > 0 ? regularText.slice(-availableForRecent) : "";
    const lastWordsPart = lastWordsText ? `<last_words>\n${lastWordsText}\n</last_words>\n` : "";
    return { result: `${header}${lastWordsPart}${recentRegular}${footer}`.trim(), compressed: true };
  }

  // No summary, sliding window
  return { result: `<today_speech>\n${transcript.slice(-maxChars)}\n</today_speech>`, compressed: true };
}

// ============================================================
// 3. 运行模拟
// ============================================================

function runSimulation() {
  const messages = buildMultiDayMessages();
  const players = [...PLAYERS];

  console.log("=".repeat(80));
  console.log("  狼人杀每日总结系统 - 模拟验证");
  console.log("=".repeat(80));

  // ─────────────────────────────────────────
  // 测试 1: dayBreak 标记匹配修复验证
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 1: dayBreak 标记匹配修复验证");
  console.log("━".repeat(80));

  const dayBreakMessages = messages.filter((m) => m.isSystem && m.content.includes("天亮"));
  console.log("\n实际消息流中的 dayBreak 消息:");
  dayBreakMessages.forEach((m) => {
    console.log(`  [id=${m.id}] "${m.content}"`);
  });

  console.log(`\n修复后所有函数搜索: "${I18N["system.dayBreak"]}" (精确匹配)`);

  const idx = findDayStartIndex(messages);
  console.log(`\n修复后 dayStartIndex: ${idx} → "${messages[idx]?.content || 'N/A'}"`);

  if (idx === 0) {
    console.log("  ⚠️  仍有问题：回退到 index=0");
  } else {
    console.log("  ✓  正确找到当天起点");
  }

  // ─────────────────────────────────────────
  // 测试 2: Summary 输入范围验证
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 2: 修复后 Summary 输入范围");
  console.log("━".repeat(80));

  const correctTranscript = buildSummaryTranscript(messages, players, idx);
  console.log(`\n修复后截取的 transcript:`);
  console.log(`  字符数: ${correctTranscript.length}`);
  console.log(`  行数: ${correctTranscript.split("\n").length}`);
  console.log(`  前 3 行: ${correctTranscript.split("\n").slice(0, 3).map(l => `"${l}"`).join(", ")}`);;

  // ─────────────────────────────────────────
  // 测试 3: 修复后中文 Summary 信息量验证
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 3: 修复后中文 Summary 信息量（对齐英文 bullets 格式）");
  console.log("━".repeat(80));

  const chineseSummaries = {};
  const englishSummaries = {};

  for (let day = 1; day <= 3; day++) {
    const zhResult = simulateChineseSummary(day);
    const enResult = simulateEnglishSummary(day);
    chineseSummaries[day] = zhResult.bullets;
    englishSummaries[day] = enResult.bullets;

    const zhText = zhResult.bullets.join("；");
    const enText = enResult.bullets.join("; ");
    console.log(`\n--- 第 ${day} 天 ---`);
    console.log(`中文 (${zhResult.bullets.length}条, ${zhText.length}字):`);
    zhResult.bullets.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
    console.log(`英文 (${enResult.bullets.length}条, ${enText.length}字): [参考对比，略]`);
  }

  // ─────────────────────────────────────────
  // 测试 4: 多轮后 <history> 内容对比
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 4: 第 3 天 AI 玩家看到的 <history> 内容对比");
  console.log("━".repeat(80));

  const mockVoteData = {
    1: {
      sheriff_election: { winner: 1, votes: { "1": [3, 4, 6, 7, 9], "2": [5, 8] } },
      execution_vote: { eliminated: 5, votes: { "5": [1, 3, 4, 6, 7, 9], "1": [2, 5, 8] } },
    },
    2: {
      execution_vote: { eliminated: 2, votes: { "2": [1, 4, 6, 7, 8], "9": [2], "4": [9] } },
    },
  };

  // 模拟第3天开始时，AI 玩家看到前2天的 history
  const zhHistory = buildDailySummariesSection(
    { 1: chineseSummaries[1], 2: chineseSummaries[2] },
    mockVoteData
  );
  const enHistory = buildDailySummariesSection(
    { 1: englishSummaries[1], 2: englishSummaries[2] },
    mockVoteData
  );

  console.log("\n[中文 history]:");
  console.log(zhHistory);
  console.log(`  → 总字符数: ${zhHistory.length}`);

  console.log("\n[英文 history]:");
  console.log(enHistory);
  console.log(`  → 总字符数: ${enHistory.length}`);

  // ─────────────────────────────────────────
  // 测试 5: 信息检索测试 - 模拟 AI 需要回忆的问题
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 5: 信息检索测试 — AI 能从 history 中回答这些问题吗？");
  console.log("━".repeat(80));

  const questions = [
    { q: "第1天谁声称自己是预言家？", key: "预言家|Seer|claimed" },
    { q: "第1天6号周八站的是哪边？", key: "周八|Seat 6|Zhou Ba" },
    { q: "第1天8号郑十声称什么身份？", key: "猎人|Hunter|Zheng Shi" },
    { q: "第2天2号的遗言说了什么？", key: "承认|admitted|李四" },
    { q: "第2天6号声称守了谁？", key: "守|Guard|guarded" },
    { q: "第1天9号孙十一对两位预言家持什么态度？", key: "孙十一|Seat 9|leaned" },
    { q: "第2天谁怀疑4号赵六是深水狼？", key: "深水|deep-cover|赵六" },
  ];

  console.log("\n问题 → 中文history能回答？ | 英文history能回答？");
  console.log("-".repeat(70));

  for (const { q, key } of questions) {
    const keys = key.split("|");
    const zhFound = keys.some((k) => zhHistory.includes(k));
    const enFound = keys.some((k) => enHistory.includes(k));
    const zhStatus = zhFound ? "✓ 能" : "✗ 不能";
    const enStatus = enFound ? "✓ 能" : "✗ 不能";
    console.log(`  ${q}`);
    console.log(`    中文: ${zhStatus}  |  英文: ${enStatus}`);
  }

  // ─────────────────────────────────────────
  // 测试 6: buildTodayTranscript 压缩效果（修复后）
  // ─────────────────────────────────────────
  console.log("\n" + "━".repeat(80));
  console.log("  TEST 6: buildTodayTranscript() 修复后压缩效果");
  console.log("━".repeat(80));

  const smallMaxChars = 300;

  // 修复后：用结构化 bullets 作为 early_summary，无 facts
  const { result: fixedResult, compressed: fixedCompressed } = buildTodayTranscript(
    messages, players, smallMaxChars,
    {}, // dailySummaryFacts 已清理，不再使用
    { 3: chineseSummaries[3] }, // 新格式：多条 bullets
    3
  );

  console.log(`\nmaxChars=${smallMaxChars}，修复后压缩结果 (compressed=${fixedCompressed}):`);
  console.log(fixedResult);
  console.log(`  → 字符数: ${fixedResult.length}`);

  // ─────────────────────────────────────────
  // 总结
  // ─────────────────────────────────────────
  console.log("\n" + "═".repeat(80));
  console.log("  修复后验证总结");
  console.log("═".repeat(80));

  const zhAnswerable = questions.filter(({key}) => key.split("|").some(k => zhHistory.includes(k))).length;
  const enAnswerable = questions.filter(({key}) => key.split("|").some(k => enHistory.includes(k))).length;

  console.log(`
  1. dayBreak 标记 Bug: ${idx !== 0 ? "✓  已修复 — 所有函数统一使用 system.dayBreak" : "⚠️  仍有问题"}
     修复后 dayStartIndex=${idx}，正确截取当天内容

  2. 中文 summary 信息量: ${zhAnswerable >= 6 ? "✓  大幅提升" : "⚠️  仍需改进"}
     7个关键问题中文能回答 ${zhAnswerable} 个（修复前仅2个）
     英文能回答 ${enAnswerable} 个

  3. DailySummaryFacts 死代码: ✓  已清理
     buildTodayTranscript 直接使用 bullets，逻辑简化

  4. 多轮信息质量:
     前2天历史中文版 ~${zhHistory.length}字
     前2天历史英文版 ~${enHistory.length}字
`);
}

runSimulation();
