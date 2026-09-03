import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "artifacts/**", "coverage/**"]
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser
    }
  },
  {
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.serviceworker
    }
  },
  {
    files: ["tests/**/*.{js,mjs}", "scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node
    }
  },
  {
    files: ["tests/e2e.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    rules: {
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "error"
    }
  }
];
