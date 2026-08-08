const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultSerializer = config.serializer?.customSerializer;

config.serializer = {
  ...config.serializer,
  customSerializer: async (entryPoint, preModules, graph, options) => {
    let code;
    if (defaultSerializer) {
      code = await defaultSerializer(entryPoint, preModules, graph, options);
    } else {
      const { baseJSBundle } = require('metro/src/DeltaBundler/Serializers/baseJSBundle');
      const { bundleToString } = require('metro/src/lib/bundleToString');
      const bundle = baseJSBundle(entryPoint, preModules, graph, options);
      code = bundleToString(bundle).code;
    }

    if (options.platform === 'web') {
      if (typeof code === 'string') {
        return code.replace(
          /import\.meta/g,
          '({ url: typeof location !== "undefined" ? location.href : "", env: typeof process !== "undefined" ? process.env : {} })'
        );
      } else if (code && typeof code.code === 'string') {
        code.code = code.code.replace(
          /import\.meta/g,
          '({ url: typeof location !== "undefined" ? location.href : "", env: typeof process !== "undefined" ? process.env : {} })'
        );
      }
    }

    return code;
  },
};

module.exports = config;
