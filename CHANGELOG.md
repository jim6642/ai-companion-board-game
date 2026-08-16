# Changelog

## 2026-08-16

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
