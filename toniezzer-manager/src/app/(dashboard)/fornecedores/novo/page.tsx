"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FornecedorForm } from "@/components/features/fornecedores/fornecedor-form";
import { Users } from "lucide-react";

export default function NovoFornecedorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Novo Fornecedor
        </h1>
        <p className="text-muted-foreground">
          Cadastre um novo fornecedor ou prestador de serviço
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Dados do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <FornecedorForm />
        </CardContent>
      </Card>
    </div>
  );
}

