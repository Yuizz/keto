import React from "react";
import ReactDOM from "react-dom/client";

// Fuentes empaquetadas localmente (sin internet)
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import App from "./App.jsx";
import "./index.css";

// Service worker con auto-actualización real: aplica la versión nueva y
// recarga, revisa updates cada hora y cada vez que vuelves a la app.
import { registerSW } from "virtual:pwa-register";
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return;
    setInterval(() => reg.update(), 60 * 60 * 1000); // cada hora
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update();
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
