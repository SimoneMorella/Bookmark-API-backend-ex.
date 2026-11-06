import { describe, expect, it } from "vitest";
import {
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
  validateCreateBookmark,
} from "../src/validation.js";

// Run one test:  npm test -- -t "url must be a string"
// Run this file:     npm test -- tests/validation.test.ts

function expectError(body: unknown, field: string) {
  const result = validateCreateBookmark(body);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.message.toLowerCase()).toContain(field);
}

describe("validation.ts", () => {
  it("body must be a JSON object (never throws)", () => {
    for (const bad of [undefined, null, "text", 42, true, []]) {
      expect(() => validateCreateBookmark(bad)).not.toThrow();
      const result = validateCreateBookmark(bad);
      expect(result.ok).toBe(false);
      // The message must NOT be the placeholder
      if (!result.ok) expect(result.message).not.toMatch(/not implemented/i);
    }
  });

  it("url is required (message names 'url')", () => {
    expectError({}, "url");
    expectError({ title: "no url here" }, "url");
  });

  it("url must be a string", () => {
    expectError({ url: 123 }, "url");
    expectError({ url: null }, "url");
    expectError({ url: { a: 1 } }, "url");
  });

  it("url must not be empty or only spaces", () => {
    expectError({ url: "" }, "url");
    expectError({ url: "     " }, "url");
  });

  it("url must not be too long", () => {
    const long = `https://example.com/${"a".repeat(2100)}`;
    expectError({ url: long }, "url");
    const justOver = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    expectError({ url: justOver }, "url");
  });

  it("url must be a valid http/https URL", () => {
    expectError({ url: "hello" }, "url");
    expectError({ url: "javascript:alert(1)" }, "url");
    expectError({ url: "ftp://example.com/file" }, "url");
    expect(validateCreateBookmark({ url: "http://example.com" }).ok).toBe(true);
    expect(
      validateCreateBookmark({ url: "https://example.com/a?b=1" }).ok,
    ).toBe(true);
  });

  it("title is optional, but must be a short string if present", () => {
    expectError({ url: "https://example.com", title: 5 }, "title");
    expectError(
      { url: "https://example.com", title: "x".repeat(MAX_TITLE_LENGTH + 1) },
      "title",
    );
    expect(validateCreateBookmark({ url: "https://example.com" }).ok).toBe(
      true,
    );
    expect(
      validateCreateBookmark({ url: "https://example.com", title: "Hi" }).ok,
    ).toBe(true);
  });

  it("valid input returns the clean (trimmed) value", () => {
    const result = validateCreateBookmark({
      url: "  https://example.com/a  ",
      title: "  My title  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBe("https://example.com/a");
      expect(result.value.title).toBe("My title");
    }
    const noTitle = validateCreateBookmark({ url: "https://example.com/a" });
    expect(noTitle.ok).toBe(true);
    if (noTitle.ok) expect(noTitle.value.title).toBeUndefined();
  });
});
