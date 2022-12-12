const transformVue = require('../transform/transform-vue');
const fs = require('../fs-promise');

async function instrumentVue(inFile, transform) {
  const inCode = await fs.readFile(inFile, 'utf-8');
  try {
    const { script, template, styles, customBlocks, combine } =
      transformVue(inCode);
    let code = transform(script.content, { filename: inFile });
    const str = 'export default @';
    const strIndex = code.indexOf(str);
    if (strIndex !== -1) {
      code = code.replace(str, '@');
      code = code.replace('class ', 'export default class ');
    }

    script.content = code;

    return combine(template, script, styles, customBlocks);
  } catch (e) {
    console.log('file:', inFile);
    console.error(e);
    return inCode;
  }
}

module.exports = (options) => (createInstrumentExt) => {
  createInstrumentExt('.vue', instrumentVue)
}