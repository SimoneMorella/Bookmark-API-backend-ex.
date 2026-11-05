import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Request } from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getUserId } from "../src/routes/bookmarks.js";

// Run one exercise:  npm test -- -t "Exercise 15"
// Run this file:     npm test -- tests/routes.test.ts
// These tests start the real app on a random free port and send real HTTP requests.

let server: Server;
let base: string;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

// Every test uses its own user id so tests don't see each other's data.
let counter = 0;
const newUser = () => `user-${Date.now()}-${counter++}`;

async function call(
  method: string,
  path: string,
  user: string | null,
  body?: string,
) {
  const headers: Record<string, string> = {};
  if (user) headers["x-user-id"] = user;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return {
    status: res.status,
    json: json as Record<string, unknown> & unknown[],
    text,
  };
}

const create = (user: string | null, url: string, title?: string) =>
  call("POST", "/bookmarks", user, JSON.stringify({ url, title }));

describe("routes/bookmarks.ts", () => {
  it("Exercise 14: getUserId reads and trims the x-user-id header", () => {
    const fakeReq = (value?: string) =>
      ({ header: () => value }) as unknown as Request;
    expect(getUserId(fakeReq("alice"))).toBe("alice");
    expect(getUserId(fakeReq("  alice  "))).toBe("alice");
    expect(getUserId(fakeReq(undefined))).toBeUndefined();
    expect(getUserId(fakeReq("   "))).toBeUndefined();
  });

  it("Exercise 15: POST /bookmarks returns 201 and the bookmark", async () => {
    const res = await create(newUser(), "https://example.com/a", "Hi");
    expect(res.status).toBe(201);
    expect(res.json.url).toBe("https://example.com/a");
    expect(res.json.id).toBeTruthy();
  });

  it("Exercise 15: same POST twice -> 200 and the same bookmark, one row", async () => {
    const user = newUser();
    const first = await create(user, "https://example.com/a");
    const second = await create(user, "https://example.com/a");
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.json.id).toBe(first.json.id);
    const list = await call("GET", "/bookmarks", user);
    expect(list.json).toHaveLength(1);
  });

  it("Exercise 15: bad input -> 400 with an error naming the field", async () => {
    const user = newUser();
    const cases: [string, string][] = [
      ['{"url":""}', "url"],
      ['{"url":123}', "url"],
      ["{}", "url"],
      [
        JSON.stringify({ url: `https://example.com/${"a".repeat(2100)}` }),
        "url",
      ],
      ['{"url":"https://example.com","title":5}', "title"],
    ];
    for (const [body, field] of cases) {
      const res = await call("POST", "/bookmarks", user, body);
      expect(res.status, body.slice(0, 40)).toBe(400);
      expect(String(res.json.error).toLowerCase()).toContain(field);
    }
  });

  it("Exercise 15: missing x-user-id header -> 400", async () => {
    const res = await create(null, "https://example.com/a");
    expect(res.status).toBe(400);
    expect(String(res.json.error).toLowerCase()).toContain("x-user-id");
  });

  it("Exercise 16: GET /bookmarks lists only the caller's bookmarks", async () => {
    const alice = newUser();
    const bob = newUser();
    await create(alice, "https://example.com/a");
    await create(alice, "https://example.com/b");
    await create(bob, "https://example.com/c");
    const res = await call("GET", "/bookmarks", alice);
    expect(res.status).toBe(200);
    expect(res.json).toHaveLength(2);
  });

  it("Exercise 16: GET /bookmarks without header -> 400", async () => {
    expect((await call("GET", "/bookmarks", null)).status).toBe(400);
  });

  it("Exercise 17: GET /bookmarks/:id returns 200 or 404", async () => {
    const user = newUser();
    const created = await create(user, "https://example.com/a");
    const found = await call("GET", `/bookmarks/${created.json.id}`, user);
    expect(found.status).toBe(200);
    expect(found.json.id).toBe(created.json.id);
    expect((await call("GET", "/bookmarks/nope", user)).status).toBe(404);
    // someone else's bookmark looks like "not found"
    expect(
      (await call("GET", `/bookmarks/${created.json.id}`, newUser())).status,
    ).toBe(404);
    expect(
      (await call("GET", `/bookmarks/${created.json.id}`, null)).status,
    ).toBe(400);
  });

  it("Exercise 18: DELETE /bookmarks/:id returns 204, then 404", async () => {
    const user = newUser();
    const created = await create(user, "https://example.com/a");
    const del = await call("DELETE", `/bookmarks/${created.json.id}`, user);
    expect(del.status).toBe(204);
    expect(del.text).toBe("");
    expect(
      (await call("DELETE", `/bookmarks/${created.json.id}`, user)).status,
    ).toBe(404);
    expect(
      (await call("GET", `/bookmarks/${created.json.id}`, user)).status,
    ).toBe(404);
    expect((await call("DELETE", "/bookmarks/x", null)).status).toBe(400);
  });
});

describe("app.ts", () => {
  it("Exercise 19: broken JSON -> 400 (not 500)", async () => {
    const res = await call("POST", "/bookmarks", newUser(), '{"url":');
    expect(res.status).toBe(400);
    expect(String(res.json.error).toLowerCase()).toContain("json");
  });

  it("Exercise 19: too-large body -> 413 (not 500)", async () => {
    const res = await call(
      "POST",
      "/bookmarks",
      newUser(),
      JSON.stringify({ url: "a".repeat(20000) }),
    );
    expect(res.status).toBe(413);
  });

  it("Exercise 19: null body, array body and no body -> 400 (not 500)", async () => {
    const user = newUser();
    expect((await call("POST", "/bookmarks", user, "null")).status).toBe(400);
    expect((await call("POST", "/bookmarks", user, "[]")).status).toBe(400);
    expect((await call("POST", "/bookmarks", user)).status).toBe(400);
  });
});
