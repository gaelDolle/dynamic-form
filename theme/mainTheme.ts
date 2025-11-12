import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  preflight: true,
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      backgroundColor: "transparent",
      overflowX: "hidden",
    },
  },
});

const mainTheme = createSystem(defaultConfig, config);

export default mainTheme;
