import type { UserConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";

import { mergeConfig as mergeTsdownConfig } from "vite-plus/pack";

import type { PresetConfig } from "../presets/index.ts";

/**
 * Merges `pack` configs using tsdown's semantics. Unlike regular Vite config fields, an array of
 * `pack` configs represents separate build targets, so the preset options are applied to every
 * target instead of being prepended as an additional target.
 *
 * Presets cannot define `entry` (see {@link PresetConfig}), so entries always come from the user
 * config.
 *
 * @param presetConfig - The base pack config, without `entry`.
 * @param userConfig - The overriding pack config(s).
 *
 * @returns The merged pack config(s).
 */
export function mergePackConfig(
  presetConfig: PresetConfig["pack"],
  userConfig: UserConfig["pack"],
): UserConfig["pack"] {
  if (Array.isArray(userConfig)) {
    return userConfig.map(override => mergePackEntry(presetConfig, override));
  }
  return mergePackEntry(presetConfig, userConfig);
}

function mergePackEntry(
  defaults: PresetConfig["pack"] | undefined,
  overrides: PackUserConfig | undefined,
): PackUserConfig {
  return mergeTsdownConfig(defaults ?? {}, overrides ?? {}) as PackUserConfig;
}
