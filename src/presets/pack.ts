import type { PackUserConfig } from "vite-plus/pack";

export const defaultPackConfig = {
  dts: {
    generator: "tsgo",
  },
  exports: true,
  nodeProtocol: true,
  minify: true,
} satisfies PackUserConfig;
