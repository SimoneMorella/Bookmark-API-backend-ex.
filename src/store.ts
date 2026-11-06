import { randomUUID } from "node:crypto";
import type { Bookmark, CreateBookmarkInput } from "./types.js";

// The "store" is where data lives. To keep this project simple we use
// a plain in-memory Map (data disappears when the server restarts).
const bookmarks = new Map<string, Bookmark>(); // key = bookmark id

// To find a repeat quickly we keep a second map: "dedupe key" -> bookmark id.
const dedupeIndex = new Map<string, string>();

// A repeat is the same user saving the same page again, so the identity is (userId + normalized url).
// Normalizing: new URL() lowercases the host and adds "/" to bare domains, and we drop the #fragment
// because it doesn't change the page.
export function makeDedupeKey(userId: string, url: string): string {
  const parsedURL = new URL(url);
  parsedURL.hash = "";

  return `${userId}|${parsedURL.href}`;
}

// Returns the existing bookmark if the same user already saved the same page (created: false).
// The route uses `created` to answer 201 (new) vs 200 (already existed).
// This function is synchronous (no `await`), so two simultaneous requests can't
// both pass the dedupe check before one of them has saved.
export function createBookmark(
  userId: string,
  input: CreateBookmarkInput,
): { bookmark: Bookmark | undefined; created: boolean } {
  const key = makeDedupeKey(userId, input.url);
  const existingId = dedupeIndex.get(key);
  if (existingId !== undefined) {
    return { bookmark: bookmarks.get(existingId), created: false };
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

export function listBookmarks(userId: string): Bookmark[] {
  return [...bookmarks.values()].filter(
    (bookmark) => bookmark.userId === userId,
  );
}

// Someone else's bookmark looks like "not found", so we don't leak that the id exists.
export function getBookmark(userId: string, id: string): Bookmark | undefined {
  const bookmark = bookmarks.get(id);
  if (!bookmark || bookmark.userId !== userId) return undefined;
  return bookmark;
}

// Returns true if deleted, false if not found. The dedupe entry is removed too,
// otherwise the user could never save that URL again.
export function deleteBookmark(userId: string, id: string): boolean {
  const bookmark = getBookmark(userId, id);
  if (!bookmark) return false;
  bookmarks.delete(id);
  dedupeIndex.delete(makeDedupeKey(userId, bookmark.url));
  return true;
}
