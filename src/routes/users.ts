import type { Request, Response } from "express";
import { Router } from "express";
import { listBookmarks } from "../store.js";

// [INFO] This router is mounted at "/users" in app.ts, so every path below is prefixed with /users.
export const usersRouter = Router();

// GET /users/:userId/bookmarks
// A caller may only read their own list: the id in the URL must match the X-User-Id header.
// Missing header -> 400, header for a different user -> 403 (known caller, not allowed).
usersRouter.get("/:userId/bookmarks", (req: Request, res: Response) => {
  const userId = req.header("x-user-id")?.trim();
  const pathId = String(req.params.userId).trim();
  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }
  if (userId !== pathId) {
    res.status(403).json({ error: "you can only read your own bookmarks" });
    return;
  }
  res.status(200).json(listBookmarks(pathId));
});
