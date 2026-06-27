import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/tests/setup.ts"],
  // Registers the beforeEach mockReset for prismaMock in every test suite
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/prismaMock.ts"],
  coverageProvider: "v8",
};

export default createJestConfig(config);
