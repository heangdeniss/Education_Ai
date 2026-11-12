import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
// so every asset URL needs that prefix. User/organisation sites
// (<user>.github.io) are served from the domain root instead.
// Set VITE_BASE to override (e.g. "/" for a custom domain).
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserSite = repo.endsWith(".github.io");
const base =
  process.env.VITE_BASE ||
  (process.env.GITHUB_ACTIONS && repo && !isUserSite ? `/${repo}/` : "/");

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { outDir: "dist" },
});
