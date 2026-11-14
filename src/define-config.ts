import type { ConfigEnv, UserConfig, ViteUserConfigExport } from "vite-plus";

import { defineConfig as defineVitePlusConfig } from "vite-plus";

import { mergePresetConfig } from "./merge/index.ts";
import { presetConfig } from "./presets/index.ts";

function resolveConfig(config?: ViteUserConfigExport): ViteUserConfigExport {
  if (!config) {
    return presetConfig;
  }
  if (typeof config === "function") {
    return (env: ConfigEnv) => {
      const result = config(env);
      if (result instanceof Promise) {
        return result.then(res => mergePresetConfig(presetConfig, res));
      }
      return mergePresetConfig(presetConfig, result);
    };
  }
  if (config instanceof Promise) {
    return config.then(res => mergePresetConfig(presetConfig, res));
  }
  return mergePresetConfig(presetConfig, config);
}

/**
 * Defines a Vite+ configuration with default presets applied.
 *
 * @param config - The user's configuration export (object, Promise, or callback function).
 *
 * @returns The resolved Vite+ configuration.
 */
export function defineConfig(): UserConfig;
export function defineConfig<T extends ViteUserConfigExport>(
  config: T,
): ReturnType<typeof defineVitePlusConfig<T>>;
export function defineConfig<T extends ViteUserConfigExport>(
  config?: T,
): ReturnType<typeof defineVitePlusConfig<T>> {
  return defineVitePlusConfig(resolveConfig(config) as T);
}

export default defineConfig;
