import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Tables } from "@/lib/types/database";
import { FornecedorCard } from "@/components/features/fornecedores/fornecedor-card";
import { Button } from "@/components/ui/button";
import { FornecedoresFilters } from "@/components/features/fornecedores/fornecedores-filters";
import { Users, Plus } from "lucide-react";

export default async function FornecedoresPage() {
  const supabase = await createClient();

  const { data: fornecedores, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  if (error) {
    console.error("Erro ao buscar fornecedores:", error);
  }

  const fornecedoresData = fornecedores || [];
  const totalFornecedores = fornecedoresData.length;
  const prestadores = fornecedoresData.filter(
    (f) => f.tipo === "prestador_servico"
  ).length;
  const materiais = fornecedoresData.filter(
    (f) => f.tipo === "fornecedor_material"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores e prestadores de serviço
          </p>
        </div>
        <Button asChild>
          <Link href="/fornecedores/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-2xl font-bold">{totalFornecedores}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-600">{prestadores}</p>
          <p className="text-sm text-amber-600/70">Prestadores</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-600">{materiais}</p>
          <p className="text-sm text-blue-600/70">Fornecedores</p>
        </div>
      </div>

      {/* Filters and Grid */}
      <FornecedoresFilters fornecedores={fornecedoresData} />
    </div>
  );
}
