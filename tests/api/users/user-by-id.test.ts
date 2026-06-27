/**
 * Tests for GET / PATCH / DELETE /api/users/[id]
 * Auth: Supabase mock | DB: Prisma mock
 */
import { GET, PATCH, DELETE } from "@/app/api/users/[id]/route";
import { createClient } from "@/lib/supabase/server";
import { prismaMock } from "../../helpers/prismaMock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/prisma", () => require("../../tests/helpers/prismaMock"));

const mockedCreateClient = jest.mocked(createClient);

// ── Fixtures ──────────────────────────────────────────────────────────────────
const base = {
  employeeId: null, department: null, phone: null,
  avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
};

const adminProfile = {
  ...base, id: "admin-uuid", email: "admin@erp.com",
  fullName: "Admin", role: "admin" as const, isActive: true,
};

const employeeProfile = {
  ...base, id: "emp-uuid", email: "emp@erp.com",
  fullName: "Employee", role: "employee" as const, isActive: true,
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/users/emp-uuid", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function mockAuth(profile: typeof adminProfile | typeof employeeProfile) {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: profile.id } },
        error: null,
      }),
    },
  } as any);
  prismaMock.profile.findUnique.mockResolvedValue(profile);
}

// ── GET ───────────────────────────────────────────────────────────────────────
describe("GET /api/users/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 — not authenticated", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);
    prismaMock.profile.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("GET") as any, makeParams("emp-uuid"));
    expect(res.status).toBe(401);
  });

  it("403 — employee cannot view another user", async () => {
    mockAuth(employeeProfile);
    const res = await GET(makeRequest("GET") as any, makeParams("other-uuid"));
    expect(res.status).toBe(403);
  });

  it("200 — employee can view own profile", async () => {
    mockAuth(employeeProfile);
    // Second findUnique call returns the target
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(employeeProfile) // getAuthenticatedProfile
      .mockResolvedValueOnce(employeeProfile); // target fetch

    const res = await GET(makeRequest("GET") as any, makeParams("emp-uuid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("emp-uuid");
    expect(body.data.full_name).toBe("Employee");
  });

  it("200 — admin can view any profile", async () => {
    mockAuth(adminProfile);
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)
      .mockResolvedValueOnce(employeeProfile);

    const res = await GET(makeRequest("GET") as any, makeParams("emp-uuid"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe("emp-uuid");
  });

  it("404 — user not found", async () => {
    mockAuth(adminProfile);
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)
      .mockResolvedValueOnce(null);

    const res = await GET(makeRequest("GET") as any, makeParams("ghost-uuid"));
    expect(res.status).toBe(404);
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
describe("PATCH /api/users/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("403 — employee cannot change role", async () => {
    mockAuth(employeeProfile);
    const res = await PATCH(
      makeRequest("PATCH", { role: "admin" }) as any,
      makeParams("emp-uuid")
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/admins can change roles/i);
  });

  it("400 — no valid fields", async () => {
    mockAuth(adminProfile);
    const res = await PATCH(
      makeRequest("PATCH", { foo: "bar" }) as any,
      makeParams("emp-uuid")
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no valid fields/i);
  });

  it("400 — invalid role value", async () => {
    mockAuth(adminProfile);
    const res = await PATCH(
      makeRequest("PATCH", { role: "superuser" }) as any,
      makeParams("emp-uuid")
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/role must be one of/i);
  });

  it("200 — admin promotes employee to manager", async () => {
    mockAuth(adminProfile);

    const promoted = { ...employeeProfile, role: "manager" as const };

    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)   // getAuthenticatedProfile
      .mockResolvedValueOnce(employeeProfile); // before-update snapshot

    prismaMock.profile.update.mockResolvedValue(promoted);
    prismaMock.userAuditLog.create.mockResolvedValue({} as any);

    const res = await PATCH(
      makeRequest("PATCH", { role: "manager" }) as any,
      makeParams("emp-uuid")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("manager");
  });

  it("200 — user updates their own full_name", async () => {
    mockAuth(employeeProfile);

    const updated = { ...employeeProfile, fullName: "New Name" };

    prismaMock.profile.findUnique
      .mockResolvedValueOnce(employeeProfile) // getAuthenticatedProfile
      .mockResolvedValueOnce(employeeProfile); // before-update snapshot

    prismaMock.profile.update.mockResolvedValue(updated);
    prismaMock.userAuditLog.create.mockResolvedValue({} as any);

    const res = await PATCH(
      makeRequest("PATCH", { full_name: "New Name" }) as any,
      makeParams("emp-uuid")
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.full_name).toBe("New Name");
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────
describe("DELETE /api/users/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400 — admin cannot deactivate themselves", async () => {
    mockAuth(adminProfile);
    const res = await DELETE(makeRequest("DELETE") as any, makeParams("admin-uuid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cannot deactivate/i);
  });

  it("409 — user already deactivated", async () => {
    mockAuth(adminProfile);
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)
      .mockResolvedValueOnce({ ...employeeProfile, isActive: false });

    const res = await DELETE(makeRequest("DELETE") as any, makeParams("emp-uuid"));
    expect(res.status).toBe(409);
  });

  it("404 — user not found", async () => {
    mockAuth(adminProfile);
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)
      .mockResolvedValueOnce(null);

    const res = await DELETE(makeRequest("DELETE") as any, makeParams("ghost-uuid"));
    expect(res.status).toBe(404);
  });

  it("200 — successfully deactivates user", async () => {
    mockAuth(adminProfile);
    prismaMock.profile.findUnique
      .mockResolvedValueOnce(adminProfile)
      .mockResolvedValueOnce({ id: "emp-uuid", isActive: true } as any);

    prismaMock.profile.update.mockResolvedValue({
      ...employeeProfile, isActive: false,
    });
    prismaMock.userAuditLog.create.mockResolvedValue({} as any);

    const res = await DELETE(makeRequest("DELETE") as any, makeParams("emp-uuid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toMatch(/deactivated/i);
  });
});
