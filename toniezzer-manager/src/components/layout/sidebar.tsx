"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  FolderOpen,
  Settings,
  Building2,
  ChevronLeft,
  MessageSquare,
  Users,
  Bell,
  Package,
  Mail,
  FileText,
  Camera,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Compras",
    href: "/compras",
    icon: Package,
    subItems: [
      { title: "Lista", href: "/compras" },
      { title: "📷 Foto Recibo", href: "/financeiro/lancamentos/foto" },
      { title: "Nova Compra", href: "/compras/nova" },
    ],
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    subItems: [
      { title: "Visão Geral", href: "/financeiro" },
      { title: "Lançamentos", href: "/financeiro/lancamentos" },
      { title: "Orçamento", href: "/financeiro/orcamento" },
      { title: "Fluxo de Caixa", href: "/financeiro/fluxo-caixa" },
    ],
  },
  {
    title: "Cronograma",
    href: "/cronograma",
    icon: Calendar,
  },
  {
    title: "Comunicação",
    href: "/comunicacao",
    icon: MessageSquare,
  },
  {
    title: "Fornecedores",
    href: "/fornecedores",
    icon: Users,
  },
  {
    title: "Notificações",
    href: "/notificacoes",
    icon: Bell,
  },
  {
    title: "Automação IA",
    href: "/emails",
    icon: Bot,
    subItems: [
      { title: "📧 Emails", href: "/emails" },
      { title: "🎙️ Reuniões", href: "/reunioes" },
    ],
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FolderOpen,
    subItems: [
      { title: "Galeria", href: "/documentos" },
      { title: "Fotos", href: "/documentos/fotos" },
      { title: "Plantas", href: "/documentos/plantas" },
    ],
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    subItems: [
      { title: "👥 Usuários", href: "/configuracoes/usuarios" },
      { title: "Categorias", href: "/configuracoes/categorias" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleExpanded = (title: string) => {
    setExpandedMenu(expandedMenu === title ? null : title);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">
                Toniezzer
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                Manager
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
            <Building2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto h-[calc(100vh-8rem)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedMenu === item.title;

          return (
            <div key={item.href}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronLeft
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "-rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              )}

              {/* Sub Items */}
              {hasSubItems && isExpanded && !collapsed && (
                <div className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === subItem.href
                          ? "text-primary font-medium"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      )}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </aside>
  );
}

