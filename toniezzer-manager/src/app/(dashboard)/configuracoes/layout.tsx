'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Tags, Settings } from 'lucide-react'

const configTabs = [
  {
    title: 'Usuarios',
    href: '/configuracoes/usuarios',
    icon: Users,
    description: 'Gerenciar usuarios e permissoes',
  },
  {
    title: 'Categorias',
    href: '/configuracoes/categorias',
    icon: Tags,
    description: 'Categorias de gastos e compras',
  },
]

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuracoes
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuarios, categorias e outras configuracoes do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {configTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
