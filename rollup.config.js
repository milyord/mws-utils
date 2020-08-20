import pkg from "./package.json";

export default [
  {
    input: "src/main.js",
    external: ["querystring", "crypto", "fs"],
    output: [{ file: pkg.main, format: "cjs" }],
  },
];
