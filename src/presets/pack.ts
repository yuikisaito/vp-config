import type { PackUserConfig } from "vite-plus/pack";

/**
 * Pack configuration allowed in presets. Entries are project-specific, so `entry` is excluded and
 * always comes from the user's config.
 */
export type PackPresetConfig = Omit<PackUserConfig, "entry">;

export const defaultPackConfig = {
  dts: {
    generator: "tsgo",
  },
  exports: true,
  minify: true,
  nodeProtocol: true,
} satisfies PackPresetConfig;
