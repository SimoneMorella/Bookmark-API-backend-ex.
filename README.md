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

| Method | Path           | Success | Errors |
| ------ | -------------- |---------|--------|
| POST   | /bookmarks     | 201-200 | 400    |
| GET    | /bookmarks     | 200     | 400    |
| GET    | /bookmarks/:id | 200     | 400    |
| DELETE | /bookmarks/:id | 204     | 400    |

# Examples of curl requests

```bash
# Create a bookmark
curl -X POST http://localhost:3000/bookmarks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: alice" \
  -d '{"url": "https://example.com", "title": "Example"}'
  
# Get all bookmarks for a user
curl -X GET http://localhost:3000/bookmarks \
  -H "X-User-Id: alice"
  
# Get a specific bookmark by ID
curl -X GET http://localhost:3000/bookmarks/1 \
    -H "X-User-Id: alice"
    
# Delete a bookmark by ID
curl -X DELETE http://localhost:3000/bookmarks/1 \
    -H "X-User-Id: alice"
```

## Validation rules

<!-- [GUIDE] EXERCISE 21 — List what you reject and the message each gives (empty url, number, missing,
too long, not a URL, bad title, broken JSON, ...). Say that errors look like { "error": "url must be a string" }. -->

Validation rules for bookmarks:
- Requests must be valid JSON. If not, the server responds with a 400 status code and an error message indicating that the request body is not valid JSON.
- The request body must contain a 'url' field that is a string and a valid URL. It also must not exceed 2048 characters. If the 'url' field is missing, not a string, or exceeds the length limit, the server responds with a 400 status code and an appropriate error message.
- The request body may contain an optional 'title' field that is a string and must not exceed 256 characters. If the 'title' field is present but not a string or exceeds the length limit, the server responds with a 400 status code and an appropriate error message.
- The 'X-User-Id' header must be present in the request. If it is missing, the server responds with a 400 status code and an error message indicating that the 'x-user-id header is required.

## How repeats are recognised

<!-- [GUIDE] EXERCISE 22 — The most important part for the reviewer. Explain in your own words:
1. What identifies a repeat (same user + same normalized URL)?
2. How do you normalize (lowercase host, remove #fragment, ...)? Why those choices?
3. What does the API answer on a repeat (200 + the existing bookmark, vs 201 for new)?
4. Why this way and not another (e.g. an Idempotency-Key header, or comparing the raw string)?
   Tip: mention the trade-off. Raw-string comparison would store "https://Example.com" and
   "https://example.com" as two rows even though they're the same page.
5. Limits: data is in memory, so it's lost on restart. A real database would use a UNIQUE (user_id, url) constraint. -->

A repeat is identified by the combination of the same user (from the 'X-User-Id' header) and the same normalized URL.
Normalizing means converting the URL to lowercase, removing fragments (the part after '#'), and ensuring that the URL is in standard format.
The API responds with a 200 status code and the existing bookmark if a repeat is detected, while it responds with a 201 status code for new bookmarks.
This approach makes sure to avoid storing duplicate bookmarks for the same user, while still allowing different users to have the same bookmark.
For example, comparing raw strings would treat "https://Example.com" and "https://example.com" as different bookmarks, which is not desired.
Also, using Idempotency-Key headers would require additional client-side management and does not address the issue of URL normalization.

# Limitations
Because the data is stored in memory, it is lost on server restart. 
In a real-world application, a database with a UNIQUE constraint on (user_id, url) would be used to enforce uniqueness and persist data across restarts.

