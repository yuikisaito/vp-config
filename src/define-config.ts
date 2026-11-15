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
  if (detectVueOrVize() && !hasVizePlugin(merged.plugins)) {
    return applyVizeConfig(merged);
  }
  return merged;
}

function resolveConfigItems(
  items: (UserConfig | Promise<UserConfig>)[],
): UserConfig | Promise<UserConfig> {
  if (items.some(item => item instanceof Promise)) {
    return Promise.all(items.map(async item => item)).then(finalizeConfig);
  }

  return finalizeConfig(items as UserConfig[]);
}

function resolveFunctionConfigs(
  items: ConfigItem[],
  env: ConfigEnv,
): UserConfig | Promise<UserConfig> {
  const resolved: (UserConfig | Promise<UserConfig>)[] = [];
  for (const item of items) {
    if (typeof item === "function") {
      resolved.push(item(env));
    } else if (item) {
      resolved.push(item);
    }
  }
  return resolveConfigItems(resolved);
}

function resolveConfigs(configs: ConfigInput[]): ViteUserConfigExport {
  const items = flattenConfigs(configs);

  if (items.length === 0) {
    if (detectVueOrVize()) {
      return applyVizeConfig(presetConfig);
    }
    return presetConfig;
  }

  if (items.some(item => typeof item === "function")) {
    return (env: ConfigEnv) => resolveFunctionConfigs(items, env);
  }

  return resolveConfigItems(items as (UserConfig | Promise<UserConfig>)[]);
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
