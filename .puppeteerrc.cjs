const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(require('os').homedir(), '.cache', 'puppeteer'),
  defaultProduct: 'chrome-headless-shell',
};
