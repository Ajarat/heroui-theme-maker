import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";

import {themeApi} from "./.storybook/theme-api.ts";

export default defineConfig({
  plugins: [tailwindcss(), themeApi()],
  resolve: {alias: {"@": path.resolve(import.meta.dirname, "src")}},
});
