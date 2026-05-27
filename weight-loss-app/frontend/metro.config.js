const { getDefaultConfig } = require("@react-native/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ["web", "ios", "android"];
config.resolver.sourceExts = ["web.js", "web.ts", "web.tsx", "web.jsx", "web.json", ...config.resolver.sourceExts];

module.exports = config;
