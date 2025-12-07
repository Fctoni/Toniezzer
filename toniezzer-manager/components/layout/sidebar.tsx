'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/hooks/use-permissions'
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  FileImage,
  MessageSquare,
  Users,
  Settings,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Building2,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  requiresPermission?: () => boolean
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
  },
  {
    title: 'Cronograma',
    href: '/cronograma',
    icon: Calendar,
  },
  {
    title: 'Documentos',
    href: '/documentos',
    icon: FileImage,
  },
  {
    title: 'Comunicacao',
    href: '/comunicacao',
    icon: MessageSquare,
  },
  {
    title: 'Fornecedores',
    href: '/fornecedores',
    icon: Users,
  },
  {
    title: 'Qualidade',
    href: '/qualidade',
    icon: ClipboardCheck,
  },
  {
    title: 'Relatorios',
    href: '/relatorios',
    icon: FileText,
  },
]

const adminItems: NavItem[] = [
  {
    title: 'Configuracoes',
    href: '/configuracoes',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { can, isAdmin, isAdminObra } = usePermissions()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="p-2 bg-primary rounded-lg">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Toniezzer</h1>
          <p className="text-xs text-slate-400">Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </p>
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          )
        })}

        {/* Admin Section */}
        {(isAdmin() || isAdminObra()) && (
          <>
            <div className="pt-6 mb-4">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Administracao
              </p>
            </div>
            
            {adminItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              // Check permission if needed
              if (item.title === 'Configuracoes' && !can.acessarConfiguracoes()) {
                return null
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <TrendingUp className="h-4 w-4" />
          <span>Fase 2 - Comunicação</span>
        </div>
      </div>
    </aside>
  )
}

