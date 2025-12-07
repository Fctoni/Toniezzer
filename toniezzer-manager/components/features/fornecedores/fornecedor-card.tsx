'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AvaliacaoStars } from './avaliacao-stars'
import { 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink,
  Building2,
  Wrench
} from 'lucide-react'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import type { Fornecedor } from '@/lib/types/database'

interface FornecedorCardProps {
  fornecedor: Fornecedor & { total_pagamentos?: number }
  className?: string
}

export function FornecedorCard({ fornecedor, className }: FornecedorCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {fornecedor.nome ? getInitials(fornecedor.nome) : '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{fornecedor.nome}</h3>
              {fornecedor.tipo && (
                <Badge variant="outline" className="mt-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  {fornecedor.tipo}
                </Badge>
              )}
            </div>
          </div>
          
          {!fornecedor.ativo && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Inativo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Especialidade */}
        {fornecedor.especialidade && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>{fornecedor.especialidade}</span>
          </div>
        )}

        {/* Contato */}
        <div className="space-y-2">
          {fornecedor.telefone && (
            <a 
              href={`tel:${fornecedor.telefone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>{fornecedor.telefone}</span>
            </a>
          )}
          {fornecedor.email && (
            <a 
              href={`mailto:${fornecedor.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="truncate">{fornecedor.email}</span>
            </a>
          )}
          {fornecedor.endereco && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{fornecedor.endereco}</span>
            </div>
          )}
        </div>

        {/* Avaliação */}
        {fornecedor.avaliacao && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avaliação</span>
              <AvaliacaoStars value={fornecedor.avaliacao} readonly size="sm" />
            </div>
          </div>
        )}

        {/* Total de pagamentos */}
        {typeof fornecedor.total_pagamentos === 'number' && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Pago</span>
              <span className="font-semibold text-primary">
                {formatCurrency(fornecedor.total_pagamentos)}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Link href={`/fornecedores/${fornecedor.id}`} className="w-full">
          <Button variant="outline" className="w-full gap-2">
            <ExternalLink className="h-4 w-4" />
            Ver Detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

