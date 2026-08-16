# 今晚有局：AI 桌游陪伴原型

当前原型包含本地规则 UNO、八人狼人杀、飞行棋和四人“心动密函”。这些游戏共用七名陪玩角色、MiniMax 对话与语音、硅基流动语音识别，但每款游戏拥有独立规则引擎、局势上下文、提示词和互动节奏。

当前入口：`http://localhost:3001/zh/companion`

- UNO：`http://localhost:3001/zh/companion/uno`
- 狼人杀：`http://localhost:3001/zh/companion/werewolf`
- 飞行棋：`http://localhost:3001/zh/companion/aeroplane`
- 心动密函：`http://localhost:3001/zh/companion/love-letter`

## 心动密函

- 开局从七名陪玩角色中选择三人，组成一名真人与三名 AI 的四人局。
- 使用 16 张牌的经典规则：卫兵、祭司、男爵、侍女、王子、国王、伯爵夫人和公主；先获得四枚好感标记者取胜。
- 摸牌、合法目标、强制出牌、淘汰、回合结算和 AI 出牌全部由本地引擎处理，LLM 只负责评价已经公开发生的事件。
- 祭司查看等私密信息只对合法知情玩家公开，发送给模型的局势文本不包含其他玩家手牌。
- 对局中途重开和结算后再来一场都会创建全新状态，不沿用上一局的牌堆、标记或私密信息。
- 页面保持固定一屏，牌桌与聊天独立布局，AI 行动无需等待语音播放。

## 狼人杀纵切片

```text
QUESTION:   成熟的狼人杀规则状态机，能否被包装成有鲜明角色感的 AI 陪玩体验？
CORE VERB:  获取身份 -> 夜间行动 -> 听取角色化发言 -> 自己发言或语音输入 -> 投票 -> 复盘下一天。
THROWAWAY:  否。原创陪玩外壳、角色提示词和语音队列可以继续服务未来的真人与 AI 混合组局。
KEEP IF:    八人局能完整推进；AI 的发言既遵守信息边界，又能从措辞、推理偏好和受压反应分辨角色。
KILL IF:    模型承担规则裁判职责，或换掉角色名字后发言仍没有区别。
```

### 已实现

- 复用 AI Companion Board Game 的身份分配、夜间行动、警长竞选、发言队列、投票与胜负结算代码。
- `/companion/werewolf` 使用独立原创界面，不再渲染 AI Companion Board Game 的首页或牌桌组件。
- 固定一屏桌面布局；牌桌与右侧聊天记录分别滚动，浏览器页面不会随消息持续拉长。
- 一名真人玩家与七名固定 AI 角色进行标准八人局。
- 其他玩家身份默认隐藏；狼人能看到狼队友，结束后公开全员身份。
- 打字和按住说话都先进入输入框，玩家确认后再发送。
- MiniMax TTS 通过全局队列顺序播放，不会因为多人连续发言互相覆盖。
- 七名角色拥有独立的证据偏好、压力反应、不确定性表达、常犯错误、狼牌伪装方式和固定心智参数。
- 所有 AI 玩家统一使用 MiniMax `M2-her`，避免随机模型差异掩盖角色差异。

## UNO

- 标准 UNO 牌组、合法出牌校验、方向、跳过、加二、万能牌和万能加四全部本地结算。
- 规则层使用 MIT 许可的 [`uno-engine`](https://github.com/danguilherme/uno)，本地机器人策略参考 MIT 许可的 [`RLCard UNO rule agent`](https://github.com/datamllab/rlcard) 后重新实现。
- AI 决策不依赖 LLM；模型只根据公开事件负责生活化评论和陪玩语音。

## 本地启动

要求 Node.js 20+ 和 pnpm。

```bash
pnpm install
pnpm dev
```

测试密钥只通过运行进程的环境变量注入：`MINIMAX_API_KEY`、`MINIMAX_GROUP_ID`、`SILICONFLOW_API_KEY`。不要把真实密钥写入 `.env.example`、源码、日志或 Git 提交。

## 验证

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm qa:love-letter-engine
pnpm qa:love-letter-rules
pnpm qa:love-letter-dialogue
pnpm qa:prompt-isolation
pnpm qa:love-letter-ui
```

其中规则引擎测试会随机完成 5,000 场对局；界面验收会使用三套不同角色组合真实打完整场，并覆盖半局重开、结算后重开、聊天滚动与页面固定高度。生产构建和自动验收不能替代真人对“是否有趣”的最终判断。

## 后续

- 用原创二次元多表情立绘替换当前文字头像。
- 每局结束生成短复盘，并只保留 3 到 5 条长期关系摘要以控制 token。
- 为真人朋友与 AI 混合组局预留服务端房间同步层。
- 上线前增加更多 LLM/TTS 提供商，并改成明确的玩家会话密钥配置流程。
