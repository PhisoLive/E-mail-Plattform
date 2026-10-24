import { defineConfig } from "vitest/config";

const shared = [
  "packages/*/src/**/*.test.ts",
  "apps/*/src/**/*.test.ts",
  "apps/web/server/**/*.test.ts",
  "apps/web/lib/**/*.test.ts",
];

export default defineConfig({
  test: {
    globalSetup: ["./packages/testing/src/global-setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: shared,
          exclude: ["**/*.int.test.ts", "**/node_modules/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: shared.map((pattern) => pattern.replace("*.test.ts", "*.int.test.ts")),
          exclude: ["**/node_modules/**"],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
