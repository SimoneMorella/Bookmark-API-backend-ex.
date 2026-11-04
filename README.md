# Bookmark API

A small HTTP service (Node.js + Express + TypeScript) for saving bookmarks.
It must survive bad input: malformed requests get a `400` naming the field, never a `500`.

## Run it

```bash
npm install
npm run dev        # starts on http://localhost:3000 with auto-reload
npm run check      # (second terminal) smoke-tests good and bad requests
npm run typecheck  # checks the TypeScript types
```

Callers identify themselves with the header `X-User-Id: <name>` (no real login in this exercise).

## Endpoints and status codes

<!-- [GUIDE] EXERCISE 20 — Fill this table from the comments in src/routes/bookmarks.ts, and add example
requests/responses (curl commands). A reviewer reads this first, so make it clear. -->

| Method | Path | Success | Errors |
| ------ | ---- | ------- | ------ |
| POST | /bookmarks | TODO | TODO |
| GET | /bookmarks | TODO | TODO |
| GET | /bookmarks/:id | TODO | TODO |
| DELETE | /bookmarks/:id | TODO | TODO |

## Validation rules

<!-- [GUIDE] EXERCISE 21 — List what you reject and the message each gives (empty url, number, missing,
too long, not a URL, bad title, broken JSON, ...). Say that errors look like { "error": "url must be a string" }. -->

TODO

## How repeats are recognised

<!-- [GUIDE] EXERCISE 22 — The most important part for the reviewer. Explain in your own words:
1. What identifies a repeat (same user + same normalized URL)?
2. How do you normalize (lowercase host, remove #fragment, ...)? Why those choices?
3. What does the API answer on a repeat (200 + the existing bookmark, vs 201 for new)?
4. Why this way and not another (e.g. an Idempotency-Key header, or comparing the raw string)?
   Tip: mention the trade-off. Raw-string comparison would store "https://Example.com" and
   "https://example.com" as two rows even though they're the same page.
5. Limits: data is in memory, so it's lost on restart. A real database would use a UNIQUE (user_id, url) constraint. -->

TODO
