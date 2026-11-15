import type { ConfigEnv, UserConfig, ViteUserConfigExport } from "vite-plus";

import { defineConfig as defineVitePlusConfig, mergeConfig } from "vite-plus";

import { mergePresetConfig } from "./merge/index.ts";
import { presetConfig } from "./presets/index.ts";
import { applyVizeConfig, detectVueOrVize, hasVizePlugin } from "./vize.ts";

export type ConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;
export type StaticConfigItem = UserConfig | null | undefined;
export type StaticConfigInput = StaticConfigItem | StaticConfigInput[];
export type ConfigItem = UserConfig | Promise<UserConfig> | ConfigFn | null | undefined;
export type ConfigInput = ConfigItem | ConfigInput[];

function flattenConfigs(configs: ConfigInput[]): ConfigItem[] {
  const result: ConfigItem[] = [];
  for (const config of configs) {
    if (Array.isArray(config)) {
      result.push(...flattenConfigs(config));
    } else if (config !== null && config !== undefined) {
      result.push(config);
    }
  }
  return result;
}

function mergeUserConfigs(userConfigs: UserConfig[]): UserConfig {
  return userConfigs.reduce<UserConfig>((merged, config) => mergeConfig(merged, config), {});
}

function finalizeConfig(userConfigs: UserConfig[]): UserConfig | Promise<UserConfig> {
  const merged = mergePresetConfig(presetConfig, mergeUserConfigs(userConfigs));
  const shouldInject = detectVueOrVize() && !hasVizePlugin(merged.plugins);
  if (shouldInject) {
    return applyVizeConfig(merged);
  }
  return merged;
}

function resolveConfigs(configs: ConfigInput[]): ViteUserConfigExport {
  const flat = flattenConfigs(configs);

  if (flat.length === 0) {
    if (detectVueOrVize()) {
      return applyVizeConfig(presetConfig);
    }
    return presetConfig;
  }

  const hasFunction = flat.some(item => typeof item === "function");
  if (hasFunction) {
    return (env: ConfigEnv) => {
      const resolvedList: (UserConfig | Promise<UserConfig>)[] = [];
      for (const item of flat) {
        if (typeof item === "function") {
          resolvedList.push((item as ConfigFn)(env));
        } else if (item) {
          resolvedList.push(item);
        }
      }

      const hasAsync = resolvedList.some(item => item instanceof Promise);
      if (hasAsync) {
        return (async () => {
          const syncConfigs = await Promise.all(
            resolvedList.map(item => (item instanceof Promise ? item : Promise.resolve(item))),
          );
          return finalizeConfig(syncConfigs);
        })();
      }

      return finalizeConfig(resolvedList as UserConfig[]);
    };
  }

  const hasPromise = flat.some(item => item instanceof Promise);
  if (hasPromise) {
    return (async () => {
      const resolvedList = await Promise.all(
        flat.map(item => (item instanceof Promise ? item : Promise.resolve(item as UserConfig))),
      );
      return finalizeConfig(resolvedList);
    })();
  }

  return finalizeConfig(flat as UserConfig[]);
}

/**
 * Defines a Vite+ configuration with default presets applied. Supports flat configuration with
 * variadic arguments. Automatically injects Vize configuration when `vue` or `vize` is present in
 * dependencies.
 *
 * @param configs - User configuration objects, promises, or callback functions.
 *
 * @returns The resolved Vite+ configuration.
 */
export function defineConfig(): UserConfig;
export function defineConfig(...configs: StaticConfigInput[]): UserConfig;
export function defineConfig<T extends ViteUserConfigExport>(
  config: T,
): ReturnType<typeof defineVitePlusConfig<T>>;
export function defineConfig(
  ...configs: ConfigInput[]
): ReturnType<typeof defineVitePlusConfig<ViteUserConfigExport>>;
export function defineConfig(
  ...configs: ConfigInput[]
): ReturnType<typeof defineVitePlusConfig<ViteUserConfigExport>> {
  return defineVitePlusConfig(resolveConfigs(configs));
}

export default defineConfig;
