import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment for DOM manipulation
  testEnvironment: 'jest-environment-jsdom',
  
  // Indicates which file extensions your modules use
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  
  // Maps file extensions to transformers
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      useESM: true,
    }],
  },
  
  // Set the test match pattern
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  
  // Collect coverage from source files
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**/*",
  ],
  
  // Mock directories and files
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  
  // Set extensions for ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Jest globals options
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config); 