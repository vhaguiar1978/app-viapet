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

// Atualiza a tag de build no localStorage e limpa caches antigos do PWA.
// Importante: NAO recarregar a pagina aqui — abas com versoes diferentes
// do bundle podem brigar pela chave e gerar loop infinito de reload (tela piscando).
// Vite HMR cuida do refresh em dev, e em producao o proximo refresh natural pega a versao nova.
const BUILD_TAG = "2026-05-07-no-reload-loop-v22";
try {
  const stored = localStorage.getItem("viapet.build.tag");
  if (stored !== BUILD_TAG) {
    localStorage.setItem("viapet.build.tag", BUILD_TAG);
    if (window.caches?.keys) {
      window.caches.keys().then((keys) =>
        Promise.all(keys.map((k) => window.caches.delete(k)))
      ).catch(() => {});
    }
  }
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
