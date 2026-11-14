import type { UserConfig } from "vite-plus";

import { mergeConfig } from "vite-plus";

import type { PresetConfig } from "../presets/index.ts";

import { mergePackConfig } from "./pack.ts";

/**
 * Merges preset configuration into a user configuration. Shared fields use Vite's `mergeConfig`,
 * while `pack` uses tsdown's merge semantics because each `pack` array entry is a build target.
 *
 * @param presetConfig - The base/default configuration.
 * @param userConfig - The overriding configuration object(s).
 *
 * @returns The merged configuration object.
 */
export function mergePresetConfig(presetConfig: PresetConfig, userConfig: UserConfig): UserConfig {
  const config = mergeConfig(presetConfig, userConfig);

  if (presetConfig.pack) {
    config.pack = mergePackConfig(presetConfig.pack, userConfig.pack);
  }

  return config;
}
