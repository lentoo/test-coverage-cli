const { debuglog, promisify } = require('util');
const fs = require('../fs-promise');
const path = require('path');
const mkdirp = require('make-dir');

const transformVue = require('../transform/transform-vue');
const { parserPlugins } = require('@istanbuljs/schema').defaults.nyc;
const decorators = require('@babel/plugin-proposal-decorators').default;
const debugLog = debuglog('cli-test');

function InstrumenterIstanbul(options) {
  const { createInstrumenter } = require('istanbul-lib-instrument');
  const convertSourceMap = require('convert-source-map');
  const instrumenter = createInstrumenter({
    autoWrap: true,
    coverageVariable: '__coverage__',
    embedSource: true,
    compact: options.compact,
    preserveComments: options.preserveComments,
    produceSourceMap: options.produceSourceMap,
    ignoreClassMethods: options.ignoreClassMethods,
    esModules: 'module',
    debug: true,
    parserPlugins: [
      [
        // require('@babel/plugin-proposal-decorators'), { legacy: true, decoratorsBeforeExport: true, }
        'decorators',
        {
          legacy: true,
          // version: 'legacy',
          decoratorsBeforeExport: true,
        },
      ],
      'typescript',
      ...parserPlugins,
    ],
    // [
    //   [
    //     'decorators',
    //     {
    //       // legacy: false,
    //       version: 'legacy',
    //       // decoratorsBeforeExport: true,
    //     },
    //   ],
    //   'typescript',
    //   // ...parserPlugins,
    // ],

    // parserPlugins.concat('decorators-legacy', 'typescript'),

    //   .concat('proposal-decorators')
    // ['@babel/plugin-proposal-decorators'],

    // .concat(
    //   'typescript'
    // ),
    // parserPlugins
    //   .concat('proposal-decorators')
    //   .concat('typescript'),
    //options.parserPlugins,
  });

  return {
    instrumentSync(code, filename, { sourceMap, registerMap }) {
      var instrumented = instrumenter.instrumentSync(code, filename, sourceMap);
      if (instrumented !== code) {
        registerMap();
      }

      // the instrumenter can optionally produce source maps,
      // this is useful for features like remapping stack-traces.
      if (options.produceSourceMap) {
        var lastSourceMap = instrumenter.lastSourceMap();
        /* istanbul ignore else */
        if (lastSourceMap) {
          instrumented +=
            '\n' + convertSourceMap.fromObject(lastSourceMap).toComment();
        }
      }

      return instrumented;
    },
    lastFileCoverage() {
      return instrumenter.lastFileCoverage();
    },
  };
}

function transformFactory(cacheDir) {
  const instrumenter = InstrumenterIstanbul({
    esModules: true,
  });
  let instrumented;
  const sourceMap = {};
  sourceMap.registerMap = () => {};
  return (code, metadata, hash) => {
    const filename = metadata.filename;
    // const sourceMap = this._getSourceMap(code, filename, hash)

    try {
      instrumented = instrumenter.instrumentSync(code, filename, sourceMap);
    } catch (e) {
      console.error(
        'failed to instrument ' + filename + ' with error: ' + e.stack
      );
      console.error('Failed to instrument ' + filename);
      // if (this.config.exitOnError) {
      //   process.exit(1);
      // } else {
      //   instrumented = code;
      // }
      instrumented = code;
    }

    if (this.fakeRequire) {
      return 'function x () {}';
    } else {
      return instrumented;
    }
  };
}

module.exports = async function instrumentAllFileSync(input, output) {
  console.log('instrumentAllFileSync');
  let inputDir = '.' + path.sep;

  const transform = transformFactory();

  const visitor = async (relFile) => {
    const inFile = path.resolve(inputDir, relFile);
    const ext = path.extname(relFile);
    const inCode = await fs.readFile(inFile, 'utf-8');
    let outCode = '';
    if (ext === '.vue') {
      const { script, template, styles, customBlocks, combine } =
        transformVue(inCode);

      let code = transform(script.content, { filename: inFile });
      const str = 'export default @';
      const strIndex = code.indexOf(str);
      if (strIndex !== -1) {
        code = code.replace(str, '@');
        code = code.replace('class ', 'export default class ');
      }
      // code.splice(strIndex, str.length);
      script.content = code;
      // console.log(code);
      outCode = combine(template, script, styles, customBlocks);
    } else {
      outCode = transform(inCode, { filename: inFile });
    }
    if (outCode) {
      const { mode } = await fs.stat(inFile);
      const outFile = path.resolve(output, relFile);
      console.log({
        outFile,
      });
      await mkdirp(path.dirname(outFile));
      await fs.writeFile(outFile, outCode);
      await fs.chmod(outFile, mode);
    }
  };

  const stats = await fs.lstat(input);

  if (stats.isDirectory()) {
    // TODO:
    console.log('目录');
  } else {
    console.log('input', input);
    await visitor(input);
  }

  // const output = istanbul.instrumentSync(inCode, inFile);
};
