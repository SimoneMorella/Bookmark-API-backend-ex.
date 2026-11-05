import type { Request, Response } from "express";
import { Router } from "express";
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
} from "../store.js";
import { validateCreateBookmark } from "../validation.js";

// [INFO] A Router is a mini-app that groups related endpoints. In app.ts it is mounted at
// "/bookmarks", so router.post("/") below means "POST /bookmarks".
export const bookmarksRouter = Router();

// [INFO] Every handler gets (req, res):
//   req = what the caller sent (headers, body, URL params)
//   res = how we answer (res.status(201).json({...}))
// We identify the caller with a header:  X-User-Id: alice
// (No real login in this exercise; the header stands in for "who is calling".)

// [GUIDE] EXERCISE 14 — read the user id from the header, safely.
// Express lowercases header names: req.header("x-user-id") returns string | undefined.
// Return the id if present and non-empty after trim(), otherwise return undefined.
// The handlers below send a 400 "x-user-id header is required" when this returns undefined.
export function getUserId(req: Request): string | undefined {
  // TODO: e.g.  const id = req.header("x-user-id")?.trim();  return id ? id : undefined;
  const id = req.header("x-user-id")?.trim();
  return id ? id : undefined;
}

// [INFO] Documented status codes (copy them into your README too):
//   POST   /bookmarks      201 created | 200 already existed | 400 bad input
//   GET    /bookmarks      200 list of this user's bookmarks | 400 missing user header
//   GET    /bookmarks/:id  200 found | 404 not found | 400 missing user header
//   DELETE /bookmarks/:id  204 deleted (no body) | 404 not found | 400 missing user header

// ---------- POST /bookmarks ----------
// [GUIDE] EXERCISE 15 — create endpoint. Order matters: check the caller, validate, then save.
//   1. const userId = getUserId(req);
//      if (!userId) { res.status(400).json({ error: "x-user-id header is required" }); return; }
//   2. const result = validateCreateBookmark(req.body);
//      if (!result.ok) { res.status(400).json({ error: result.message }); return; }
//      (`return` is essential: without it the code continues and tries to answer twice.)
//   3. const { bookmark, created } = createBookmark(userId, result.value);
//   4. res.status(created ? 201 : 200).json(bookmark);
//      Same request twice -> same bookmark (same id) both times, only one row stored.
bookmarksRouter.post("/", (req: Request, res: Response) => {
  // TODO: steps 1-4. Delete the next line when done.
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  const result = validateCreateBookmark(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.message });
    return;
  }
  const { bookmark, created } = createBookmark(userId, result.value);
  res.status(created ? 201 : 200).json(bookmark);
});

// ---------- GET /bookmarks ----------
// [GUIDE] EXERCISE 16 — list endpoint.
//   1. Get userId like above (400 if missing).
//   2. res.status(200).json(listBookmarks(userId));
bookmarksRouter.get("/", (req: Request, res: Response) => {
  // TODO
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  res.status(200).json(listBookmarks(userId));
});

// ---------- GET /bookmarks/:id ----------
// [GUIDE] EXERCISE 17 — fetch one.
// ":id" in the path becomes req.params.id (the text the caller put there).
//   1. userId (400 if missing)
//   2. const bookmark = getBookmark(userId, req.params.id);
//      TypeScript may say params.id is `string | string[]`. Fix with: String(req.params.id)
//   3. if (!bookmark) { res.status(404).json({ error: "bookmark not found" }); return; }
//   4. res.status(200).json(bookmark);
bookmarksRouter.get("/:id", (req: Request, res: Response) => {
  // TODO
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: 'x-user-id header is required'});
    return;
  }
  const bookmark = getBookmark(userId, String(req.params.id));
  if (!bookmark) {
    res.status(400).json({error: 'bookmark not found'});
    return;
  }
  res.status(200).json(bookmark);
});

// ---------- DELETE /bookmarks/:id ----------
// [GUIDE] EXERCISE 18 — delete one.
//   1. userId (400 if missing)
//   2. const deleted = deleteBookmark(userId, String(req.params.id));
//   3. if (!deleted) -> 404 { error: "bookmark not found" }
//   4. otherwise res.status(204).end();   // 204 = success with no body
bookmarksRouter.delete("/:id", (req: Request, res: Response) => {
  // TODO
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({error: 'x-user-id header is required'});
    return;
  }
  const deleted = deleteBookmark(userId, String(req.params.id));
    if (!deleted) {
        res.status(404).json({error: 'bookmark not found'});
        return;
    }
  res.status(204).end();
});
