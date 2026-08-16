const CONTROL_ONLY_PATTERN = /^(?:sentence|action)$/i;

/** Remove model transport labels before dialogue persistence and TTS. */
export function sanitizeModelControlArtifacts(text: string): string {
  const withoutSpecialTokens = String(text ?? "")
    .replace(/<\|(?:begin|end)[^|]*sentence\|>/gi, "")
    .replace(/<｜(?:begin|end)[^｜]*sentence｜>/gi, "");

  const withoutControlLines = withoutSpecialTokens
    .split(/\r?\n/)
    .filter((line) => {
      const normalized = line.trim().replace(/^["'`]+|["'`,:]+$/g, "").trim();
      return !CONTROL_ONLY_PATTERN.test(normalized);
    })
    .join("\n")
    .trim();

  const normalizedWhole = withoutControlLines
    .replace(/^["'`]+|["'`,:]+$/g, "")
    .trim();
  return CONTROL_ONLY_PATTERN.test(normalizedWhole) ? "" : withoutControlLines;
}
