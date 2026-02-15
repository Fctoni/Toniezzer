'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { createQuickSupplier } from '@/lib/services/fornecedores'

const quickFornecedorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['fornecedor_material', 'prestador_servico']),
  cnpj_cpf: z.string().optional(),
  telefone: z.string().optional(),
})

type QuickFornecedorData = z.infer<typeof quickFornecedorSchema>

interface QuickAddFornecedorProps {
  onFornecedorAdded: (fornecedor: { id: string; nome: string }) => void
}

export function QuickAddFornecedor({ onFornecedorAdded }: QuickAddFornecedorProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuickFornecedorData>({
    resolver: zodResolver(quickFornecedorSchema),
    defaultValues: {
      nome: '',
      tipo: 'fornecedor_material',
      cnpj_cpf: '',
      telefone: '',
    },
  })

  const onSubmit = async (data: QuickFornecedorData) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const newFornecedor = await createQuickSupplier(supabase, {
        nome: data.nome,
        tipo: data.tipo,
        cnpj_cpf: data.cnpj_cpf || null,
        telefone: data.telefone || null,
        ativo: true,
      })

      toast.success('Fornecedor adicionado!')
      onFornecedorAdded({ id: newFornecedor.id, nome: newFornecedor.nome })
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error)
      toast.error('Erro ao criar fornecedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium border-b mb-1"
      >
        <Plus className="h-4 w-4 mr-2" />
        + Novo fornecedor
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Fornecedor</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fornecedor_material">Fornecedor de Material</SelectItem>
                      <SelectItem value="prestador_servico">Prestador de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      </Dialog>
    </>
  )
}

