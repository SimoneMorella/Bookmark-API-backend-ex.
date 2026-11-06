import type { ValidationResult } from "./types.js";

// Validation = checking data at the "boundary" (the moment it enters the program).
// Never trust req.body: treat it as `unknown` until it has been checked.
// If every check passes, the rest of the code can safely assume the data is clean.

// Browsers/servers commonly treat ~2000 chars as a practical URL limit.
export const MAX_URL_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 200;

export function validateCreateBookmark(body: unknown): ValidationResult {
  // body can be null, a string, a number, an array or undefined (no JSON sent).
  // typeof null === "object", and arrays are objects too, so both are excluded explicitly.
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

  return { ok: true, value: { url, title } };
}
