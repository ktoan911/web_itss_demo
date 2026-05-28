export default {
  testEnvironment: 'node',
  setupFilesAfterEach: [],
  globalSetup: undefined,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEach: ['<rootDir>/tests/setup.js'],
  transform: {},
  testTimeout: 30_000,
  verbose: true,
};
