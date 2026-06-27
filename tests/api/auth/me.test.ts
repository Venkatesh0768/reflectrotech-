/**
 * Tests for GET /api/auth/me
 * Auth: Supabase mock | DB: Prisma mock
 */
import { GET } from "@/app/api/auth/me/route";
import { createClient } from "@/lib/supabase/server";
import { prismaMock } from "../../helpers/prismaMock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/prisma", () => require("../../tests/helpers/prismaMock"));

const mockedCreateClient = jest.mocked(createClient);

const activeProfile = {
  id: "uuid-me",
  email: "me@erp.com",
  fullName: "Me User",
  role: "manager" as const,
  employeeId: null,
  department: "Ops",
  phone: null,
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockAuth(userId: string | null) {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: userId ? null : { message: "not authenticated" },
      }),
    },
  } as any);
}

describe("GET /api/auth/me", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 — not authenticated", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("401 — profile not found in DB", async () => {
    mockAuth("uuid-ghost");
    prismaMock.profile.findUnique.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/profile not found/i);
  });

  it("403 — account deactivated", async () => {
    mockAuth("uuid-inactive");
    prismaMock.profile.findUnique.mockResolvedValue({
      ...activeProfile,
      id: "uuid-inactive",
      isActive: false,
    });
    const res = await GET();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/deactivated/i);
  });

  it("200 — returns profile + permissions", async () => {
    mockAuth("uuid-me");
    prismaMock.profile.findUnique.mockResolvedValue(activeProfile);
    prismaMock.rolePermission.findMany.mockResolvedValue([
      { id: 1, role: "manager", permission: "inventory:read", createdAt: new Date() },
      { id: 2, role: "manager", permission: "orders:read",    createdAt: new Date() },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("manager");
    expect(body.data.full_name).toBe("Me User");
    expect(body.data.permissions).toContain("inventory:read");
    expect(body.data.permissions).toContain("orders:read");
  });
});
