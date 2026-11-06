import { defineConfig as vizeDefineConfig, withVue } from "@vizejs/vite-plugin/vite-plus";
import { describe, expect, it } from "vite-plus/test";

import {
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
  defineConfig,
} from "../src/index.ts";

const env = { command: "serve", mode: "development" } as const;

function flattenPluginNames(plugins: unknown): string[] {
  if (Array.isArray(plugins)) {
    return plugins.flatMap(flattenPluginNames);
  }
  if (plugins && typeof plugins === "object" && "name" in plugins) {
    const { name } = plugins as { name?: unknown };
    return typeof name === "string" ? [name] : [];
  }
  return [];
}

describe("Vize compatibility", () => {
  it("preserves the default presets when composed with Vize", async () => {
    const config = await vizeDefineConfig(defineConfig()).withVue({ compile: { sourceMap: true } })(
      env,
    );

    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
    expect(config.fmt?.arrowParens).toBe(defaultFmtConfig.arrowParens);
    expect(config.fmt?.proseWrap).toBe(defaultFmtConfig.proseWrap);
    expect(config.fmt?.sortImports).toStrictEqual(defaultFmtConfig.sortImports);
    expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
    expect(config.lint?.options).toStrictEqual(defaultLintConfig.options);
    expect(config.lint?.categories).toStrictEqual(defaultLintConfig.categories);
    expect(config.pack).toMatchObject(defaultPackConfig);
  });

  it("injects the Vize compiler plugin while keeping existing plugins", async () => {
    const userPlugin = { name: "user-plugin" };
    const config = await vizeDefineConfig(defineConfig({ plugins: [userPlugin] })).withVue({})(env);

    const names = flattenPluginNames(config.plugins);

    expect(names).toContain("vite-plugin-vize");
    expect(names).toContain("user-plugin");
    expect(names).toContain("vite-plus:vitest-resolver");
  });

  it("keeps the Oxlint policy while delegating Vue lint to Vize", async () => {
    const config = await vizeDefineConfig(defineConfig()).withVue({})(env);

    expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
    expect(config.lint?.rules?.["eslint/no-var"]).toBe("error");
    expect(config.lint?.rules?.["eslint/no-unused-vars"]).toBe("off");
    expect(config.lint?.settings).toStrictEqual(defaultLintConfig.settings);
  });

  it("keeps formatting defaults and excludes Vue files from Oxfmt", async () => {
    const config = await vizeDefineConfig(defineConfig()).withVue({})(env);

    expect(config.fmt?.arrowParens).toBe(defaultFmtConfig.arrowParens);
    expect(config.fmt?.overrides).toStrictEqual(defaultFmtConfig.overrides);
    expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
    expect(config.fmt?.ignorePatterns).toContain("**/.vize/**");
  });

  it("keeps pack defaults and adds Vize's Rolldown plugin", async () => {
    const config = await vizeDefineConfig(defineConfig()).withVue({})(env);
    const pack = Array.isArray(config.pack) ? config.pack[0] : config.pack;

    expect(pack?.dts).toStrictEqual(defaultPackConfig.dts);
    expect(pack?.minify).toBe(defaultPackConfig.minify);
    expect(flattenPluginNames(pack?.plugins)).toContain("unplugin-vize");
  });

  it("generates Vize tasks without overwriting package scripts", async () => {
    const config = await vizeDefineConfig(defineConfig()).withVue({})(env);
    const tasks = config.run?.tasks ?? {};

    expect(tasks).toHaveProperty("lint");
    expect(tasks).toHaveProperty("lint:fix");
    expect(tasks).toHaveProperty("fmt");
    expect(tasks).toHaveProperty("typecheck");
    expect(tasks).toHaveProperty("vize:build");
    expect(tasks).toHaveProperty("vize:check");
    expect(tasks).not.toHaveProperty("check");
  });

  it("forwards the Vite environment to function configurations", async () => {
    const config = await vizeDefineConfig(
      defineConfig(environment => ({
        server: {
          port: environment.mode === "production" ? 8080 : 3000,
        },
      })),
    ).withVue({})({ command: "serve", mode: "production" });

    expect(config.server?.port).toBe(8080);
    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
  });

  it("forwards the Vite environment to async function configurations", async () => {
    const config = await vizeDefineConfig(
      defineConfig(async environment => {
        await Promise.resolve();
        return {
          server: {
            port: environment.command === "build" ? 8080 : 3000,
          },
        };
      }),
    ).withVue({})({ command: "build", mode: "production" });

    expect(config.server?.port).toBe(8080);
    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
  });

  it("supports the standalone withVue helper", async () => {
    const config = await withVue({ compile: { sourceMap: true } }, defineConfig())(env);

    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
    expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
  });
});
