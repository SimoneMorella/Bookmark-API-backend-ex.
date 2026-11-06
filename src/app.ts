import type { NextFunction, Request, Response } from "express";
import express from "express";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

// [INFO] Middleware = a function that runs on every request BEFORE your route handlers.
// express.json() reads the request body and turns JSON text into a JS object in req.body.
// `limit` rejects huge bodies early (413 error) so nobody can flood our memory.
app.use(express.json({ limit: "10kb" }));

// [INFO] Simple health endpoint, handy to check the server is up: GET /health
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Friendly welcome response for GET /
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Bookmark API",
    message:
      "Welcome! Send requests to /bookmarks (header X-User-Id required).",
    health: "/health",
  });
});

app.use("/bookmarks", bookmarksRouter);

app.use("/users", usersRouter);

// [INFO] Runs when no route matched: unknown path -> 404 instead of Express's HTML page.
app.use((_req, res) => {
  res.status(404).json({ error: "route not found" });
});

// [INFO] Error-handling middleware: Express recognises it by its 4 parameters (err, req, res, next).
// Any error thrown in a handler or in express.json() lands here.
// Without it, a body like {"url": (broken JSON) would produce a 500 or an HTML error page.
// Errors created by Express's body parser carry a `type` string:
// "entity.parse.failed" (broken JSON) or "entity.too.large" (body over the limit).
// Anything else is an unexpected bug: log it, but don't leak details to the caller.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; type?: string };
  if (e.type === "entity.parse.failed") {
    res.status(400).json({ error: "body: request body is not valid JSON" });
    return;
  }
  if (e.type === "entity.too.large") {
    res.status(413).json({ error: "body: request body is too large" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});
