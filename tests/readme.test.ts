import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Run:  npm test -- tests/readme.test.ts
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

// Text between a "## Heading" and the next "## " heading, without HTML comments.
function section(title: string): string {
  const start = readme.indexOf(`## ${title}`);
  if (start === -1) return "";
  const rest = readme.slice(start + title.length + 3);
  const end = rest.indexOf("\n## ");
  return (end === -1 ? rest : rest.slice(0, end))
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

describe("README.md", () => {
  it("Exercise 20: endpoints table is filled in (no TODO) and mentions status codes", () => {
    const text = section("Endpoints and status codes");
    expect(text).not.toMatch(/TODO/);
    for (const code of ["200", "201", "204", "400", "404"])
      expect(text).toContain(code);
  });

  it("Exercise 21: validation rules are written (no TODO)", () => {
    const text = section("Validation rules");
    expect(text).not.toMatch(/TODO/);
    expect(text.length).toBeGreaterThan(100);
  });

  it("Exercise 22: 'How repeats are recognised' explains the why (no TODO)", () => {
    const text = section("How repeats are recognised");
    expect(text).not.toMatch(/TODO/);
    expect(text.length).toBeGreaterThan(300);
  });
});
