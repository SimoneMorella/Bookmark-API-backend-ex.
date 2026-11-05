import type { NextFunction, Request, Response } from "express";
import express from "express";
import { bookmarksRouter } from "./routes/bookmarks.js";

export const app = express();

// [INFO] Middleware = a function that runs on every request BEFORE your route handlers.
// express.json() reads the request body and turns JSON text into a JS object in req.body.
// `limit` rejects huge bodies early (413 error) so nobody can flood our memory.
app.use(express.json({ limit: "10kb" }));

// [INFO] Simple health endpoint, handy to check the server is up: GET /health
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/bookmarks", bookmarksRouter);

// [INFO] Runs when no route matched: unknown path -> 404 instead of Express's HTML page.
app.use((_req, res) => {
  res.status(404).json({ error: "route not found" });
});

// [INFO] Error-handling middleware: Express recognises it by its 4 parameters (err, req, res, next).
// Any error thrown in a handler or in express.json() lands here.
// Without it, a body like {"url": (broken JSON) would produce a 500 or an HTML error page.
//
// [GUIDE] EXERCISE 19 — turn bad JSON into a 400, and anything unexpected into a clean 500.
// Errors created by Express's body parser carry a `status` number (400 for broken JSON, 413 for too large)
// and a `type` string ("entity.parse.failed", "entity.too.large").
//   const e = err as { status?: number; type?: string };
//   if (e.type === "entity.parse.failed") {
//     res.status(400).json({ error: "body: request body is not valid JSON" });
//     return;
//   }
//   if (e.type === "entity.too.large") {
//     res.status(413).json({ error: "body: request body is too large" });
//     return;
//   }
//   // Anything else is OUR bug: log it for ourselves, but don't leak details to the caller.
//   console.error(err);
//   res.status(500).json({ error: "internal server error" });
//
// Think: the goal is that NO input the caller can send reaches that last 500 line.
// (Note: 413 is "payload too large", a 4xx client error, not a 500. Document it in the README.)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // TODO: write the code above. Delete the next two lines when done.
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
