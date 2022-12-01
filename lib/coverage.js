const libCoverage = require('istanbul-lib-coverage');
const fs = require('./fs-promise');
const pMap = require('p-map');
const path = require('node:path');
const os = require('node:os');

async function coverageFiles(baseDirectory) {
  const map = libCoverage.createCoverageMap({});
  const files = await fs.readdir(baseDirectory);
  await pMap(
    files,
    async (f) => {
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
