import type { OxfmtConfig } from "vite-plus/fmt";

export const defaultFmtConfig = {
  arrowParens: "avoid",
  jsdoc: {
    preferCodeFences: true,
    separateReturnsFromParam: true,
    separateTagGroups: true,
  },
  overrides: [
    {
      files: ["AGENTS.md"],
      options: {
        proseWrap: "preserve",
      },
    },
  ],
  proseWrap: "always",
  sortImports: {
    groups: [
      "side_effect_style",
      "side_effect",
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "style",
      "unknown",
    ],
  },
  sortPackageJson: {
    sortScripts: true,
  },
} satisfies OxfmtConfig;
