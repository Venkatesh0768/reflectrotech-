/**
 * Prisma seed — RF Electro Tech ERP
 * Run with: pnpm db:seed
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Role permissions ─────────────────────────────────────────
  const permissions: { role: UserRole; permission: string }[] = [
    // Admin — full access
    ...["users","products","inventory","suppliers","purchasing",
        "customers","sales","finance","hr","reports","settings","service"]
      .flatMap(m => ["read","write","delete"].map(a => ({
        role: "admin" as UserRole, permission: `${m}:${a}`
      }))),

    // Manager — no delete on users/hr/settings
    ...["products","inventory","suppliers","purchasing",
        "customers","sales","finance","service"]
      .flatMap(m => ["read","write","delete"].map(a => ({
        role: "manager" as UserRole, permission: `${m}:${a}`
      }))),
    ...["users","hr","reports"].map(m => ({
        role: "manager" as UserRole, permission: `${m}:read`
      })),

    // Employee — limited
    ...["products","inventory","customers","sales","service"]
      .map(m => ({ role: "employee" as UserRole, permission: `${m}:read` })),
    { role: "employee", permission: "sales:write" },
    { role: "employee", permission: "service:write" },
  ];

  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { role_permission: { role: p.role, permission: p.permission } },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${permissions.length} permissions seeded`);

  // ── Default warehouse ─────────────────────────────────────────
  await prisma.warehouse.upsert({
    where: { name: "Main Warehouse" },
    update: {},
    create: { name: "Main Warehouse", location: "Head Office" },
  });
  console.log("✅ Default warehouse seeded");

  // ── Default units ─────────────────────────────────────────────
  const units = [
    { name: "Piece",  symbol: "pcs"  },
    { name: "Box",    symbol: "box"  },
    { name: "Set",    symbol: "set"  },
    { name: "Meter",  symbol: "m"    },
    { name: "Kilogram", symbol: "kg" },
    { name: "Litre",  symbol: "ltr"  },
  ];
  for (const u of units) {
    await prisma.unit.upsert({
      where: { symbol: u.symbol },
      update: {},
      create: u,
    });
  }
  console.log("✅ Default units seeded");

  // ── Default categories ────────────────────────────────────────
  const categories = [
    "Electronic Components",
    "Test & Measurement Equipment",
    "Power Supplies",
    "Cables & Connectors",
    "Tools & Accessories",
    "Spare Parts",
    "Finished Products",
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ Default categories seeded");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
