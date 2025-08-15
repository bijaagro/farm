import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  console.log(`📦 Vite is running in ${mode} mode`);
  return {
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://bijafarms-api.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
    fs: {
      allow: ["./client", "./shared", "./src"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html"
    },
    assetsInclude: ["**/*.js", "**/*.mjs"],
  },
  plugins: [react()],
  base: mode === "gh-pages" || process.env.NODE_ENV === "production" ? "/bijafarms/" : "/bijafarms/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  };
});
