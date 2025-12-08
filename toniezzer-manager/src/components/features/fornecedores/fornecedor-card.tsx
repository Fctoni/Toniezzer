"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/types/database";
import {
  Building2,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Wrench,
  Package,
} from "lucide-react";

interface FornecedorCardProps {
  fornecedor: Tables<"fornecedores">;
}

export function FornecedorCard({ fornecedor }: FornecedorCardProps) {
  const isPrestador = fornecedor.tipo === "prestador_servico";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                isPrestador
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {isPrestador ? (
                <Wrench className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {fornecedor.nome}
              </h3>
              <Badge variant="outline" className="text-[10px] mt-1">
                {isPrestador ? "Prestador de Serviço" : "Fornecedor de Material"}
              </Badge>
            </div>
          </div>
          {fornecedor.avaliacao && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{fornecedor.avaliacao}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fornecedor.especialidade && (
          <p className="text-sm text-muted-foreground">
            {fornecedor.especialidade}
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {fornecedor.telefone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{fornecedor.telefone}</span>
            </div>
          )}
          {fornecedor.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{fornecedor.email}</span>
            </div>
          )}
          {fornecedor.cnpj_cpf && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{fornecedor.cnpj_cpf}</span>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
          <Link href={`/fornecedores/${fornecedor.id}`}>
            Ver detalhes
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

