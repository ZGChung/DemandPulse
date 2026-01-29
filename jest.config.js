import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^jose$": "<rootDir>/__mocks__/jose.js",
    "^openid-client$": "<rootDir>/__mocks__/openid-client.js",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/_*.{js,jsx,ts,tsx}",
    "!app/**/*.stories.{js,jsx,ts,tsx}",
    "!app/**/*.test.{js,jsx,ts,tsx}",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transformIgnorePatterns: ["/node_modules/(?!jose|openid-client|next-auth|@auth/prisma-adapter)"],
};

export default createJestConfig(customJestConfig);
