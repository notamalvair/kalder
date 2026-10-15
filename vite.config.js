import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': { target: process.env.KALDER_API_PROXY_TARGET || 'http://127.0.0.1:3001' },
    },
    hmr: {
      port: 3000,
    },
  },
  preview: {
    proxy: {
      '/api': { target: process.env.KALDER_API_PROXY_TARGET || 'http://127.0.0.1:3001' },
    },
  },
});
