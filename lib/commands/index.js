#!/usr/bin/env node

const Yargs = require('yargs/yargs');
const merge = require('./merge');
const instrument = require('./instrument');
var libCoverage = require('istanbul-lib-coverage');

const { hideBin } = require('yargs/helpers');

async function guessCWD(cwd) {
  cwd = cwd || process.env.NYC_CWD || process.cwd();
  const pkgPath = await findUp('package.json', { cwd });
  if (pkgPath) {
    cwd = path.dirname(pkgPath);
  }

  return cwd;
}
const yargs = Yargs(hideBin(process.argv));
yargs.command(instrument).command(merge);
