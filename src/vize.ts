import type { UserConfig } from "vite-plus";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface PackageJsonLike {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Checks if the given package.json dependencies include `vue` or `vize`.
 *
 * @param pkg - The parsed package.json object.
 *
 * @returns `true` if `vue` or `vize` is in any dependency field.
 */
export function hasVueOrVizeDependency(pkg?: PackageJsonLike | null): boolean {
  if (!pkg) {
    return false;
  }
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
  };
  return "vue" in deps || "vize" in deps;
}

/**
 * Finds the nearest `package.json` traversing upwards from `startDir`.
 *
 * @param startDir - The directory to start searching from (defaults to `process.cwd()`).
 *
 * @returns The absolute path to `package.json`, or `null` if not found.
 */
export function findPackageJson(startDir: string = process.cwd()): string | null {
  let dir = resolve(startDir);
  while (true) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Loads and parses the nearest `package.json` starting from `cwd`.
 *
 * @param cwd - The directory to start searching from (defaults to `process.cwd()`).
 *
 * @returns The parsed package.json object, or `null` if not found or invalid.
 */
export function loadPackageJson(cwd: string = process.cwd()): PackageJsonLike | null {
  const pkgPath = findPackageJson(cwd);
  if (!pkgPath) {
    return null;
  }
  try {
    const raw = readFileSync(pkgPath, "utf8");
    return JSON.parse(raw) as PackageJsonLike;
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
  const pkg = loadPackageJson(cwd);
  return hasVueOrVizeDependency(pkg);
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
