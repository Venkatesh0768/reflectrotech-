/**
 * Tests for POST /api/auth/signup
 * Auth: Supabase mock | DB: not involved (trigger runs server-side)
 */
import { POST } from "@/app/api/auth/signup/route";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

const mockedCreateClient = jest.mocked(createClient);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockSignUp(result: object) {
  mockedCreateClient.mockResolvedValue({
    auth: { signUp: jest.fn().mockResolvedValue(result) },
  } as any);
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400 — missing required fields", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }) as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it("400 — password too short", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", password: "abc", full_name: "X" }) as any
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/8 characters/i);
  });

  it("400 — invalid role", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", password: "pass1234", full_name: "X", role: "god" }) as any
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/role/i);
  });

  it("400 — Supabase duplicate email error", async () => {
    mockSignUp({
      data: { user: null, session: null },
      error: { message: "User already registered", status: 400 },
    });
    const res = await POST(
      makeRequest({ email: "dup@b.com", password: "pass1234", full_name: "X" }) as any
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already registered/i);
  });

  it("201 — successful signup", async () => {
    mockSignUp({
      data: {
        user: { id: "uuid-1", email: "new@b.com" },
        session: { expires_at: 9999 },
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ email: "new@b.com", password: "pass1234", full_name: "New" }) as any
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe("uuid-1");
  });

  it("201 — null session when email confirmation pending", async () => {
    mockSignUp({
      data: { user: { id: "uuid-2", email: "pend@b.com" }, session: null },
      error: null,
    });
    const res = await POST(
      makeRequest({ email: "pend@b.com", password: "pass1234", full_name: "Pending" }) as any
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.session).toBeNull();
  });
});
