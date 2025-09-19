/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: `node`,
  roots: [`<rootDir>/src`],

  // Limit file system scan strictly to the single spec to reduce startup latency
  testMatch: [`**/*.spec.ts`],

  moduleDirectories: [`node_modules`, `src`],
  moduleNameMapper: {
    [`^@/(.*)\\.js$`]: `<rootDir>/src/$1.ts`,
    [`^@/(.*)$`]: `<rootDir>/src/$1`,
  },

  // ESM-friendly settings for ts-jest in an ESM project
  extensionsToTreatAsEsm: [`.ts`],
  transform: {
    [`^.+\\.tsx?$`]: [
      `ts-jest`,
      {
        useESM: true,
        diagnostics: false, // skip type-checking during tests for faster startup
      },
    ],
  },

  // Speed and stability
  cacheDirectory: `<rootDir>/.jest-cache`,
  testPathIgnorePatterns: [`/node_modules/`, `/dist/`],
};
