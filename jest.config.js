// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  globalSetup: './test/global-setup.js',
  globalTeardown: './test/global-teardown.js',
  preset: "jest-puppeteer",
  testEnvironment: "./test/puppeteer_environment.js",
};
