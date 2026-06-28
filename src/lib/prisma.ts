/**
 * Prisma Client singleton.
 *
 * In development, Next.js hot-reload would create a new PrismaClient on every
 * module reload, exhausting the connection pool. We store the instance on the
 * global object to reuse it across reloads.
 *
 * In production a single instance is created and exported directly.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
