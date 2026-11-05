import { beforeEach, describe, expect, it, vi } from "vitest";

// Run one exercise:  npm test -- -t "Exercise 10"
// Run this file:     npm test -- tests/store.test.ts

type Store = typeof import("../src/store.js");
let store: Store;

// The store keeps data in module-level Maps, so we re-import it fresh for every test.
beforeEach(async () => {
  vi.resetModules();
  store = await import("../src/store.js");
});

const input = (url: string, title?: string) => ({ url, title });

describe("store.ts", () => {
  it("Exercise 9: makeDedupeKey treats same user + same page as the same key", () => {
    const k = store.makeDedupeKey;
    expect(k("alice", "https://example.com/a")).toBe(
      k("alice", "https://example.com/a"),
    );
    expect(k("alice", "https://EXAMPLE.com/a")).toBe(
      k("alice", "https://example.com/a"),
    );
    expect(k("alice", "https://example.com/a#section")).toBe(
      k("alice", "https://example.com/a"),
    );
    expect(k("alice", "https://example.com")).toBe(
      k("alice", "https://example.com/"),
    );
  });

  it("Exercise 9: makeDedupeKey keeps different users / different pages apart", () => {
    const k = store.makeDedupeKey;
    expect(k("alice", "https://example.com/a")).not.toBe(
      k("bob", "https://example.com/a"),
    );
    expect(k("alice", "https://example.com/a")).not.toBe(
      k("alice", "https://example.com/b"),
    );
  });

  it("Exercise 10: createBookmark creates a new bookmark", () => {
    const { bookmark, created } = store.createBookmark(
      "alice",
      input("https://example.com/a", "Hi"),
    );
    expect(created).toBe(true);
    expect(bookmark.id).toBeTruthy();
    expect(bookmark.userId).toBe("alice");
    expect(bookmark.url).toBe("https://example.com/a");
    expect(bookmark.title).toBe("Hi");
    expect(Number.isNaN(Date.parse(bookmark.createdAt))).toBe(false);
  });

  it("Exercise 10: title defaults to null", () => {
    const { bookmark } = store.createBookmark(
      "alice",
      input("https://example.com/a"),
    );
    expect(bookmark.title).toBeNull();
  });

  it("Exercise 10: creating the same bookmark twice returns the same one, one row only", () => {
    const first = store.createBookmark("alice", input("https://example.com/a"));
    const second = store.createBookmark(
      "alice",
      input("https://example.com/a"),
    );
    expect(second.created).toBe(false);
    expect(second.bookmark.id).toBe(first.bookmark.id);
    expect(store.listBookmarks("alice")).toHaveLength(1);
  });

  it("Exercise 10: same URL for different users is NOT a repeat", () => {
    const a = store.createBookmark("alice", input("https://example.com/a"));
    const b = store.createBookmark("bob", input("https://example.com/a"));
    expect(b.created).toBe(true);
    expect(b.bookmark.id).not.toBe(a.bookmark.id);
  });

  it("Exercise 11: listBookmarks returns only this user's bookmarks", () => {
    store.createBookmark("alice", input("https://example.com/a"));
    store.createBookmark("alice", input("https://example.com/b"));
    store.createBookmark("bob", input("https://example.com/c"));
    expect(store.listBookmarks("alice")).toHaveLength(2);
    expect(store.listBookmarks("bob")).toHaveLength(1);
    expect(store.listBookmarks("nobody")).toEqual([]);
  });

  it("Exercise 12: getBookmark finds by id, only for the owner", () => {
    const { bookmark } = store.createBookmark(
      "alice",
      input("https://example.com/a"),
    );
    expect(store.getBookmark("alice", bookmark.id)).toEqual(bookmark);
    expect(store.getBookmark("bob", bookmark.id)).toBeUndefined();
    expect(store.getBookmark("alice", "unknown-id")).toBeUndefined();
  });

  it("Exercise 13: deleteBookmark removes it and returns true", () => {
    const { bookmark } = store.createBookmark(
      "alice",
      input("https://example.com/a"),
    );
    expect(store.deleteBookmark("alice", bookmark.id)).toBe(true);
    expect(store.getBookmark("alice", bookmark.id)).toBeUndefined();
    expect(store.listBookmarks("alice")).toEqual([]);
  });

  it("Exercise 13: deleteBookmark returns false if not found or not yours", () => {
    const { bookmark } = store.createBookmark(
      "alice",
      input("https://example.com/a"),
    );
    expect(store.deleteBookmark("alice", "unknown-id")).toBe(false);
    expect(store.deleteBookmark("bob", bookmark.id)).toBe(false);
    expect(store.getBookmark("alice", bookmark.id)).toBeDefined();
  });

  it("Exercise 13: after deleting, the same URL can be saved again as new", () => {
    const first = store.createBookmark("alice", input("https://example.com/a"));
    store.deleteBookmark("alice", first.bookmark.id);
    const again = store.createBookmark("alice", input("https://example.com/a"));
    expect(again.created).toBe(true);
  });
});
