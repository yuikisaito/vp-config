import type { UserConfig } from "vite-plus";

import { describe, expect, it } from "vite-plus/test";

import {
  defaultCssConfig,
  defaultFmtConfig,
  defaultLintConfig,
  defaultPackConfig,
  defineConfig,
  mergeConfig,
} from "../src/index.ts";

describe("mergeConfig", () => {
  it("merges two configs with overrides taking precedence", () => {
    const base = {
      fmt: { arrowParens: "avoid", proseWrap: "always" },
    } satisfies UserConfig;
    const user = {
      fmt: { proseWrap: "never" },
    } satisfies UserConfig;
    const merged = mergeConfig(base, user);

    expect(merged.fmt?.proseWrap).toBe("never");
    expect(merged.fmt?.arrowParens).toBe("avoid");
  });

  it("handles multiple overrides in order", () => {
    const base = { server: { port: 3000 } };
    const override1 = { server: { port: 4000 } };
    const override2 = { server: { port: 5000 } };
    const merged = mergeConfig(base, override1, override2);

    expect(merged.server?.port).toBe(5000);
  });

  it("handles nullish configs gracefully", () => {
    const base = { server: { port: 3000 } };
    const merged = mergeConfig(base, null, undefined, { server: { open: true } });

    expect(merged.server?.port).toBe(3000);
    expect(merged.server?.open).toBe(true);
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
