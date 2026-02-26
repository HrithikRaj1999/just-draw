import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  envDir: resolve(__dirname, "../env"),
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
