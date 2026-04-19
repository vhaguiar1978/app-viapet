import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (id.includes("/src/features/messages/")) {
            return "messages";
          }
          if (id.includes("/src/features/finance/")) {
            return "finance";
          }
          if (id.includes("/src/features/settings/")) {
            return "settings";
          }
          if (id.includes("/src/features/agenda/")) {
            return "agenda";
          }
          if (id.includes("/src/features/dashboard/")) {
            return "dashboard";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3001,
    host: true,
    allowedHosts: [".lhr.life", ".localhost.run"],
  },
  preview: {
    port: 3001,
    host: true,
    allowedHosts: [".lhr.life", ".localhost.run"],
  }
});
