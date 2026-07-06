import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

// The only non-default CSS setting: use the Lightning CSS transformer for Vite.
export default defineConfig({
  integrations: [react(), mdx()],
  vite: {
    css: {
      transformer: "lightningcss",
    },
  },
});
