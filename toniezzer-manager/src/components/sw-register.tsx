"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Registrar o Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registrado com sucesso");

        // Verificar atualizações periodicamente (a cada 1 hora)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Quando uma nova versão é encontrada
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // Quando o novo SW está pronto e há um SW antigo ativo
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("[SW] Nova versão disponível, atualizando...");
              // Força o novo SW a assumir imediatamente
              newWorker.postMessage("skipWaiting");
            }
          });
        });
      })
      .catch((error) => {
        console.error("[SW] Falha no registro:", error);
      });

    // Quando o SW assume controle (após atualização), recarrega a página
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      console.log("[SW] Novo SW ativo, recarregando página...");
      window.location.reload();
    });
  }, []);

  return null;
}




