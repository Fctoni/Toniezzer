'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tags } from 'lucide-react'

export default function CategoriasPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Categorias
        </CardTitle>
        <CardDescription>
          Gerencie as categorias de gastos e compras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center text-muted-foreground">
          <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Funcionalidade em desenvolvimento</p>
          <p className="text-sm mt-1">Em breve voce podera gerenciar categorias aqui.</p>
        </div>
      </CardContent>
    </Card>
  )
}
