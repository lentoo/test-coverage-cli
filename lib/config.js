const path = require('path');
const fs = require('./fs-promise');

const DEFAULT_CONFIG_FILE = 'test-coverage.config.js';

const DEFAULT_CONFIG = {
  extension: ['.js'],
};

let globalConfig = {};
function loadConfigFromFile() {
  const configRoot = process.cwd();

  const filePath = path.resolve(configRoot, DEFAULT_CONFIG_FILE);
  globalConfig = DEFAULT_CONFIG;
  if (!fs.existsSync(filePath)) {
    return DEFAULT_CONFIG;
  }

  const config = require(filePath);
  globalConfig = config;
  return config;
}

loadConfigFromFile();
module.exports = {
  loadConfigFromFile,
  globalConfig,
};
