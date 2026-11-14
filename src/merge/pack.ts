import type { UserConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";

import { mergeConfig as mergeTsdownConfig } from "vite-plus/pack";

import type { PresetConfig } from "../presets/index.ts";

/**
 * Merges `pack` configs. Unlike regular Vite config fields, an array of `pack` configs represents
 * separate build targets, so the defaults are applied to every target instead of being prepended as
 * an additional target.
 *
 * @param presetConfig - The base pack config(s).
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
  defaults: PackUserConfig | undefined,
  overrides: PackUserConfig | undefined,
): PackUserConfig {
  return mergeTsdownConfig(defaults ?? {}, overrides ?? {}) as PackUserConfig;
}
