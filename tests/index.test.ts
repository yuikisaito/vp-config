import { describe, expect, it } from "vite-plus/test";

import {
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
  defineConfig,
  mergePresetConfig,
} from "../src/index.ts";

describe("mergePresetConfig", () => {
  it("merges preset fields with user values taking precedence", () => {
    const merged = mergePresetConfig(
      { fmt: { arrowParens: "avoid", proseWrap: "always" } },
      { fmt: { proseWrap: "never" } },
    );

    expect(merged.fmt?.proseWrap).toBe("never");
    expect(merged.fmt?.arrowParens).toBe("avoid");
  });

  it("preserves user fields that are not part of the preset", () => {
    const merged = mergePresetConfig({ fmt: { proseWrap: "always" } }, { server: { port: 3000 } });

    expect(merged.server?.port).toBe(3000);
    expect(merged.fmt?.proseWrap).toBe("always");
  });

  it("does not add fields that are absent from the preset", () => {
    const merged = mergePresetConfig({ fmt: { proseWrap: "always" } }, {});

    expect(merged).toStrictEqual({ fmt: { proseWrap: "always" } });
    expect(merged).not.toHaveProperty("lint");
    expect(merged).not.toHaveProperty("css");
    expect(merged).not.toHaveProperty("pack");
  });

  it("concatenates array values instead of overriding them", () => {
    const merged = mergePresetConfig(
      { lint: { plugins: ["typescript", "import"] } },
      { lint: { plugins: ["unicorn"] } },
    );

    expect(merged.lint?.plugins).toStrictEqual(["typescript", "import", "unicorn"]);
  });

  it("applies defaults to every pack target instead of adding a target", () => {
    const merged = mergePresetConfig(
      { pack: { minify: true } },
      { pack: [{ entry: "src/a.ts" }, { entry: "src/b.ts" }] },
    );

    expect(merged.pack).toStrictEqual([
      { minify: true, entry: "src/a.ts" },
      { minify: true, entry: "src/b.ts" },
    ]);
  });

  it("replaces pack arrays instead of concatenating them", () => {
    const merged = mergePresetConfig(
      { pack: { deps: { neverBundle: ["react"] }, minify: true } },
      { pack: { deps: { neverBundle: ["vue"] } } },
    );

    expect(merged.pack).toStrictEqual({ deps: { neverBundle: ["vue"] }, minify: true });
  });
});

describe("defineConfig", () => {
  it("returns default configuration when called without arguments", () => {
    const config = defineConfig();

    expect(config.css?.transformer).toBe(defaultCssConfig.transformer);
    expect(config.fmt?.arrowParens).toBe(defaultFmtConfig.arrowParens);
    expect(config.lint?.plugins).toStrictEqual(defaultLintConfig.plugins);
    expect(config.pack).toMatchObject({
      dts: { generator: defaultPackConfig.dts.generator },
      minify: defaultPackConfig.minify,
    });
    // Vite+ internal plugins are injected
    expect(config.plugins).toBeDefined();
  });

  it("merges user config object over defaults", () => {
    const config = defineConfig({
      pack: {
        minify: false,
      },
      fmt: {
        proseWrap: "never",
      },
    });

    expect(config.pack).toMatchObject({
      minify: false,
      dts: { generator: "tsgo" },
    });
    expect(config.fmt?.proseWrap).toBe("never");
    expect(config.fmt?.arrowParens).toBe("avoid");
  });

  it("appends array values to defaults instead of overriding them", () => {
    const config = defineConfig({
      lint: {
        plugins: ["react"],
      },
    });

    expect(config.lint?.plugins).toStrictEqual([...defaultLintConfig.plugins, "react"]);
  });

  it("applies pack defaults to every user-defined pack target", () => {
    const config = defineConfig({
      pack: [{ entry: "src/a.ts" }, { entry: "src/b.ts" }],
    });

    expect(config.pack).toStrictEqual([
      { ...defaultPackConfig, entry: "src/a.ts" },
      { ...defaultPackConfig, entry: "src/b.ts" },
    ]);
  });

  it("supports function configuration", () => {
    const configFn = defineConfig(env => ({
      server: {
        port: env.command === "serve" ? 3000 : 8080,
      },
    }));

    expect(configFn).toBeTypeOf("function");
    const config = (
      configFn as (env: { command: string; mode: string }) => {
        server?: { port?: number };
        css?: { transformer?: string };
      }
    )({ command: "serve", mode: "development" });
    expect(config.server?.port).toBe(3000);
    expect(config.css?.transformer).toBe("lightningcss");
  });

  it("supports async function configuration", async () => {
    const configFn = defineConfig(async env => {
      await Promise.resolve();
      return {
        server: {
          port: env.mode === "production" ? 8080 : 3000,
        },
      };
    });

    expect(configFn).toBeTypeOf("function");
    const config = await (
      configFn as (env: { command: string; mode: string }) => Promise<{
        server?: { port?: number };
        css?: { transformer?: string };
      }>
    )({ command: "serve", mode: "production" });
    expect(config.server?.port).toBe(8080);
    expect(config.css?.transformer).toBe("lightningcss");
  });

  it("supports Promise configuration", async () => {
    const configPromise = defineConfig(
      Promise.resolve({
        server: { port: 9000 },
      }),
    );

    expect(configPromise).toBeInstanceOf(Promise);
    const config = await configPromise;
    expect(config.server?.port).toBe(9000);
    expect(config.css?.transformer).toBe("lightningcss");
  });
});
