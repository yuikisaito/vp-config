import type { PackUserConfig } from "vite-plus/pack";

export const defaultPackConfig = {
  dts: {
    generator: "tsgo",
  },
  exports: true,
  minify: true,
  nodeProtocol: true,
} satisfies PackUserConfig;
