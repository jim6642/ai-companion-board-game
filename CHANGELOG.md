# Changelog

## 2026-08-16

- **Exploding Kittens (炸弹猫) joins the companion lobby as the 6th
  game**. `src/lib/exploding-kittens/engine.ts` implements the full
  classic 54-card deck (4 Exploding Kittens / 6 Defuse / 4 Attack / 5
  See the Future / 4 Shuffle / 4 Skip / 4 Nope / 4 Favor / 5 cat
  kinds × 4), including 2/3/5 cat-card combos, a Nope chain capped at
  depth 4, the Attack double-turn carry, and the post-Defuse secret
  reinsert of the Exploding Kitten. Setup follows the published rules:
  remove all EK and Defuse, deal 4 to each player, hand each player 1
  Defuse, then shuffle (playerCount - 1) EK back into the deck and
  discard the extras. Bot AI works off a sanitized `EKBotView` (no
  hidden hands), defaults to drawing 70% of the time, and only chains
  action cards when a peek reveals an Exploding Kitten on top. The
  companion dialogue file
  (`src/lib/companion/exploding-kittens-dialogue.ts`) follows the
  same `warmth / rivalry / callbacks` pattern as the other games and
  registers a new `exploding-kittens` mode in
  `src/lib/companion/mode-prompts.ts`. The page lives at
  `/companion/exploding-kittens` and reuses the existing
  voice / chat / queue-drain machinery (CSS module follows the
  top-level-only convention to keep Next.js css-loader happy).
- **Companion games:吹牛骰子 / 心动密函 / 飞行棋** ship as a unified
  companion lobby under `/zh/companion`. Each game has its own pure
  rule engine, prompt set, and round cadence; the four games share the
  same 7-character cast and the same chat / TTS / STT pipeline.
- **Chat / voice queue draining fix** across all four companion games.
  `reactionQueueRef` / `voiceQueueRef` / `pendingVoiceCountRef` now
  get a `matchId` bump and explicit reset on every `startGame` /
  `restart` / companion switch, so an in-flight `/api/companion/respond`
  reply from a long bot turn can no longer leak into the next match.
  Regression coverage in `scripts/qa-*-queue-drain.mjs` (shared CDP
  harness in `scripts/qa-queue-drain-helper.mjs`), each with a
  negative-control revert to prove the test actually catches the bug.
- **Middleware proxy made opt-in**. `src/middleware.ts` no longer
  silently rewrites `/api/*` to `http://localhost:3000` just because
  the dev server is on `:3001`. A new `resolveLocalApiProxyOrigin`
  helper in `src/lib/middleware-proxy.ts` only honors an explicit
  `LOCAL_API_PROXY_BASE_URL` and rejects non-`http(s)` values. Covered
  by `scripts/test-middleware-proxy.mts`.

## 2026-06-02

- Disabled daily bonus credit grants by setting `DAILY_BONUS_ENABLED` to `false`.
