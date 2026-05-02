import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Pin react version explicitly. Without this, eslint-plugin-react@7.37.5
  // (transitively required by eslint-config-next) tries to auto-detect the
  // installed React version via `context.getFilename()`, which was removed
  // in ESLint 10 and crashes with "contextOrFilename.getFilename is not a
  // function". Setting an explicit version short-circuits the detection.
  {
    settings: {
      react: { version: "19.2.5" },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "worker-configuration.d.ts",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
