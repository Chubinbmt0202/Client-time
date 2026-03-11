// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Thêm dòng này để Metro cho phép import file .tflite
config.resolver.assetExts.push("tflite");

module.exports = config;
