const { debuglog, promisify } = require('util');
const fs = require('../fs-promise');
const path = require('path');
const mkdirp = require('make-dir');
const pMap = require('p-map');
const os = require('os');

const glob = promisify(require('glob'));

const { getSourceMap, createSourceMap } = require('../source-map');
const { globalConfig } = require('../config');
const instrumentPluginVue = require('./instrument-plugin-vue');
const { parserPlugins } = require('@istanbuljs/schema').defaults.nyc;
const debugLog = debuglog('cli-test');

let sourceMapCache = null;

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
    coverageGlobalScope: globalConfig.coverageGlobalScope || 'return this',
    coverageGlobalScopeFunc: globalConfig.coverageGlobalScopeFunc || true,
    parserPlugins: [
      [
        'decorators',
        {
          legacy: true,
          decoratorsBeforeExport: true,
        },
      ],
      'typescript',
      ...parserPlugins,
    ],
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
    produceSourceMap: true,
  });

  let instrumented;
  // const sourceMap = {};
  // sourceMap.registerMap = () => {};
  return (code, metadata, hash) => {
    const filename = metadata.filename;
    // const sourceMap = this._getSourceMap(code, filename, hash)
    const sourceMap = getSourceMap(sourceMapCache, code, filename);
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

async function instrumentJS(inFile, transform) {
  const inCode = await fs.readFile(inFile, 'utf-8');
  let code = transform(inCode, { filename: inFile });
  const str = 'export default @';
  const strIndex = code.indexOf(str);
  if (strIndex !== -1) {
    code = code.replace(str, '@');
    code = code.replace('class ', 'export default class ');
  }

  return code;
}

const extFun = {
  '.js': instrumentJS,
  '.ts': instrumentJS,
};

function createInstrumentExt(ext, instrumentFun) {
  extFun[ext] = instrumentFun;
}

function createTransform(ext) {
  const transform = transformFactory();
  return async (inFile) => {
    return await extFun[ext](inFile, transform);
  };
}

function createTransforms(extensions) {
  const transforms = extensions.reduce((transforms, ext) => {
    transforms[ext] = createTransform(ext);
    return transforms;
  }, {});
  return (ext) => transforms[ext] || (() => null);
}

const _plugins = [instrumentPluginVue()];

module.exports = async function instrumentAllFileSync({
  input,
  output,
  extension,
  all,
  exclude = [],
  plugins = [],
}) {
  console.log('instrumentAllFileSync');
  let inputDir = '.' + path.sep;

  // const transform = transformFactory();
  sourceMapCache = createSourceMap();
  [..._plugins, ...plugins].forEach((p) => p(createInstrumentExt));
  const transforms = createTransforms(extension, sourceMapCache);

  const visitor = async (relFile) => {
    const inFile = path.resolve(inputDir, relFile);
    const ext = path.extname(relFile);
    let outCode = '';
    const transform = transforms(ext);

    outCode = await transform(inFile);
    if (outCode) {
      const { mode } = await fs.stat(inFile);
      const isAbs = path.isAbsolute(relFile);
      let outFile = '';
      if (isAbs) {
        outFile = path.dirname(
          path.join(output, path.relative(input, relFile))
        );
        const base = path.basename(relFile);
        outFile = path.resolve(outFile, base);
      } else {
        outFile = path.resolve(output, relFile);
      }
      await mkdirp(path.dirname(outFile));
      await fs.writeFile(outFile, outCode);
      await fs.chmod(outFile, mode);
      console.log(outFile);
    }
  };
  const stats = await fs.lstat(input);
  const concurrency = output ? os.cpus().length : 1;

  if (stats.isDirectory()) {
    inputDir = input;

    const files = await glob(path.resolve(input, '**'), {
      dot: true,
      nodir: true,

      ignore: ['**/.git', '**/.git/**', path.join(output, '**')],
    });

    if (all && output) {
      const destDirs = new Set(
        files.map((src) =>
          path.dirname(path.join(output, path.relative(input, src)))
        )
      );

      /**
       * 创建输出目录
       */
      await pMap(destDirs, (dir) => mkdirp(dir), { concurrency });

      /**
       * 复制源文件到目标目录
       */
      await pMap(
        files,
        (src) => fs.copyFile(src, path.join(output, path.relative(input, src))),
        { concurrency }
      );
    }
    const filesToInstrument = await glob(path.resolve(input, '**'), {
      dot: true,
      nodir: true,
      ignore: ['**/.git', '**/.git/**', path.join(output, '**')].concat(
        exclude
      ),
    });
    await pMap(filesToInstrument, (src) => visitor(src), {
      concurrency,
    });
  } else {
    await visitor(input);
  }

  // const output = istanbul.instrumentSync(inCode, inFile);
};
