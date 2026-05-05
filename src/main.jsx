import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import "./theme-pro.css";

// Desregistra qualquer Service Worker antigo (cache de PWA da producao)
// que pode estar interceptando requests em localhost e causando bugs.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) reg.unregister();
  }).catch(() => {});
  if (window.caches?.keys) {
    window.caches.keys().then((keys) => {
      for (const key of keys) window.caches.delete(key);
    }).catch(() => {});
  }
}

// Kill switch: forca um hard reload UNICO se a versao mudou.
// Bumpa o BUILD_TAG abaixo a cada vez que mudar codigo critico (ou simplesmente Date.now()).
const BUILD_TAG = "2026-05-05-chat-sticky-scroll-v18";
try {
  const stored = localStorage.getItem("viapet.build.tag");
  if (stored && stored !== BUILD_TAG) {
    localStorage.setItem("viapet.build.tag", BUILD_TAG);
    // Limpa todo cache e recarrega ignorando cache do navegador
    if (window.caches?.keys) {
      window.caches.keys().then((keys) =>
        Promise.all(keys.map((k) => window.caches.delete(k)))
      ).finally(() => window.location.reload(true));
    } else {
      window.location.reload(true);
    }
  } else if (!stored) {
    localStorage.setItem("viapet.build.tag", BUILD_TAG);
  }
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
