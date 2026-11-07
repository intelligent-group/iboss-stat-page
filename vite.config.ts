import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ base: "/iboss-stat-page/", plugins: [react()], resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } }, build: { outDir: "ops", emptyOutDir: true, sourcemap: false } });
