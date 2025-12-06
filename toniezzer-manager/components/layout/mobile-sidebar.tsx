'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { Button } from '@/components/ui/button'
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
  Building2,
  X,
} from 'lucide-react'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { title: 'Cronograma', href: '/cronograma', icon: Calendar },
  { title: 'Documentos', href: '/documentos', icon: FileImage },
  { title: 'Comunicacao', href: '/comunicacao', icon: MessageSquare },
  { title: 'Fornecedores', href: '/fornecedores', icon: Users },
  { title: 'Qualidade', href: '/qualidade', icon: ClipboardCheck },
  { title: 'Relatorios', href: '/relatorios', icon: FileText },
]

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { can, isAdmin } = usePermissions()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 lg:hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">Toniezzer</h1>
              <p className="text-xs text-slate-400">Manager</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
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
          {isAdmin() && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase">
                  Admin
                </p>
              </div>
              <Link
                href="/configuracoes"
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive('/configuracoes')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                Configuracoes
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>
  )
}

