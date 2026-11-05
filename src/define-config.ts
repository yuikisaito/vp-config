import type { ConfigEnv, UserConfig, ViteUserConfigExport } from "vite-plus";

import { defineConfig as defineVitePlusConfig } from "vite-plus";

import { mergeConfig } from "./merge.ts";
import {
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
} from "./presets/index.ts";

export const defaultConfig: UserConfig = {
  css: defaultCssConfig,
  fmt: defaultFmtConfig,
  lint: defaultLintConfig,
  pack: defaultPackConfig,
};

export const defaultUserConfig = defaultConfig;

function resolveConfig(config?: ViteUserConfigExport): ViteUserConfigExport {
  if (!config) {
    return defaultConfig;
  }
  if (typeof config === "function") {
    return (env: ConfigEnv) => {
      const result = config(env);
      if (result instanceof Promise) {
        return result.then(res => mergeConfig(defaultConfig, res));
      }
      return mergeConfig(defaultConfig, result);
    };
  }
  if (config instanceof Promise) {
    return config.then(res => mergeConfig(defaultConfig, res));
  }
  return mergeConfig(defaultConfig, config);
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
