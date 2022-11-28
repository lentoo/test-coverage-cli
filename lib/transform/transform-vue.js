const compiler = require('vue-template-compiler');

function openTag(sfcBlock) {
  const { type, lang, src, scoped, module, attrs } = sfcBlock;

  let tag = `<${type}`;
  if (lang) tag += ` lang="${lang}"`;
  if (src) tag += ` src="${src}"`;
  if (scoped) tag += ' scoped';
  if (module) {
    if (typeof module === 'string') tag += ` module="${module}"`;
    else tag += ' module';
  }
  for (let k in attrs) {
    if (!['type', 'lang', 'src', 'scoped', 'module'].includes(k)) {
      tag += ` ${k}="${attrs[k]}"`;
    }
  }
  tag += '>';

  return tag;
}

function closeTag(sfcBlock) {
  return `</${sfcBlock.type}>`;
}

function combineVue(template, script, styles, customBlocks) {
  return [template, script, ...styles, ...customBlocks]
    .map((sfc) =>
      sfc ? `${openTag(sfc)}\n${sfc.content.trim()}\n${closeTag(sfc)}\n` : ''
    )
    .join('\n');
}

module.exports = function transformVue(source) {
  const sfc = compiler.parseComponent(source, {
    pad: 'space',
    deindent: false,
  });

  const { template, script, styles, customBlocks } = sfc;

  // transform script
  // if (script) {
  //   const { source: jsSource } = transformJs(script.content, locales);
  //   script.content = jsSource;
  // }
  return {
    template,
    script,
    styles,
    customBlocks,
    combine: (template, script, styles, customBlocks) => {
      return combineVue(template, script, styles, customBlocks);
    },
    // format: () => {
    //   return prettier.format(code, {
    //     // filepath: './.prettierrc.json',
    //     semi: false,
    //     singleQuote: true,
    //     jsxBracketSameLine: true,
    //     htmlWhitespaceSensitivity: 'ignore',
    //     embeddedLanguageFormatting: 'auto',
    //     // embeddedInHtml: 'off',
    //     trailingComma: 'none',
    //     branchSpacing: true,
    //     parser: 'vue',
    //     // insertPragma: true,
    //     vueIndentScriptAndStyle: true,
    //   });
    // },
  };
};
