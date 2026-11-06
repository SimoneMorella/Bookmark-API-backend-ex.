# Bookmark API

A small HTTP service (Node.js + Express + TypeScript) for saving bookmarks.
It must survive bad input: malformed requests get a `400` naming the field, never a `500`.

## Run it

```bash
npm install
npm run dev        # starts with auto-reload on http://localhost:3000 (or the PORT set in .env)
npm run check      # (second terminal) smoke-tests good and bad requests
npm test           # automated tests
npm run typecheck  # checks the TypeScript types
npm run lint       # lints and checks formatting (npm run lint:fix to fix)
```

Create a `.env` file with `PORT=7777` to change the port (it defaults to 3000). The examples below use port 7777.
If your port is different, change it in the commands, and run the smoke test as `BASE=http://localhost:7777 npm run check`.

Callers identify themselves with the header `X-User-Id: <name>` (there is no real login).

## Endpoints and status codes

| Method | Path                     | Success                                     | Errors                                                     |
| ------ | ------------------------ | ------------------------------------------- | ---------------------------------------------------------- |
| GET    | /                        | 200 welcome message                         |                                                            |
| GET    | /health                  | 200 `{"status":"ok"}`                       |                                                            |
| POST   | /bookmarks               | 201 created, 200 already existed (a repeat) | 400 invalid body or missing header, 413 body over 10 kb    |
| GET    | /bookmarks               | 200 list of the caller's bookmarks          | 400 missing header                                         |
| GET    | /bookmarks/:id           | 200 the bookmark                            | 400 missing header, 404 not found                          |
| DELETE | /bookmarks/:id           | 204 no body                                 | 400 missing header, 404 not found                          |
| GET    | /users/:userId/bookmarks | 200 list of that user's bookmarks           | 400 missing header, 403 header user differs from `:userId` |

Any unknown path returns `404 {"error":"route not found"}`. Errors always look like `{ "error": "<message>" }`.
Unexpected server errors return `500 {"error":"internal server error"}`; no input a caller can send should reach it.
A bookmark is owned by the user in `X-User-Id`, so someone else's bookmark looks like `404`.

## Examples

```bash
# Create a bookmark -> 201, returns the saved bookmark (with its generated id)
curl -i -X POST http://localhost:7777/bookmarks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: alice" \
  -d '{"url": "https://example.com", "title": "Example"}'

# Send the same request again -> 200, same bookmark and same id, still one row

# List alice's bookmarks -> 200
curl -i http://localhost:7777/bookmarks -H "X-User-Id: alice"

# Same list through the user route (header must match the user in the URL) -> 200
curl -i http://localhost:7777/users/alice/bookmarks -H "X-User-Id: alice"

# Another user's list -> 403
curl -i http://localhost:7777/users/bob/bookmarks -H "X-User-Id: alice"

# Get one bookmark (use the id returned when creating) -> 200, or 404
curl -i http://localhost:7777/bookmarks/<id> -H "X-User-Id: alice"

# Delete it -> 204
curl -i -X DELETE http://localhost:7777/bookmarks/<id> -H "X-User-Id: alice"

# Bad input -> 400 {"error":"url must be a string"}
curl -i -X POST http://localhost:7777/bookmarks \
  -H "Content-Type: application/json" -H "X-User-Id: alice" -d '{"url": 123}'
```

## Validation rules

Every rejection is a `400` with a message that names the field:

| Input                              | Response error                         |
| ---------------------------------- | -------------------------------------- |
| Missing `X-User-Id` header         | `x-user-id header is required`         |
| Broken JSON                        | `body: request body is not valid JSON` |
| Body missing, `null` or an array   | `Request body must be a JSON object`   |
| `url` missing                      | `url is required`                      |
| `url` not a string (e.g. a number) | `url must be a string`                 |
| `url` empty or only spaces         | `url must not be empty`                |
| `url` longer than 2000 characters  | `url must be shorter than 2000`        |
| `url` not parseable as a URL       | `url must be a valid URL`              |
| `url` not `http:` or `https:`      | `url must start with http: or https:`  |
| `title` present but not a string   | `title must be a string`               |
| `title` longer than 200 characters | `title must be at most 200 characters` |

`title` is optional. A body larger than 10 kb is rejected with `413` (`body: request body is too large`).

## How repeats are recognised

A repeat is the same user saving the same page again, so a bookmark is identified by **user id + normalized URL**
(see `makeDedupeKey` in `src/store.ts`).

- **Normalizing:** `new URL()` lowercases the host and adds the trailing `/` to bare domains, and the `#fragment`
  is removed because it doesn't change the page. The path and query string are kept as they are, so `/A` and `/a`
  or `?a=1` and `?a=2` count as different pages.
- **Lookup:** a second map (`dedupeIndex`) maps the key to the bookmark id, so a repeat is found instantly.
- **Answer:** the first request returns `201` with the new bookmark. A repeat returns `200` with the existing
  bookmark (same id) and no new row is created, so retrying a request is always safe.
- **Different users:** the user id is part of the key, so two users can save the same URL.
- **Deleting:** a deleted bookmark is also removed from the index, so the URL can be saved again.

Why this way: comparing raw strings would store `https://Example.com` and `https://example.com` as two rows even
though they are the same page. An `Idempotency-Key` header would force every caller to send an extra header and
wouldn't catch the same page sent in a different spelling.
`createBookmark` is synchronous (no `await`), so two simultaneous identical requests can't both pass the check
before one has saved.

## Limitations

Data is stored in memory, so it is lost when the server restarts.
In a real application a database with a `UNIQUE (user_id, url)` constraint would enforce uniqueness and persist the data.
