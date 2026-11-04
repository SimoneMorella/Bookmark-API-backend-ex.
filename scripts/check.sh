#!/usr/bin/env bash
# [INFO] Smoke test: run the server in one terminal (npm run dev), then in another: npm run check
# Each line prints the HTTP status the server returned vs the one expected (OK / FAIL).
# Read it to learn curl:  -s silent, -w "%{http_code}" print the status, -H header, -d body, -X method.
BASE=${BASE:-http://localhost:3000}
U="X-User-Id: alice"
J="Content-Type: application/json"
LONG=$(printf 'a%.0s' $(seq 1 2100))

req() { # req <label> <expected> <curl args...>
  local label=$1 expected=$2; shift 2
  local out; out=$(curl -s -w '\n%{http_code}' "$@")
  local code=${out##*$'\n'}; local body=${out%$'\n'*}
  local mark="OK  "; [ "$code" = "$expected" ] || mark="FAIL"
  echo "$mark $label -> $code (expected $expected) $body"
}

req "valid create"        201 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"https://example.com/a"}'
req "same create again"   200 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"https://example.com/a"}'
req "same, other casing"  200 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"https://EXAMPLE.com/a"}'
req "empty url"           400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":""}'
req "number url"          400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":123}'
req "missing url"         400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{}'
req "2KB url"             400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d "{\"url\":\"https://example.com/$LONG\"}"
req "not a url"           400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"hello"}'
req "javascript: url"     400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"javascript:alert(1)"}'
req "title is number"     400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":"https://example.com/b","title":5}'
req "broken JSON"         400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '{"url":'
req "body is null"        400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d 'null'
req "body is array"       400 -X POST $BASE/bookmarks -H "$U" -H "$J" -d '[]'
req "no body at all"      400 -X POST $BASE/bookmarks -H "$U"
req "no user header"      400 -X POST $BASE/bookmarks -H "$J" -d '{"url":"https://example.com/a"}'
req "list"                200 $BASE/bookmarks -H "$U"
req "get unknown id"      404 $BASE/bookmarks/does-not-exist -H "$U"
req "delete unknown id"   404 -X DELETE $BASE/bookmarks/does-not-exist -H "$U"
echo "Finally, GET /bookmarks must show exactly ONE bookmark for alice:"
curl -s $BASE/bookmarks -H "$U"; echo
