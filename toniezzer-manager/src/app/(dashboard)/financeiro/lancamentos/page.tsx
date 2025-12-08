import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Download } from "lucide-react";
import Link from "next/link";
import { LancamentosTable } from "@/components/features/financeiro/lancamentos-table";

export default async function LancamentosPage() {
  const supabase = await createClient();

  const { data: gastos } = await supabase
    .from("gastos")
    .select(
      `
      *,
      categorias(nome, cor),
      fornecedores(nome),
      etapas(nome)
    `
    )
    .order("data", { ascending: false });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const totalAprovado =
    gastos
      ?.filter((g) => g.status === "aprovado")
      .reduce((acc, g) => acc + Number(g.valor), 0) || 0;

  const totalPendente =
    gastos
      ?.filter((g) => g.status === "pendente_aprovacao")
      .reduce((acc, g) => acc + Number(g.valor), 0) || 0;

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os gastos da obra
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button asChild>
            <Link href="/financeiro/lancamentos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(totalAprovado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatCurrency(totalPendente)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <LancamentosTable gastos={gastos || []} />
        </CardContent>
      </Card>
    </div>
  );
}

