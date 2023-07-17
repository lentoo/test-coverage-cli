const libCoverage = require('istanbul-lib-coverage-increment');
const fs = require('./fs-promise');
const pMap = require('p-map');
const path = require('node:path');
const os = require('node:os');

async function coverageFiles(baseDirectory, gitDiffParser, linesMap) {
  const map = libCoverage.createCoverageMap({}, gitDiffParser, linesMap);
  const files = await fs.readdir(baseDirectory);
  await pMap(
    files,
    async (f) => {
      if (fs.statSync(path.resolve(baseDirectory, f)).isDirectory()) {
        return;
      }
      const reportJson = JSON.parse(
        await fs.readFile(path.resolve(baseDirectory, f), 'utf-8')
      );
      map.merge(reportJson);
    },
    { concurrency: os.cpus().length || 1 }
  );

  return map;
}

module.exports = {
  coverageFiles,
};
