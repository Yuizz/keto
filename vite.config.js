import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Base del sitio. En GitHub Pages de proyecto la app vive en /keto/.
// Para dominio propio, localhost o cualquier raíz, pasa BASE="/".
//   BASE="/" npm run build
const base = process.env.BASE ?? "/keto/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "icon-maskable.png"],
      manifest: {
        name: "Ruta Keto",
        short_name: "Ruta Keto",
        description: "Tracker diario de constancia, menús y súper para dieta keto.",
        theme_color: "#3F7D5A",
        background_color: "#EEF2EA",
        display: "standalone",
        orientation: "portrait",
        // Relativos al base => funcionan igual en /keto/ que en /.
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // precachea todo el bundle => abre sin internet tras la 1a carga
        globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg,ico}"],
        // SPA: cualquier ruta desconocida cae al index precacheado
        navigateFallback: `${base}index.html`
      }
    })
  ]
});
