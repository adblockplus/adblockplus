import { nodeResolve } from "@rollup/plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";
import typescript from "@rollup/plugin-typescript";

export default {
  plugins: [
    nodeResolve(),
    cleanup(),
    typescript()
  ],
  output: {
    compact: true,
    format: "iife"
  }
};
