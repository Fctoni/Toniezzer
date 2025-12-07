'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { FornecedorForm } from '@/components/features/fornecedores/fornecedor-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NovoFornecedorPage() {
  const router = useRouter()
  const { can, isLoading } = usePermissions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!can.criarFornecedor()) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para cadastrar fornecedores.
          </p>
          <Link href="/fornecedores">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/fornecedores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Fornecedor</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo fornecedor ou prestador
          </p>
        </div>
      </div>

      {/* Formulário */}
      <FornecedorForm
        onCancel={() => router.push('/fornecedores')}
      />
    </div>
  )
}

