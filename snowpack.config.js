"use strict";

const PROD =
  process.env.NODE_ENV === "production" && !process.argv.includes("--watch");

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: "/", static: true },
    src: { url: "/main" },
  },
  alias: {
    app: "./src/app",
    core: "./src/core",
    lib: "./src/lib",
    "react-query/devtools": PROD
      ? "react-query/devtools"
      : "react-query/devtools/development",
  },
  plugins: [
    "@snowpack/plugin-react-refresh",
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-typescript",
    "@snowpack/plugin-postcss",
    "snowpack-svgr-plugin",
    [
      "@snowpack/plugin-build-script",
      {
        input: ["content.ts"], // files to watch
        output: [".bundle.js"], // files to export
        cmd: [
          "esbuild",
          "$FILE",
          `--define:process.env.NODE_ENV=\'"${process.env.NODE_ENV}"\'`,
          `--define:process.env.SNOWPACK_PUBLIC_DEBUG=\'"${process.env.SNOWPACK_PUBLIC_DEBUG}"\'`,
          "--bundle",
          PROD && "--minify",
        ]
          .filter(Boolean)
          .join(" "),
      },
    ],
    [
      "@snowpack/plugin-run-script",
      (() => {
        const common = "{src,types} --ext .js,jsx,.ts,.tsx --color";
        return {
          cmd: `eslint ${common}`,
          watch: `esw -w --clear --max-warnings 5 ${common}`,
        };
      })(),
    ],
    "./.sp/remove-hmrurl-plugin.js",
    "./.sp/optimize-manifest-plugin.js",
    "./.sp/remove-useless-stuff.js",
  ],
  optimize: {
    bundle: PROD,
    minify: PROD,
    treeshake: PROD,
    splitting: PROD,
    target: "es2020",
  },
  devOptions: {
    open: "none",
  },
  buildOptions: {
    metaUrlPath: "meta", // chrome ext issue with __snowpack__ because _ is reserved for system,
    // sourcemap: !PROD, // chrome ext issue with sourcemaps
  },
};
