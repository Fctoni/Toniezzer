"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Camera,
  Calendar,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

interface MobileNavProps {
  onMoreClick: () => void;
}

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Upload",
    href: "/documentos/upload",
    icon: Camera,
  },
  {
    title: "Cronograma",
    href: "/cronograma",
    icon: Calendar,
  },
  {
    title: "Chat",
    href: "/comunicacao",
    icon: MessageSquare,
  },
];

export function MobileNav({ onMoreClick }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}

        {/* Botao Mais */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </nav>
  );
}

