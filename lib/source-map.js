const libSourceMaps = require('istanbul-lib-source-maps');
const convertSourceMap = require('convert-source-map');
const path = require('path');

function createSourceMap() {
  return libSourceMaps.createSourceMapStore();
}

function registerMap(store, filename, sourceMap) {
  if (!sourceMap) return;

  store.registerMap(filename, sourceMap);
}

function extract(code) {
  const sourceMap =
    convertSourceMap.fromSource(code) ||
    convertSourceMap.fromMapFileSource(code, path);
  return sourceMap ? sourceMap.toObject() : undefined;
}


function getSourceMap(store, code, filename) {
  const sourceMap = {}
  sourceMap.sourceMap = extract(code, filename)
  sourceMap.registerMap = () => registerMap(store, filename, sourceMap.sourceMap)
  return sourceMap
}

module.exports = {
  getSourceMap,
  createSourceMap,
  createSourceMap
}