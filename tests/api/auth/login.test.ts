/**
 * Tests for POST /api/auth/login
 * Auth: Supabase mock | DB: Prisma mock
 */
import { POST } from "@/app/api/auth/login/route";
import { createClient } from "@/lib/supabase/server";
import { prismaMock } from "../../helpers/prismaMock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/prisma", () => require("../../tests/helpers/prismaMock"));

const mockedCreateClient = jest.mocked(createClient);

// Prisma Profile fixture
const activeProfile = {
  id: "uuid-ok",
  email: "user@erp.com",
  fullName: "Valid User",
  role: "employee" as const,
  employeeId: "EMP-001",
  department: "Sales",
  phone: null,
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400 — missing fields", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }) as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it("401 — invalid credentials", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials", status: 401 },
        }),
      },
    } as any);

    const res = await POST(makeRequest({ email: "bad@b.com", password: "wrong" }) as any);
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it("403 — deactivated account", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: "uuid-inactive" },
            session: { expires_at: 9999 },
          },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    } as any);

    prismaMock.profile.findUnique.mockResolvedValue({
      ...activeProfile,
      id: "uuid-inactive",
      isActive: false,
    });

    const res = await POST(makeRequest({ email: "x@b.com", password: "pass1234" }) as any);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/deactivated/i);
  });

  it("200 — successful login returns profile + session", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: "uuid-ok", email: "user@erp.com" },
            session: { expires_at: 9999 },
          },
          error: null,
        }),
      },
    } as any);

    prismaMock.profile.findUnique.mockResolvedValue(activeProfile);

    const res = await POST(makeRequest({ email: "user@erp.com", password: "pass1234" }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.full_name).toBe("Valid User");
    expect(body.data.user.role).toBe("employee");
    expect(body.data.session.expires_at).toBe(9999);
  });
});
