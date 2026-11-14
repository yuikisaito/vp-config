import type { CSSOptions } from "vite-plus";
import type { OxfmtConfig } from "vite-plus/fmt";
import type { OxlintConfig } from "vite-plus/lint";
import type { PackUserConfig } from "vite-plus/pack";

import { defaultCssConfig } from "./css.ts";
import { defaultFmtConfig } from "./fmt.ts";
import { defaultLintConfig } from "./lint.ts";
import { defaultPackConfig } from "./pack.ts";

export * from "./fmt.ts";
export * from "./lint.ts";
export * from "./pack.ts";
export * from "./css.ts";

/**
 * Configuration that `defineConfig` applies before the user's config.
 *
 * `pack` omits `entry` because entries are project-specific and belong in the user's config.
 */
export interface PresetConfig {
  fmt?: OxfmtConfig;
  lint?: OxlintConfig;
  pack?: Omit<PackUserConfig, "entry">;
  css?: CSSOptions;
}

export const presetConfig = {
  fmt: defaultFmtConfig,
  lint: defaultLintConfig,
  pack: defaultPackConfig,
  css: defaultCssConfig,
} satisfies PresetConfig;
