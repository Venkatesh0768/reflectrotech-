/**
 * Tests for GET /api/users
 * Auth: Supabase mock | DB: Prisma mock
 */
import { GET } from "@/app/api/users/route";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { prismaMock } from "../../helpers/prismaMock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/prisma", () => require("../../tests/helpers/prismaMock"));

const mockedCreateClient = jest.mocked(createClient);

const adminProfile = {
  id: "admin-uuid",
  email: "admin@erp.com",
  fullName: "Admin User",
  role: "admin" as const,
  employeeId: null,
  department: null,
  phone: null,
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockAdminAuth() {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "admin-uuid" } },
        error: null,
      }),
    },
  } as any);
  prismaMock.profile.findUnique.mockResolvedValue(adminProfile);
}

function makeRequest(qs = "") {
  return new NextRequest(`http://localhost/api/users${qs}`);
}

describe("GET /api/users", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 — not authenticated", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any);
    prismaMock.profile.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("403 — non-admin role", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "emp-uuid" } },
          error: null,
        }),
      },
    } as any);
    prismaMock.profile.findUnique.mockResolvedValue({
      ...adminProfile,
      id: "emp-uuid",
      role: "employee",
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("400 — invalid role filter", async () => {
    mockAdminAuth();
    const res = await GET(makeRequest("?role=superuser"));
    expect(res.status).toBe(400);
  });

  it("200 — returns paginated list", async () => {
    mockAdminAuth();

    const users = [
      { ...adminProfile, id: "u1", email: "a@erp.com", role: "employee" as const },
      { ...adminProfile, id: "u2", email: "b@erp.com", role: "manager"  as const },
    ];

    // $transaction returns [users[], count]
    prismaMock.$transaction.mockResolvedValue([users, 2] as any);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.users).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.total_pages).toBe(1);
  });

  it("200 — pagination calculates total_pages correctly", async () => {
    mockAdminAuth();
    prismaMock.$transaction.mockResolvedValue([[], 55] as any);

    const res = await GET(makeRequest("?page=1&limit=20"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.pagination.total_pages).toBe(3); // ceil(55/20)
  });
});
