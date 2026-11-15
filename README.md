# @yuikisaito/vp-config

[![npmx.dev version](https://npmx.dev/api/registry/badge/version/@yuikisaito/vp-config)](https://npmx.dev/package/@yuikisaito/vp-config)
[![npmx.dev install size](https://npmx.dev/api/registry/badge/size/@yuikisaito/vp-config)](https://npmx.dev/package/@yuikisaito/vp-config)
[![pkg.pr.new](https://pkg.pr.new/badge/yuikisaito/vp-config)](https://pkg.pr.new/~/yuikisaito/vp-config)
[![CI](https://github.com/yuikisaito/vp-config/actions/workflows/ci.yml/badge.svg)](https://github.com/yuikisaito/vp-config/actions/workflows/ci.yml)

Shared [Vite+](https://viteplus.dev/) configuration. `defineConfig` wraps Vite+'s `defineConfig` and
merges your config over presets for CSS, formatting, linting, and packaging.

## Installation

Add it as a dev dependency in the project that uses it.

```bash
vp add -D @yuikisaito/vp-config
```

## Usage

Export `defineConfig` from `vite.config.ts`. With no arguments, only the presets apply.

```ts
import { defineConfig } from "@yuikisaito/vp-config";

export default defineConfig();
```

An object is deeply merged over the presets.

```ts
import { defineConfig } from "@yuikisaito/vp-config";

export default defineConfig({
  pack: {
    minify: false,
  },
  fmt: {
    proseWrap: "never",
  },
});
```

As with Vite+, you can pass a function, an async function, or a `Promise`. A function receives
`ConfigEnv` (`command` and `mode`).

```ts
export default defineConfig(env => ({
  server: {
    port: env.command === "serve" ? 3000 : 8080,
  },
}));
```

### Vize

[Vize](https://vizejs.dev/) provides the Vue compiler, linter, formatter, and type checker for
Vite+. Pass the result of `defineConfig` to Vize's `defineConfig` and chain `.withVue` to add the
native Vue toolchain.

```bash
vp add -D @vizejs/vite-plugin
```

```ts
import { defineConfig as defineVizeConfig } from "@vizejs/vite-plugin/vite-plus";
import { defineConfig } from "@yuikisaito/vp-config";

export default defineVizeConfig(
  defineConfig({
    server: { port: 3000 },
  }),
).withVue({
  compiler: { sourceMap: true },
});
```

The presets remain in effect after `.withVue()`:

- CSS, formatting, and pack defaults are preserved.
- Default Oxlint plugins and rules stay active. Vize adds its Vue lint layer and disables
  overlapping Vue rules in Oxlint.
- Vue files are excluded from Oxfmt and formatted by Vize instead.
- Vize's tasks (`lint`, `fmt`, `typecheck`, `check`, and others) are generated without overwriting
  existing package scripts. Scripts that already exist are kept, and the generated Vize task gets a
  `vize:` prefix.

Use the standalone `withVue` helper when the Vite+ config is exported elsewhere:

```ts
import { withVue } from "@vizejs/vite-plugin/vite-plus";
import { defineConfig } from "@yuikisaito/vp-config";

export default withVue({ compiler: { sourceMap: true } }, defineConfig());
```

See the [Vize Vite+ guide](https://vizejs.dev/guide/vite-plus/) for compiler, lint, format,
type-check, and pack options.

### Merge

Presets are merged into your config. The shared fields `fmt`, `lint`, and `css` use Vite's
[`mergeConfig`](https://vite.dev/config/#merging-configs), while `pack` uses tsdown's merge
semantics.

- Objects merge deeply, key by key. Later values win.
- Shared fields concatenate arrays. Items from the preset come first, and items from your config are
  appended.
- `pack` arrays are treated as separate build targets. The preset options are applied to every
  target instead of being added as another target.
- `pack` arrays other than `plugins` are replaced by your config, matching tsdown's behavior.

```ts
defineConfig({
  lint: {
    plugins: ["react"],
  },
});
// plugins: ["typescript", "import", "promise", "unicorn", "node", "oxc", "vitest", "jsdoc", "react"]
```

Pack presets cannot set `entry`, since entries are project-specific. Define entries in your own
`pack` config. Targets that omit `entry` fall back to tsdown's default entry resolution.

```ts
defineConfig({
  pack: {
    entry: ["src/index.ts", "src/cli.ts"],
  },
});
```

`mergePresetConfig`, `presetConfig`, and the `PresetConfig` type are exported for composing presets
manually.

```ts
import { mergePresetConfig, presetConfig } from "@yuikisaito/vp-config";

const config = mergePresetConfig(presetConfig, userConfig);
```

## Development

This repository uses Vite+. Install dependencies with `vp install`.

## Acknowledgments

This config was shaped with reference to these Vite+ presets:

- [kazupon/vp-config](https://github.com/kazupon/vp-config)
  ([@kazupon/vp-config](https://www.npmjs.com/package/@kazupon/vp-config))
- [liangmiQwQ/vp-config](https://github.com/liangmiQwQ/vp-config)
  ([@liangmi/vp-config](https://www.npmjs.com/package/@liangmi/vp-config))

Thank you to [kazupon](https://github.com/kazupon) and [liangmi](https://github.com/liangmiQwQ).

## License

MIT
