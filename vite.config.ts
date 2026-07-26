import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/delivery": {
        target: "https://vupi.us",
        changeOrigin: true,
        secure: true,
      },
      "/cep": {
        target: "https://viacep.com.br",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/cep\/(\d{8})$/, "/ws/$1/json/"),
      },
    },
  },
  preview: {
    host: "::",
    port: 4173,
    proxy: {
      "/delivery": {
        target: "https://vupi.us",
        changeOrigin: true,
        secure: true,
      },
      "/cep": {
        target: "https://viacep.com.br",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/cep\/(\d{8})$/, "/ws/$1/json/"),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
