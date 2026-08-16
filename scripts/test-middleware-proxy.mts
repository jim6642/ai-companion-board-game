// Regression tests for `src/lib/middleware-proxy.ts`.
//
// Run with:
//   node --experimental-strip-types --test scripts/test-middleware-proxy.mts
//
// Background: the previous middleware hard-coded an implicit
// "if hostname=localhost and port=3001 then rewrite /api/* to
// http://localhost:3000" rule. With a single Next.js process serving on
// :3001, every /api/companion/* call was silently rewritten to :3000
// (no listener) and ECONNREFUSED. The front-end then fell back to a
// hard-coded offline reply, making the chat feel robotic and breaking TTS.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLocalApiProxyOrigin } from "../src/lib/middleware-proxy.ts";

test("no env value => no rewrite (the original bug case)", () => {
  // undefined simulates a process where the env var was never set.
  assert.deepEqual(resolveLocalApiProxyOrigin(undefined), { kind: "none" });
});

test("empty / whitespace env value => no rewrite", () => {
  assert.deepEqual(resolveLocalApiProxyOrigin(""), { kind: "none" });
  assert.deepEqual(resolveLocalApiProxyOrigin("   "), { kind: "none" });
  assert.deepEqual(resolveLocalApiProxyOrigin("\t\n"), { kind: "none" });
});

test("non-string env value => no rewrite", () => {
  // process.env values are always strings at runtime, but the helper is
  // defensive: anything non-string must short-circuit to "none".
  assert.deepEqual(
    resolveLocalApiProxyOrigin(undefined as unknown as string),
    { kind: "none" },
  );
});

test("non-http scheme => no rewrite", () => {
  assert.deepEqual(
    resolveLocalApiProxyOrigin("file:///etc/passwd"),
    { kind: "none" },
  );
  assert.deepEqual(
    resolveLocalApiProxyOrigin("javascript:alert(1)"),
    { kind: "none" },
  );
});

test("invalid URL => no rewrite (never throws)", () => {
  assert.deepEqual(
    resolveLocalApiProxyOrigin("not a url"),
    { kind: "none" },
  );
  // A bare host without a scheme must NOT be treated as an origin.
  // This is the exact class of value the old heuristic would have happily
  // forwarded to `new URL(path, value)` and failed on.
  assert.deepEqual(
    resolveLocalApiProxyOrigin("localhost:3000"),
    { kind: "none" },
  );
});

test("explicit http origin => rewrite to that origin", () => {
  assert.deepEqual(
    resolveLocalApiProxyOrigin("http://localhost:3000"),
    { kind: "rewrite", origin: "http://localhost:3000" },
  );
});

test("explicit https origin => rewrite and preserves scheme", () => {
  assert.deepEqual(
    resolveLocalApiProxyOrigin("https://api.example.com/"),
    { kind: "rewrite", origin: "https://api.example.com" },
  );
});

test("explicit origin with path/query is normalized to its origin only", () => {
  // The middleware feeds the path/query separately, so the stored origin
  // must be just the origin. This keeps the URL constructor safe.
  assert.deepEqual(
    resolveLocalApiProxyOrigin("https://api.example.com/v1/?x=1"),
    { kind: "rewrite", origin: "https://api.example.com" },
  );
});

test("surrounding whitespace on a valid env value is trimmed", () => {
  assert.deepEqual(
    resolveLocalApiProxyOrigin("  http://localhost:4000  "),
    { kind: "rewrite", origin: "http://localhost:4000" },
  );
});

test("explicit env value rewrites regardless of any request context", () => {
  // The helper no longer touches hostname/port at all, so any caller can
  // pass an explicit origin and get back a rewrite. This guarantees the
  // two-process split deployment (frontend on :3001, older API on :3000)
  // still works when the operator sets LOCAL_API_PROXY_BASE_URL.
  assert.deepEqual(
    resolveLocalApiProxyOrigin("http://10.0.0.5:3100"),
    { kind: "rewrite", origin: "http://10.0.0.5:3100" },
  );
});
