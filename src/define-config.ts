import type { ConfigEnv, UserConfig, ViteUserConfigExport } from "vite-plus";

import { defineConfig as defineVitePlusConfig } from "vite-plus";

import { mergeConfig } from "./merge.ts";
import {
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
} from "./presets/index.ts";
import { applyVizeConfig, detectVueOrVize } from "./vize.ts";

export const defaultConfig: UserConfig = {
  css: defaultCssConfig,
  fmt: defaultFmtConfig,
  lint: defaultLintConfig,
  pack: defaultPackConfig,
};

function resolveConfig(config?: ViteUserConfigExport): ViteUserConfigExport {
  const isVueOrVize = detectVueOrVize();

  if (!config) {
    if (isVueOrVize) {
      return applyVizeConfig(defaultConfig);
    }
    return defaultConfig;
  }
  if (typeof config === "function") {
    return (env: ConfigEnv) => {
      const result = config(env);
      if (result instanceof Promise) {
        return result.then(res => {
          const merged = mergeConfig(defaultConfig, res);
          return isVueOrVize ? applyVizeConfig(merged) : merged;
        });
      }
      const merged = mergeConfig(defaultConfig, result);
      return isVueOrVize ? applyVizeConfig(merged) : merged;
    };
  }
  if (config instanceof Promise) {
    return config.then(res => {
      const merged = mergeConfig(defaultConfig, res);
      return isVueOrVize ? applyVizeConfig(merged) : merged;
    });
  }
  const merged = mergeConfig(defaultConfig, config);
  return isVueOrVize ? applyVizeConfig(merged) : merged;
}

/**
 * Defines a Vite+ configuration with default presets applied. Automatically injects Vize
 * configuration when `vue` or `vize` is present in dependencies.
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
