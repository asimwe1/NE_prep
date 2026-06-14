const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { withUniwindConfig } = require("uniwind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "lucide-react-native") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "src/lucide-react-native.js"),
    };
  }

  if (moduleName === "lucide-react") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "src/lucide-react.js"),
    };
  }

  if (
    platform === "web" &&
    ["@expo/ui/swift-ui", "@expo/ui/swift-ui/modifiers"].includes(moduleName)
  ) {
    return {
      type: "empty",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
});
