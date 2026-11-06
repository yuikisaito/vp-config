import type { UserConfig } from "vite-plus";

import { defu } from "defu";

/**
 * Merges Vite+ configuration objects using `defu`. Later configuration objects take precedence over
 * earlier ones.
 *
 * @param defaults - The base/default configuration.
 * @param overrides - The overriding configuration object(s).
 *
 * @returns The merged configuration object.
 */
export function mergeConfig(
  defaults?: UserConfig | null,
  ...overrides: (UserConfig | undefined | null)[]
): UserConfig {
  const base = defaults ?? {};
  return (defu as (...args: readonly unknown[]) => UserConfig)(...overrides.toReversed(), base);
}

export { mergeConfig as merge };
export default mergeConfig;
