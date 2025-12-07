'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X, Building2 } from 'lucide-react'
import type { Fornecedor } from '@/lib/types/database'

interface FornecedorFormProps {
  fornecedor?: Fornecedor
  onSuccess?: () => void
  onCancel?: () => void
}

const tiposFornecedor = [
  'Empreiteiro',
  'Fornecedor de Material',
  'Prestador de Serviço',
  'Arquiteto',
  'Engenheiro',
  'Eletricista',
  'Encanador',
  'Pintor',
  'Pedreiro',
  'Serralheiro',
  'Vidraceiro',
  'Marceneiro',
  'Outros',
]

export function FornecedorForm({ fornecedor, onSuccess, onCancel }: FornecedorFormProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: fornecedor?.nome || '',
    cnpj_cpf: fornecedor?.cnpj_cpf || '',
    email: fornecedor?.email || '',
    telefone: fornecedor?.telefone || '',
    endereco: fornecedor?.endereco || '',
    tipo: fornecedor?.tipo || '',
    especialidade: fornecedor?.especialidade || '',
  })

  const supabase = createClient()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim() || !user) return

    setIsSubmitting(true)
    try {
      if (fornecedor) {
        // Atualizar
        const { error } = await supabase
          .from('fornecedores')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fornecedor.id)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from('fornecedores')
          .insert({
            ...formData,
            created_by: user.id,
          })

        if (error) throw error
      }

      onSuccess?.()
      router.push('/fornecedores')
      router.refresh()
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Nome do fornecedor ou empresa"
              required
            />
          </div>

          {/* Tipo e Especialidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposFornecedor.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={formData.especialidade}
                onChange={(e) => handleChange('especialidade', e.target.value)}
                placeholder="Ex: Fundações, Acabamento..."
              />
            </div>
          </div>

          {/* CPF/CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj_cpf">CPF/CNPJ</Label>
            <Input
              id="cnpj_cpf"
              value={formData.cnpj_cpf}
              onChange={(e) => handleChange('cnpj_cpf', e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => handleChange('endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={!formData.nome.trim() || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {fornecedor ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

