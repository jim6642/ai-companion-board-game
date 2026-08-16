// Pure helpers for the Next.js middleware's local API proxy decision.
//
// Kept dependency-free and free of `next/server` imports so it can be
// unit-tested directly from a Node script (see scripts/test-middleware-proxy.mts).
//
// Contract:
// - The middleware MUST only rewrite `/api/*` to an upstream origin when
//   `LOCAL_API_PROXY_BASE_URL` is explicitly set to a non-empty string.
// - Port/hostname heuristics (e.g. "if hostname=localhost and port=3001 then
//   assume another process owns port 3000") are NOT allowed here. They caused
//   `/api/companion/respond` and `/api/companion/tts` to be silently
//   rewritten to a port with no listener in single-process dev runs,
//   which produced ECONNREFUSED and made the front-end fall back to
//   hard-coded offline replies.
// - When the value is set, it must be a valid absolute http(s) URL so the
//   middleware can safely call `new URL(path, value)` without throwing.

export type LocalApiProxyDecision =
  | { kind: "none" }
  | { kind: "rewrite"; origin: string };

/**
 * Resolve whether the middleware should rewrite `/api/*` requests to a
 * separate upstream origin.
 *
 * @param rawEnvValue  The raw string value of `LOCAL_API_PROXY_BASE_URL`
 *                     (e.g. `process.env.LOCAL_API_PROXY_BASE_URL`).
 *                     Accepting a string instead of `process.env` keeps
 *                     the helper free of Node-only types and trivially
 *                     testable.
 */
export function resolveLocalApiProxyOrigin(
  rawEnvValue: string | undefined,
): LocalApiProxyDecision {
  if (typeof rawEnvValue !== "string") return { kind: "none" };
  const trimmed = rawEnvValue.trim();
  if (!trimmed) return { kind: "none" };
  // Reject obviously bogus values so the middleware never builds a URL
  // against a non-absolute origin (e.g. "localhost:3000").
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: "none" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { kind: "none" };
  }
  return { kind: "rewrite", origin: parsed.origin };
}
