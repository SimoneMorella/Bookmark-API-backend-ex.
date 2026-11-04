// [INFO] This file is finished. It defines the shapes (types) of our data.
// TypeScript types only exist while you write code; they vanish at runtime.
// That is exactly why we need validation: a caller can send ANYTHING over HTTP,
// no matter what our types say.

export interface Bookmark {
  id: string; // unique id we generate (see store.ts)
  userId: string; // who owns it (comes from the X-User-Id header)
  url: string; // the saved URL, in its normalized form
  title: string | null; // optional human title
  createdAt: string; // ISO date string
}

// What a caller is ALLOWED to send when creating a bookmark.
export interface CreateBookmarkInput {
  url: string;
  title?: string;
}

// What validation returns: either clean data, or an error message naming the field.
// This is a "discriminated union": check `ok` first and TypeScript knows which fields exist.
export type ValidationResult =
  | { ok: true; value: CreateBookmarkInput }
  | { ok: false; message: string };
