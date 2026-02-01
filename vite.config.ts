import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    {
      name: "custom-dev-events",
      configureServer(server) {
        server.ws.on("my-custom-event", (data) => {
          console.log("Received custom event:", data.message);
        });
      },
    },
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    port: 6543,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5634,
      protocol: "ws",
    },
  },
});
