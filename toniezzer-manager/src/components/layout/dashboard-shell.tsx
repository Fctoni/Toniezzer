"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { MobileDrawer } from "./mobile-drawer";
import { useMobile } from "@/lib/hooks/use-media-query";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - apenas desktop */}
      {!isMobile && <Sidebar />}

      {/* Conteudo principal */}
      <div
        className={
          isMobile
            ? "pb-20" // Espaco para bottom nav
            : "pl-64 transition-all duration-300" // Espaco para sidebar
        }
      >
        <Header isMobile={isMobile} onMenuClick={() => setDrawerOpen(true)} />
        <main className={isMobile ? "p-4" : "p-6"}>{children}</main>
      </div>

      {/* Navegacao mobile */}
      {isMobile && (
        <>
          <MobileNav onMoreClick={() => setDrawerOpen(true)} />
          <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}
