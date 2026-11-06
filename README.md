# @yuikisaito/vp-config

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

### Merge

Merging uses [`defu`](https://github.com/unjs/defu).

- Objects merge deeply, key by key. Later values win.
- Arrays are concatenated. Items from the later config come first.

```ts
defineConfig({
  lint: {
    plugins: ["react"],
  },
});
// plugins: ["react", "typescript", "import", "promise", "unicorn", "node", "oxc", "vitest", "jsdoc"]
```

The same helper is exported as `mergeConfig` (alias `merge`). The first argument is the base. Each
following argument overrides it in order. `null` and `undefined` are skipped.

```ts
import { mergeConfig } from "@yuikisaito/vp-config";

const config = mergeConfig(base, overrideA, overrideB);
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
