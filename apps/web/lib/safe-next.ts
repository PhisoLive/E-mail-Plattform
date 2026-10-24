/**
 * Only same-origin relative paths are allowed as redirect targets (no open redirect).
 * Rejects protocol-relative URLs, backslashes and control characters, which the WHATWG URL
 * parser strips or reinterprets (e.g. "/\t/evil.example").
 */
export function safeNext(next: string | null | undefined, fallback = "/start"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  for (const char of next) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 || code === 127 || char === "\\") return fallback;
  }
  try {
    const base = "https://plattform.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
