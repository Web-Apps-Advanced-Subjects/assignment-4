import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@libs": resolve(__dirname, "src/libs"),
      "@assets": resolve(__dirname, "src/assets"),
    },
  },
  plugins: [
    TanStackRouterVite({
      routeToken: "layout",
    }),
    react(),
    svgr(),
  ],
});
