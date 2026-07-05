const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Persist cache between restarts — avoids full rebuild every time
config.cacheStores = [
  new (require('metro-cache').FileStore)({ root: '/tmp/metro-cache' }),
];

// Only watch the src dirs, not all of node_modules
config.watchFolders = [__dirname];

// Reduce resolver work
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
