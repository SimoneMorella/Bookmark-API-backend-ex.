import type { ValidationResult } from "./types.js";

// [INFO] Validation = checking data at the "boundary" (the moment it enters your program).
// Rule of thumb: NEVER trust req.body. Treat it as `unknown` until you have checked it.
// If every check passes, the rest of your code can safely assume the data is clean.

// [INFO] Why 2048? Browsers/servers commonly treat ~2000 chars as a practical URL limit.
// The brief says a 2 KB URL must be rejected, so we pick a limit and enforce it.
export const MAX_URL_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 200;

export function validateCreateBookmark(body: unknown): ValidationResult {
  // [GUIDE] EXERCISE 1 — Is the body even an object?
  // Callers can send `null`, a string, a number, an array, or nothing at all
  // (in Express 5, req.body is `undefined` when no JSON was sent).
  // If you do `body.url` on undefined, JS throws a TypeError -> that becomes a 500. We must avoid that.
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object" };
  }
  const data = body as Record<string, unknown>;

  if (data.url === undefined) {
    return { ok: false, message: "url is required" };
  }

  if (typeof data.url !== "string") {
    return { ok: false, message: "url must be a string" };
  }

  const url = data.url.trim();

  if (url.length === 0) {
    return { ok: false, message: "url must not be empty" };
  }

  if (url.length > MAX_URL_LENGTH) {
    return { ok: false, message: `url must be shorter than ${MAX_URL_LENGTH}` };
  }

  try {
    const parsedURL = new URL(url);
    if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
      return { ok: false, message: "url must start with http: or https:" };
    }
  } catch {
    return { ok: false, message: "url must be a valid URL" };
  }
  // What to write:
  //   if (typeof body !== "object" || body === null || Array.isArray(body)) {
  //     return { ok: false, message: "Request body must be a JSON object" };
  //   }
  // (typeof null === "object" in JS, that's a famous quirk, so we check null separately.
  //  Arrays are also "object", so we exclude them too.)
  //
  // After this check, tell TypeScript what it is, so you can read fields:
  //   const data = body as Record<string, unknown>;
  // `Record<string, unknown>` means "an object with any keys, values of unknown type".

  // [GUIDE] EXERCISE 2 — "url" must be present.
  // A missing field gives `undefined` when you read it: data.url === undefined.
  // Return a message that NAMES the field, e.g.:
  //   { ok: false, message: "url is required" }
  // The brief says the message must name the field, so always start with "url" / "title".

  // [GUIDE] EXERCISE 3 — "url" must be a string.
  // The caller can send a number like {"url": 123}. Check: typeof data.url !== "string"
  // Message example: "url must be a string".
  // After this check TypeScript knows data.url is a string.

  // [GUIDE] EXERCISE 4 — "url" must not be empty.
  // Trim whitespace first: const url = data.url.trim();
  // (so "   " counts as empty). If url.length === 0 -> "url must not be empty".

  // [GUIDE] EXERCISE 5 — "url" must not be too long.
  // If url.length > MAX_URL_LENGTH -> `url must be at most ${MAX_URL_LENGTH} characters`.

  // [GUIDE] EXERCISE 6 — "url" must actually be a URL (and http/https only).
  // JS has a built-in parser: `new URL(url)`. It THROWS if the text is not a valid URL,
  // so wrap it in try/catch:
  //   let parsed: URL;
  //   try { parsed = new URL(url); }
  //   catch { return { ok: false, message: "url must be a valid URL" }; }
  // Then reject dangerous schemes like "javascript:" :
  //   if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
  //     return { ok: false, message: "url must start with http:// or https://" };
  //   }

  // [GUIDE] EXERCISE 7 — "title" is optional, but if present must be a string (max MAX_TITLE_LENGTH).
  // Optional means: undefined is fine. Anything else must be checked.
  //   let title: string | undefined;
  //   if (data.title !== undefined) {
  //     if (typeof data.title !== "string") return { ok: false, message: "title must be a string" };
  //     if (data.title.length > MAX_TITLE_LENGTH) return { ok: false, message: `title must be at most ${MAX_TITLE_LENGTH} characters` };
  //     title = data.title.trim();
  //   }

  let title: string | undefined;
  if (data.title !== undefined) {
    if (typeof data.title !== "string") {
      return { ok: false, message: "title must be a string" };
    }
    if (data.title.length > MAX_TITLE_LENGTH) {
      return {
        ok: false,
        message: `title must be at most ${MAX_TITLE_LENGTH} characters`,
      };
    }
    title = data.title.trim();
  }

  // [GUIDE] EXERCISE 8 — return the clean value.
  // Return the URL as a string and the title. For the url, return `parsed.href`?
  // Careful: README asks you to explain how repeats are recognised. Decide in store.ts
  // how to normalize (see the guide there). For now return the trimmed `url`:
  //   return { ok: true, value: { url, title } };
  // (Delete the temporary line below when you're done.)

  return { ok: true, value: { url, title } };
}
