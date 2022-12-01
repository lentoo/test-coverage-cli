const fs = require('../fs-promise');
const istanbul = require('istanbul');
const makeDir = require('make-dir');
const { coverageFiles } = require('../coverage');
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
      default: './.coverage_output',
    })
    .positional('output-file', {
      describe: 'file to output combined istanbul format coverage to',
      type: 'text',
      default: 'coverage.json',
    });

  // setupOptions(yargs, 'merge')
  // yargs.default('exclude-after-remap', false)
};

exports.handler = async (argv) => {
  const inputStat = await fs.stat(argv.inputDirectory);

  if (!inputStat.isDirectory()) {
    throw new Error(`${argv.inputDirectory} was not a directory`);
  }
  console.log('merge:', argv);
  await makeDir(path.dirname(argv.outputFile));
  const map = await coverageFiles(argv.inputDirectory);
  await fs.writeFile(argv.outputFile, JSON.stringify(map, null, 2), 'utf8');
  console.info(
    `coverage files in ${argv.inputDirectory} merged into ${argv.outputFile}`
  );
};
