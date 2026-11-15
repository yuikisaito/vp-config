import type { ConfigEnv, UserConfig } from "vite-plus";

import {
  defineConfig as vizeDefineConfig,
  vitePlusConfig,
  withVue,
} from "@vizejs/vite-plugin/vite-plus";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

import {
  applyVizeConfig,
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
  defineConfig,
  detectVueOrVize,
  hasVueOrVizeDependency,
} from "../src/index.ts";

const env = { command: "serve", mode: "development" } satisfies ConfigEnv;

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

  it("supports vitePlusConfig wrapping defineConfig", async () => {
    const userPlugin = { name: "user-plugin" };
    const config = await vitePlusConfig(
      defineConfig({
        plugins: [userPlugin],
      }),
    );

    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
    expect(config.fmt?.arrowParens).toBe(defaultFmtConfig.arrowParens);
    expect(config.fmt?.sortImports).toStrictEqual(defaultFmtConfig.sortImports);
    expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
    expect(config.fmt?.ignorePatterns).toContain("**/.vize/**");
    expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
    expect(config.lint?.rules?.["eslint/no-var"]).toBe("error");
    expect(config.lint?.rules?.["eslint/no-unused-vars"]).toBe("off");
    expect(config.pack).toMatchObject(defaultPackConfig);

    const names = flattenPluginNames(config.plugins);
    expect(names).toContain("vite-plugin-vize");
    expect(names).toContain("user-plugin");

    const pack = Array.isArray(config.pack) ? config.pack[0] : config.pack;
    expect(flattenPluginNames(pack?.plugins)).toContain("unplugin-vize");

    expect(config.run?.tasks).toBeUndefined();
  });

  it("supports spreading vitePlusConfig output into defineConfig with literal tasks", async () => {
    const vize = await vitePlusConfig({
      vue: { compile: { sourceMap: true } },
    });
    const config = defineConfig({
      ...vize,
      run: {
        tasks: {
          check: { command: "vize-vp-task check", cache: false },
          lint: { command: "vize-vp-task lint", cache: false },
        },
      },
    });

    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
    expect(config.fmt?.arrowParens).toBe(defaultFmtConfig.arrowParens);
    expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
    expect(config.lint?.rules?.["eslint/no-var"]).toBe("error");

    const names = flattenPluginNames(config.plugins);
    expect(names).toContain("vite-plugin-vize");

    expect(config.run?.tasks).toStrictEqual({
      check: { command: "vize-vp-task check", cache: false },
      lint: { command: "vize-vp-task lint", cache: false },
    });
  });
});

describe("Vize dependency auto-detection and injection", () => {
  it("detects vue or vize in dependencies", () => {
    expect(hasVueOrVizeDependency({ dependencies: { vue: "^3.5.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ devDependencies: { vue: "^3.5.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ peerDependencies: { vue: "^3.5.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ optionalDependencies: { vue: "^3.5.0" } })).toBe(true);

    expect(hasVueOrVizeDependency({ dependencies: { vize: "^0.750.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ devDependencies: { vize: "^0.750.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ peerDependencies: { vize: "^0.750.0" } })).toBe(true);
    expect(hasVueOrVizeDependency({ optionalDependencies: { vize: "^0.750.0" } })).toBe(true);

    expect(hasVueOrVizeDependency({ dependencies: { react: "^19.0.0" } })).toBe(false);
    expect(hasVueOrVizeDependency({})).toBe(false);
    expect(hasVueOrVizeDependency(null)).toBe(false);
    expect(hasVueOrVizeDependency()).toBe(false);
  });

  it("does not detect vue or vize in current project by default", () => {
    expect(detectVueOrVize()).toBe(false);
  });

  it("detects vue in a directory with a vue dependency in package.json", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "vp-config-test-"));
    try {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { vue: "^3.5.0" } }),
      );
      expect(detectVueOrVize(tempDir)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("detects vize in a directory with a vize devDependency in package.json", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "vp-config-test-"));
    try {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ devDependencies: { vize: "^0.752.0" } }),
      );
      expect(detectVueOrVize(tempDir)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("automatically enriches configuration with applyVizeConfig", async () => {
    const enriched = await applyVizeConfig({
      css: defaultCssConfig,
      fmt: defaultFmtConfig,
      lint: defaultLintConfig,
      pack: defaultPackConfig,
    });

    expect(enriched.fmt?.ignorePatterns).toContain("**/*.vue");
    expect(enriched.fmt?.ignorePatterns).toContain("**/.vize/**");
    expect(enriched.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
    expect(flattenPluginNames(enriched.plugins)).toContain("vite-plugin-vize");
  });

  it("automatically injects vize config in defineConfig when vue is in dependencies", async () => {
    const tempDir = mkdtempSync(join(process.cwd(), ".temp-vize-test-"));
    const origCwd = process.cwd();

    try {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { vue: "^3.5.0" } }),
      );
      process.chdir(tempDir);

      const configPromise = defineConfig({
        server: { port: 4000 },
      });

      expect(configPromise).toBeInstanceOf(Promise);
      const config = (await (configPromise as unknown as Promise<UserConfig>)) as UserConfig;

      expect(config.server?.port).toBe(4000);
      expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
      expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
      expect(config.fmt?.ignorePatterns).toContain("**/.vize/**");
      expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
      expect(flattenPluginNames(config.plugins)).toContain("vite-plugin-vize");
    } finally {
      process.chdir(origCwd);
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("automatically injects vize config when called without arguments and vue is present", async () => {
    const tempDir = mkdtempSync(join(process.cwd(), ".temp-vize-test-"));
    const origCwd = process.cwd();

    try {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ devDependencies: { vize: "^0.752.0" } }),
      );
      process.chdir(tempDir);

      const configPromise = defineConfig();

      expect(configPromise).toBeInstanceOf(Promise);
      const config = (await (configPromise as unknown as Promise<UserConfig>)) as UserConfig;

      expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
      expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
      expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
      expect(flattenPluginNames(config.plugins)).toContain("vite-plugin-vize");
    } finally {
      process.chdir(origCwd);
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("automatically injects vize config when using function configuration and vue is present", async () => {
    const tempDir = mkdtempSync(join(process.cwd(), ".temp-vize-test-"));
    const origCwd = process.cwd();

    try {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { vue: "^3.5.0" } }),
      );
      process.chdir(tempDir);

      const configFn = defineConfig(environment => ({
        server: {
          port: environment.mode === "production" ? 8080 : 3000,
        },
      }));

      expect(typeof configFn).toBe("function");
      const config = await (configFn as (env: ConfigEnv) => Promise<UserConfig>)({
        command: "serve",
        mode: "development",
      });

      expect(config.server?.port).toBe(3000);
      expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
      expect(config.fmt?.ignorePatterns).toContain("**/*.vue");
      expect(config.lint?.plugins).toStrictEqual(["vue", ...defaultLintConfig.plugins]);
      expect(flattenPluginNames(config.plugins)).toContain("vite-plugin-vize");
    } finally {
      process.chdir(origCwd);
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
