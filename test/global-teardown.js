const { teardown: teardownDevServer } = require('jest-dev-server')
const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer')

const os = require('os');
const rimraf = require('rimraf');
const path = require('path');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

module.exports = async function globalTeardown() {
    await teardownDevServer()
    await teardownPuppeteer()
    // Your global teardown
    // close the browser instance
    await global.__BROWSER_GLOBAL__.close();

    // clean-up the wsEndpoint file
    rimraf.sync(DIR);
}