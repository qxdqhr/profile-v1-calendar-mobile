const path = require('path');

const mobileModules = path.resolve(__dirname, 'node_modules');
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${mobileModules}${path.delimiter}${process.env.NODE_PATH}`
  : mobileModules;
require('module').Module._initPaths();

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

const sa2kitUiRoot = path.resolve(monorepoRoot, '../sa2kit-ui');
const sa2kitRoot = path.resolve(monorepoRoot, '../sa2kit');
config.watchFolders = [monorepoRoot, sa2kitUiRoot, sa2kitRoot];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'import', 'react-native'];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
