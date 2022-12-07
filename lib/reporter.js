const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const path = require('path');
const { coverageFiles } = require('./coverage');

const configWatermarks = {
  statements: [50, 80],
  functions: [50, 80],
  branches: [50, 80],
  lines: [50, 80],
};

const createContext = async (inputDirectory, outputDirectory) => {
  const map = await coverageFiles(inputDirectory);
  return libReport.createContext({
    coverageMap: map,
    dir: outputDirectory,
    watermarks: configWatermarks,
    defaultSummarizer: 'nested',
  });
};

const exportToFile = async (config) => {
  const cwd = process.cwd();
  const inputDirectory = path.resolve(cwd, config.inputDirectory);
  const outputDirectory = path.resolve(cwd, config.outputDirectory || './coverage');
  const context = await createContext(inputDirectory, outputDirectory);
  let reporter = config.reporter || ['html'];
  if (!Array.isArray(reporter)) {
    reporter = [reporter]
  }
  console.log(reporter);
  reporter.forEach((_reporter) => {
    reports
      .create(_reporter, {
        skipEmpty: config.skipEmpty,
        skipFull: config.skipFull,
        projectRoot: cwd,
        maxCols: process.stdout.columns || 100,
      })
      .execute(context);
  });
};

module.exports = {
  exportToFile,
};
