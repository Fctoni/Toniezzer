"use client";

import { useState, useEffect } from "react";

/**
 * Hook para detectar media queries
 * @param query - Media query string (ex: "(max-width: 768px)")
 * @returns boolean indicando se a query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    
    // Definir valor inicial
    setMatches(mediaQuery.matches);

    // Handler para mudancas
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adicionar listener
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook conveniente para detectar dispositivos mobile
 * @returns boolean indicando se e mobile (< 768px)
 */
export function useMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * Hook conveniente para detectar tablets
 * @returns boolean indicando se e tablet (768px - 1023px)
 */
export function useTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/**
 * Hook conveniente para detectar desktop
 * @returns boolean indicando se e desktop (>= 1024px)
 */
export function useDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

