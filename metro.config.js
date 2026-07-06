// Core 시스템은 .mjs(ESM)로 작성되어 있으므로 Metro가 해석하도록 확장자 추가.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('mjs');

module.exports = config;
