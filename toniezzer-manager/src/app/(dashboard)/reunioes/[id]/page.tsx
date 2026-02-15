'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResumoViewer, ActionItemsList } from '@/components/features/reunioes'
import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { fetchMeetingById, deleteMeeting } from '@/lib/services/reunioes'
import { fetchActionsByMeeting, updateActionStatus } from '@/lib/services/reunioes-acoes'
import type { Tables, AcaoStatus } from '@/lib/types/database'
import { parseDateString } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Reuniao = Tables<'reunioes'>
type Acao = Tables<'reunioes_acoes'> & {
  responsavel?: { nome_completo: string } | null
  categoria?: { nome: string; cor: string } | null
}

export default function ReuniaoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [reuniao, setReuniao] = useState<Reuniao | null>(null)
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReuniao() {
      try {
        const supabase = createClient()

        // Carregar reunião
        const reuniaoData = await fetchMeetingById(supabase, resolvedParams.id)
        setReuniao(reuniaoData)

        // Carregar ações
        const acoesData = await fetchActionsByMeeting(supabase, resolvedParams.id)
        setAcoes(acoesData || [])
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar reunião:', error)
        toast.error('Reunião não encontrada')
        router.push('/reunioes')
      }
    }
    loadReuniao()
  }, [resolvedParams.id, router])

  const handleStatusChange = async (acaoId: string, newStatus: AcaoStatus) => {
    try {
      const supabase = createClient()
      await updateActionStatus(supabase, acaoId, newStatus)

      setAcoes(prev => prev.map(a =>
        a.id === acaoId ? { ...a, status: newStatus } : a
      ))

      toast.success(newStatus === 'concluido' ? 'Ação concluída!' : 'Status atualizado')
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      await deleteMeeting(supabase, resolvedParams.id)
      toast.success('Reunião excluída')
      router.push('/reunioes')
    } catch (error) {
      toast.error('Erro ao excluir reunião')
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!reuniao) return null

  const acoesPendentes = acoes.filter(a => a.status === 'pendente' || a.status === 'em_andamento')
  const acoesConcluidas = acoes.filter(a => a.status === 'concluido' || a.status === 'cancelado')

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reunioes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {reuniao.titulo}
            </h1>
            <p className="text-muted-foreground">
              {parseDateString(reuniao.data_reuniao).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as ações associadas também serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="acoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="acoes" className="gap-2">
            📋 Ações
            {acoesPendentes.length > 0 && (
              <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {acoesPendentes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resumo">📝 Resumo Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="acoes" className="space-y-4">
          {acoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">Nenhuma ação extraída desta reunião.</p>
              <p className="text-sm">
                As ações são extraídas automaticamente quando a reunião é processada com IA.
              </p>
            </div>
          ) : (
            <>
              {acoesPendentes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Pendentes ({acoesPendentes.length})
                  </h3>
                  <ActionItemsList 
                    acoes={acoesPendentes} 
                    onStatusChange={handleStatusChange}
                  />
                </div>
              )}
              
              {acoesConcluidas.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Concluídas ({acoesConcluidas.length})
                  </h3>
                  <ActionItemsList 
                    acoes={acoesConcluidas}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="resumo">
          <ResumoViewer
            titulo={reuniao.titulo}
            data={reuniao.data_reuniao}
            participantes={reuniao.participantes || undefined}
            markdown={reuniao.resumo_markdown}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

