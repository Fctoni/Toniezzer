'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReuniaoCard } from '@/components/features/reunioes'
import { Plus, Search, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchMeetingsWithDetails } from '@/lib/services/reunioes'
import type { Tables } from '@/lib/types/database'

type ReuniaoComContagem = Tables<'reunioes'> & {
  acoes_count: number
  acoes_pendentes: number
  created_by_user: { nome_completo: string } | null
}

export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState<ReuniaoComContagem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadReunioes() {
      try {
        const supabase = createClient()
        const data = await fetchMeetingsWithDetails(supabase)

        // Processar dados para adicionar contagens
        const reunioesProcessadas = data.map(r => ({
          ...r,
          acoes_count: r.reunioes_acoes?.length || 0,
          acoes_pendentes: r.reunioes_acoes?.filter((a: { status: string }) =>
            a.status === 'pendente' || a.status === 'em_andamento'
          ).length || 0,
          created_by_user: r.created_by_user,
        }))

        setReunioes(reunioesProcessadas)
      } catch (error) {
        console.error('Erro ao carregar reuniões:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReunioes()
  }, [])

  const reunioesFiltradas = reunioes.filter(r =>
    r.titulo.toLowerCase().includes(search.toLowerCase()) ||
    r.participantes?.some(p => p.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Reuniões
          </h1>
          <p className="text-muted-foreground">
            Resumos e ações extraídas das reuniões
          </p>
        </div>
        <Button asChild>
          <Link href="/reunioes/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Reunião
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou participante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de reuniões */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : reunioesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'Nenhuma reunião encontrada' : 'Nenhuma reunião cadastrada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search 
              ? 'Tente ajustar os termos de busca'
              : 'Faça upload de um arquivo Markdown do Plaud para começar'
            }
          </p>
          {!search && (
            <Button asChild>
              <Link href="/reunioes/nova">
                <Plus className="h-4 w-4 mr-2" />
                Importar Reunião
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reunioesFiltradas.map((reuniao) => (
            <ReuniaoCard key={reuniao.id} reuniao={reuniao} />
          ))}
        </div>
      )}
    </div>
  )
}

