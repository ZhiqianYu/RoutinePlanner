const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    minifierConfig: {
      // 减少变量声明警告
      mangle: {
        keep_fnames: true,
      },
      compress: {
        drop_console: false,
      },
    },
  },
  resolver: {
    // 确保正确解析模块
    alias: {
      '@': './src',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
