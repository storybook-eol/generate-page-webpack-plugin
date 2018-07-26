const fs = require('fs');

const getDLLs = entrypoint => {
  const hash = entrypoint.chunks
    .reduce((acc, i) => acc.concat(i.getModules()), [])
    .reduce((acc, i) => acc.concat([...i.dependencies]), [])
    .map(i => i.module)
    .filter(i => !!i && i.constructor.name === 'DelegatedModule')
    .reduce((acc, i) => Object.assign(acc, { [i.hash]: i }), {});

  return Object.values(hash)
    .reduce((acc, i) => acc.concat(i.dependencies), [])
    .filter(i => i.module)
    .map(i => `dll/${i.module.request}.js`);
};

class GeneratePagePlugin {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;

    const engine = config.parser;
    const template = fs.readFileSync(config.template, 'utf-8');

    this.renderer = engine.compile(template);
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('GeneratePagePlugin', compilation => {
      compilation.hooks.additionalChunkAssets.tap('GeneratePagePlugin', () => {
        const { entrypoints } = compilation;

        Array.from(entrypoints).forEach(([, value]) => {
          const dlls = getDLLs(value);
          const options = Object.entries(this.options).reduce(
            (acc, [k, v]) => ({
              ...acc,
              [k]: typeof v === 'function' ? v(value.name) : v,
            }),
            {}
          );

          const filename =
            typeof this.config.filename === 'function'
              ? this.config.filename(value.name)
              : this.config.filename || value.name;

          const data = Object.assign({}, value, {
            options: { ...options, ...value.options },
            compilation,
            dlls,
          });
          const html = this.renderer(data);

          // eslint-disable-next-line no-param-reassign
          compilation.assets[`${filename}.html`] = {
            source: () => html,
            size: () => html.toString().length,
          };
        });
      });
    });
  }
}

module.exports = GeneratePagePlugin;
