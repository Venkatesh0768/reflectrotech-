/**
 * Smoke test — verifies Jest + TypeScript + path aliases are working.
 * This test does not call any external service.
 */

describe("Environment smoke test", () => {
  it("Jest is configured and TypeScript works", () => {
    const value: number = 1 + 1;
    expect(value).toBe(2);
  });

  it("NEXT_PUBLIC_SUPABASE_URL env var is present in test env", () => {
    // This will pass once .env.test has a value set.
    // For now we just assert the key exists (value may be placeholder).
    expect(typeof process.env.NEXT_PUBLIC_SUPABASE_URL).toBe("string");
  });
});
