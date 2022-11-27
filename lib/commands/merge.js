const libCoverage = require('istanbul-lib-coverage');
const fs = require('fs');
const bluebird = require('bluebird');
const istanbul = require('istanbul');

const utils = istanbul.utils;

const path = require('path');

exports.command = 'merge <input-directory> [output-file]';

exports.describe = 'merge istanbul format coverage output in a given folder';

exports.builder = function (yargs) {
  yargs
    .demandCommand(0, 0)
    .example(
      '$0 merge ./out coverage.json',
      'merge together reports in ./out and output as coverage.json'
    )
    .positional('input-directory', {
      describe: 'directory containing multiple istanbul coverage files',
      type: 'text',
      default: './.nyc_output',
    })
    .positional('output-file', {
      describe: 'file to output combined istanbul format coverage to',
      type: 'text',
      default: 'coverage.json',
    });

  // setupOptions(yargs, 'merge')
  // yargs.default('exclude-after-remap', false)
};

const coverageFiles = function (baseDirectory) {
  return bluebird.promisify(fs.readdir)(baseDirectory);
};
var coverage = {}; //getCoverageObject();
function mergeClientCoverage(obj) {
  if (!obj) {
    return;
  }
  Object.keys(obj).forEach(function (filePath) {
    var original = coverage[filePath],
      added = obj[filePath],
      result;
    if (original) {
      result = utils.mergeFileCoverage(original, added);
    } else {
      result = added;
    }
    coverage[filePath] = result;
  });
}

async function fileLoad(filename, baseDirectory) {
  try {
    console.log('file load: ', baseDirectory, filename);
    const readFilePromise = bluebird.promisify(fs.readFile);
    const content = await readFilePromise(
      path.resolve(baseDirectory, filename),
      'utf-8'
    );
    const obj = JSON.parse(content);
    return obj;
    // const report = JSON.parse(content);
    // await this.sourceMaps.reloadCachedSourceMaps(report);
    return report;
  } catch (error) {
    console.log(error);
    return {};
  }
}

exports.handler = async (argv) => {
  console.log('handle', argv);
  const files = await coverageFiles(argv.inputDirectory);
  // const map = libCoverage.createCoverageMap({}); e
  // libCoverage.c
  // const summary = libCoverage.createCoverageSummary();

  // console.log(files);
  files.map(async (file) => {
    const obj = await fileLoad(
      file,
      path.resolve(process.cwd(), argv.inputDirectory)
    );
    // map.merge(content);
    mergeClientCoverage(obj);
  });

  // inspect and summarize all file coverage objects in the map
  // map.files().forEach(function (f) {
  //   var fc = map.fileCoverageFor(f),
  //     s = fc.toSummary();
  //   summary.merge(s);
  // });

  console.log('Global summary', summary);

  // process.env.NYC_CWD = process.cwd()
  // const nyc = new NYC(argv)
  // const inputStat = await fs.stat(argv.inputDirectory).catch(error => {
  //   throw new Error(`failed access input directory ${argv.inputDirectory} with error:\n\n${error.message}`)
  // })

  // if (!inputStat.isDirectory()) {
  //   throw new Error(`${argv.inputDirectory} was not a directory`)
  // }
  // await makeDir(path.dirname(argv.outputFile))
  // const map = await nyc.getCoverageMapFromAllCoverageFiles(argv.inputDirectory)
  // await fs.writeFile(argv.outputFile, JSON.stringify(map, null, 2), 'utf8')
  // console.info(`coverage files in ${argv.inputDirectory} merged into ${argv.outputFile}`)
};
