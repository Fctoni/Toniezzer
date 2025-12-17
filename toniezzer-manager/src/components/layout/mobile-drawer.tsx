"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  FolderOpen,
  Settings,
  Building2,
  MessageSquare,
  Users,
  Bell,
  Package,
  Bot,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
      { title: "Lista de Compras", href: "/compras" },
      { title: "Foto Recibo (OCR)", href: "/financeiro/lancamentos/foto" },
      { title: "Nova Compra", href: "/compras/nova" },
    ],
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    subItems: [
      { title: "Visao Geral", href: "/financeiro" },
      { title: "Lancamentos", href: "/financeiro/lancamentos" },
      { title: "Orcamento", href: "/financeiro/orcamento" },
      { title: "Fluxo de Caixa", href: "/financeiro/fluxo-caixa" },
      { title: "Gastos por Etapa", href: "/financeiro/matriz-gastos" },
    ],
  },
  {
    title: "Cronograma",
    href: "/cronograma",
    icon: Calendar,
  },
  {
    title: "Comunicacao",
    href: "/comunicacao",
    icon: MessageSquare,
  },
  {
    title: "Fornecedores",
    href: "/fornecedores",
    icon: Users,
  },
  {
    title: "Notificacoes",
    href: "/notificacoes",
    icon: Bell,
  },
  {
    title: "Automacao IA",
    href: "/emails",
    icon: Bot,
    subItems: [
      { title: "Emails", href: "/emails" },
      { title: "Reunioes", href: "/reunioes" },
    ],
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FolderOpen,
    subItems: [
      { title: "Galeria", href: "/documentos" },
      { title: "Upload", href: "/documentos/upload" },
    ],
  },
  {
    title: "Configuracoes",
    href: "/configuracoes",
    icon: Settings,
    subItems: [
      { title: "Usuarios", href: "/configuracoes/usuarios" },
      { title: "Categorias", href: "/configuracoes/categorias" },
    ],
  },
];

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-left text-sm">Toniezzer</SheetTitle>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  Manager
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.href}>
                  {/* Item principal */}
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5 shrink-0", active && "text-primary")}
                    />
                    <span>{item.title}</span>
                  </Link>

                  {/* Sub Items */}
                  {hasSubItems && (
                    <div className="ml-8 mt-1 space-y-1 border-l border-border pl-3">
                      {item.subItems?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            pathname === subItem.href
                              ? "text-primary font-medium bg-primary/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
