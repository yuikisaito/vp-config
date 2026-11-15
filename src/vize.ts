import type { UserConfig } from "vite-plus";

import { isPackageListedSync, loadPackageJSONSync } from "local-pkg";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface PackageJsonLike {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Loads and parses the nearest `package.json` starting from `cwd`.
 *
 * @param cwd - The directory to start searching from (defaults to `process.cwd()`).
 *
 * @returns The parsed package.json object, or `null` if not found or invalid.
 */
export function loadPackageJson(cwd: string = process.cwd()): PackageJsonLike | null {
  try {
    return loadPackageJSONSync(cwd) as PackageJsonLike | null;
  } catch {
    return null;
  }
}

/**
 * Detects whether the current project has `vue` or `vize` as a dependency.
 *
 * @param cwd - The directory to inspect (defaults to `process.cwd()`).
 *
 * @returns `true` if `vue` or `vize` is detected in the nearest `package.json`.
 */
export function detectVueOrVize(cwd: string = process.cwd()): boolean {
  return (
    isPackageListedSync("vue", cwd) ||
    isPackageListedSync("vize", cwd) ||
    isPackageListedSync("@vizejs/vite-plugin", cwd)
  );
}

/**
 * Detects whether the given plugins array or object contains a Vize plugin.
 *
 * @param plugins - The plugins option from a Vite configuration.
 *
 * @returns `true` if a Vize plugin is found.
 */
export function hasVizePlugin(plugins: unknown): boolean {
  if (Array.isArray(plugins)) {
    return plugins.some(hasVizePlugin);
  }
  if (plugins && typeof plugins === "object" && "name" in plugins) {
    const { name } = plugins as { name?: unknown };
    return typeof name === "string" && name.includes("vize");
  }
  return false;
}

/**
 * Injects Vize configuration by delegating to `@vizejs/vite-plugin/vite-plus`'s `vitePlusConfig`.
 *
 * @param config - The base Vite+ configuration to enrich.
 *
 * @returns A promise resolving to the enriched configuration.
 */
export async function applyVizeConfig(config: UserConfig): Promise<UserConfig> {
  const { vitePlusConfig } = await import("@vizejs/vite-plugin/vite-plus");
  return (await vitePlusConfig(config)) as UserConfig;
}
