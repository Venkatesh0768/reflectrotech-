/**
 * Shared Prisma mock reset helper.
 * Loaded via setupFilesAfterEnv — registers a beforeEach to reset the mock.
 *
 * Each test file creates its own mockDeep instance via the jest.mock factory.
 * This file just ensures resets happen between tests.
 */
import { mockReset } from "jest-mock-extended";
import { prisma } from "@/lib/prisma";

beforeEach(() => {
  mockReset(prisma as any);
});
