import { randomUUID } from "node:crypto";
import type { Bookmark, CreateBookmarkInput } from "./types.js";

// [INFO] The "store" is where data lives. To keep this first project simple we use
// a plain in-memory Map (data disappears when the server restarts). That's fine for the exercise.
// A Map is like an object with get/set/delete/has, but with better performance and any key type.
const bookmarks = new Map<string, Bookmark>(); // key = bookmark id

// [INFO] To find a repeat quickly we keep a SECOND map: "dedupe key" -> bookmark id.
// Looking up a key in a Map is instant; scanning all bookmarks each time would be slow.
const dedupeIndex = new Map<string, string>();

// [GUIDE] EXERCISE 9 — decide how to recognise a repeat (the key idea of this exercise).
// A "repeat" = the same user saving the same URL again. So the identity is (userId + url).
// Two different users may save the same URL; that is NOT a repeat.
//
// But "the same URL" needs care: "https://Example.com/a" and "https://example.com/a" are the same page.
// So we NORMALIZE the url before comparing. A simple, defensible way:
//   const parsed = new URL(url);          // already validated, so it won't throw
//   parsed.hash = "";                     // "#section" doesn't change the page
//   return parsed.href;                   // URL() already lowercases the host and adds "/" for bare domains
// Then the key is:  `${userId}|${normalizedUrl}`
//
// Write this function. Whatever you decide, WRITE WHY in the README ("How repeats are recognised").
export function makeDedupeKey(userId: string, url: string): string {
  // TODO: replace this line with your implementation
  const parsedURL = new URL(url);
  parsedURL.hash = "";

  return `${userId}|${parsedURL.href}`;
}

// [GUIDE] EXERCISE 10 — create, but return the existing one if it's a repeat.
// Steps:
//   1. const key = makeDedupeKey(userId, input.url);
//   2. const existingId = dedupeIndex.get(key);
//      if (existingId !== undefined) {
//        // repeat! return the SAME bookmark that we saved before, and say it wasn't created:
//        return { bookmark: bookmarks.get(existingId)!, created: false };
//      }
//   3. Otherwise build a new Bookmark:
//        const bookmark: Bookmark = {
//          id: randomUUID(),                 // randomUUID() makes a unique id like "3b241101-..."
//          userId,
//          url: input.url,
//          title: input.title ?? null,       // `??` = use right side if left is undefined/null
//          createdAt: new Date().toISOString(),
//        };
//   4. Save in BOTH maps:  bookmarks.set(bookmark.id, bookmark);  dedupeIndex.set(key, bookmark.id);
//   5. return { bookmark, created: true };
//
// Why return `created`? The route uses it to answer 201 (new) vs 200 (already existed).
// Why is this safe from double rows when two requests arrive at once? Node runs this function
// to completion without interruption (it's synchronous, no `await` inside), so no other request
// can sneak between step 2 and step 4. (With a real database you'd use a UNIQUE constraint instead.)
export function createBookmark(
  userId: string,
  input: CreateBookmarkInput,
): { bookmark: Bookmark; created: boolean } {
  // TODO: write steps 1-5 above, then delete the next line
  const key = makeDedupeKey(userId, input.url);
  const existingId = dedupeIndex.get(key);
  if (existingId !== undefined) {
    return { bookmark: bookmarks.get(existingId)!, created: false };
  }
  const bookmark: Bookmark = {
    id: randomUUID(),
    userId,
    url: input.url,
    title: input.title ?? null,
    createdAt: new Date().toISOString(),
  };
  bookmarks.set(bookmark.id, bookmark);
  dedupeIndex.set(key, bookmark.id);
  return { bookmark, created: true };
}

// [GUIDE] EXERCISE 11 — list only THIS user's bookmarks.
// Hint: [...bookmarks.values()] turns the Map's values into an array.
// Then .filter((b) => b.userId === userId)
export function listBookmarks(userId: string): Bookmark[] {
  return [...bookmarks.values()].filter(
    (bookmark) => bookmark.userId === userId,
  );
}

// [GUIDE] EXERCISE 12 — get one bookmark by id, but only if it belongs to this user.
// 1. const b = bookmarks.get(id);
// 2. if (!b || b.userId !== userId) return undefined;   // someone else's bookmark looks like "not found"
// 3. return b;
// (Returning "not found" instead of "forbidden" avoids leaking that the id exists.)
export function getBookmark(userId: string, id: string): Bookmark | undefined {
  const bookmark = bookmarks.get(id);
  if (!bookmark || bookmark.userId !== userId) return undefined;
  return bookmark;
}

// [GUIDE] EXERCISE 13 — delete a bookmark. Return true if deleted, false if not found.
// 1. const b = getBookmark(userId, id);  if (!b) return false;
// 2. bookmarks.delete(id);
// 3. ALSO remove it from the dedupe index, otherwise the user could never re-save that URL:
//      dedupeIndex.delete(makeDedupeKey(userId, b.url));
// 4. return true;

export function deleteBookmark(userId: string, id: string): boolean {
  const bookmark = getBookmark(userId, id);
  if (!bookmark) return false;
  bookmarks.delete(id);
  dedupeIndex.delete(makeDedupeKey(userId, bookmark.url));
  return true;
}
