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
    "^ml-kmeans$": "<rootDir>/__mocks__/ml-kmeans.js",
    "^compute-cosine-similarity$": "<rootDir>/__mocks__/compute-cosine-similarity.js",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "services/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/_*.{js,jsx,ts,tsx}",
    "!app/**/*.stories.{js,jsx,ts,tsx}",
    "!app/**/*.test.{js,jsx,ts,tsx}",
    "!lib/**/*.d.ts",
    "!lib/**/*.test.{js,jsx,ts,tsx}",
    "!services/**/*.d.ts",
    "!services/**/*.test.{js,jsx,ts,tsx}",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transformIgnorePatterns: [
    "/node_modules/(?!jose|openid-client|next-auth|@auth/prisma-adapter|ml-kmeans|compute-cosine-similarity)",
  ],
};

export default createJestConfig(customJestConfig);
