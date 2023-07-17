const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports-async');
const path = require('path');
const axios = require('axios').default;
const { coverageFiles } = require('./coverage');
const fs = require('./fs-promise');
const {
  setGitlabToken,
  setGitlabProtocal,
  setGitlabHost,
  setGitlabProjectId,
  getFileContent,
} = require('./gitlab-api');
const { getBranchSHA1, compare, parser, covertLines } = require('./git-diff');

let globalConfig = {};

const configWatermarks = {
  statements: [50, 80],
  functions: [50, 80],
  branches: [50, 80],
  lines: [50, 80],
};

const createContext = async (
  inputDirectory,
  outputDirectory,
  gitDiffParser,
  linesMap
) => {
  const map = await coverageFiles(inputDirectory, gitDiffParser, linesMap);
  return libReport.createContext({
    coverageMap: map,
    dir: outputDirectory,
    watermarks: configWatermarks,
    defaultSummarizer: 'nested',
    sourceFinder: async (filepath) => {
      console.log('filepath', filepath);
      if (globalConfig.local) return fs.readFileSync(filepath, 'utf-8');
      let gitFilePath = '';
      const projectName = globalConfig.projectName || 'scp-ui-web';
      if (filepath.includes(projectName)) {
        const p = filepath.split(projectName + '/')[1];
        gitFilePath = p;
      }

      // const content = await getFileContent({
      //   filepath: gitFilePath,
      //   project_id: globalConfig.projectId,
      //   ref: globalConfig.ref,
      // });
      const content = await getFileContent(gitFilePath);
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
  setGitlabToken(config.privateToken);
  setGitlabHost(config.host);
  setGitlabProtocal(config.https ? 'https' : 'http');
  setGitlabProjectId(config.projectId);
  console.log(config);
  let context = undefined;
  if (config.type === 'incremental') {
    const baseBranch = await getBranchSHA1(config.form);
    const headBranch = await getBranchSHA1(config.target);
    const compareResult = await compare(baseBranch, headBranch);
    const gitDiffParser = await parser(compareResult);
    const linesMap = covertLines(gitDiffParser);

    context = await createContext(
      inputDirectory,
      outputDirectory,
      gitDiffParser,
      linesMap
    );
  } else {
    context = await createContext(inputDirectory, outputDirectory);
  }

  let reporter = config.reporter || ['html'];
  if (!Array.isArray(reporter)) {
    reporter = [reporter];
  }
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
