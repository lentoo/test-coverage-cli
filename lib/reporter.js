const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports-async');
const path = require('path');
const axios = require('axios').default;
const { coverageFiles } = require('./coverage');

let globalConfig = {};

const request = axios.create({
  timeout: 60000,
});
const getFileContent = (params = {}) => {
  return new Promise((resolve, reject) => {
    const url = `${globalConfig.gitlab.https ? 'https' : 'http'}://${
      globalConfig.gitlab.host
    }/api/v4/projects/${
      params.project_id
    }/repository/files/${encodeURIComponent(params.filepath)}?ref=${
      params.ref
    }`;
    console.log(`url => ${url}`);
    request
      .get(url, {
        headers: {
          'PRIVATE-TOKEN': globalConfig.privateToken,
        },
      })
      .then((res) => {
        const content = Buffer.from(res.data.content, 'base64').toString(
          'utf8'
        );
        resolve(content);
      })
      .catch(reject);
  });
};

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
    sourceFinder: async (filepath) => {
      let gitFilePath = '';
      const projectName = globalConfig.projectName || 'scp-ui-web';
      if (filepath.includes(projectName)) {
        const p = filepath.split(projectName + '/')[1];
        gitFilePath = p;
      }

      const content = await getFileContent({
        filepath: gitFilePath,
        project_id: globalConfig.projectId,
        ref: globalConfig.ref,
      });
      return content;
      // source-code 'http://192.168.13.78/api/v4/projects/575/repository/files/package.json?ref=test'
    },
  });
};

const exportToFile = async (config) => {
  const cwd = process.cwd();
  const inputDirectory = path.resolve(cwd, config.inputDirectory);
  const outputDirectory = path.resolve(
    cwd,
    config.outputDirectory || './coverage'
  );
  globalConfig = config;
  const context = await createContext(inputDirectory, outputDirectory);
  let reporter = config.reporter || ['html'];
  if (!Array.isArray(reporter)) {
    reporter = [reporter];
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
