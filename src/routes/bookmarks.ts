import type { Request, Response } from "express";
import { Router } from "express";
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
} from "../store.js";
import { validateCreateBookmark } from "../validation.js";

// A Router groups related endpoints. In app.ts it is mounted at
// "/bookmarks", so router.post("/") below means "POST /bookmarks".
export const bookmarksRouter = Router();

// Callers are identified with a header:  X-User-Id: alice
// (No real login; the header stands in for "who is calling".)
// Express lowercases header names, so we read "x-user-id".
export function getUserId(req: Request): string | undefined {
  const id = req.header("x-user-id")?.trim();
  return id ? id : undefined;
}

// Status codes:
//   POST   /bookmarks      201 created | 200 already existed | 400 bad input
//   GET    /bookmarks      200 list of this user's bookmarks | 400 missing user header
//   GET    /bookmarks/:id  200 found | 404 not found | 400 missing user header
//   DELETE /bookmarks/:id  204 deleted (no body) | 404 not found | 400 missing user header

// POST /bookmarks: check the caller, validate the body, then save.
bookmarksRouter.post("/", (req: Request, res: Response) => {
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

// GET /bookmarks
bookmarksRouter.get("/", (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  res.status(200).json(listBookmarks(userId));
});

// GET /bookmarks/:id
bookmarksRouter.get("/:id", (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  const bookmark = getBookmark(userId, String(req.params.id));
  if (!bookmark) {
    res.status(404).json({ error: "bookmark not found" });
    return;
  }
  res.status(200).json(bookmark);
});

// DELETE /bookmarks/:id
bookmarksRouter.delete("/:id", (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  const deleted = deleteBookmark(userId, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: "bookmark not found" });
    return;
  }
  res.status(204).end();
});
