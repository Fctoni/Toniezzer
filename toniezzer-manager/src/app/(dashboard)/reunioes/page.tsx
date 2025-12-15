import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReuniaoCard } from "@/components/features/reunioes";
import { ReunioesFilters } from "@/components/features/reunioes/reunioes-filters";
import { Plus, FileText } from "lucide-react";
import type { Tables } from "@/lib/types/database";

type ReuniaoComContagem = Tables<"reunioes"> & {
  acoes_count: number;
  acoes_pendentes: number;
  created_by_user: { nome_completo: string } | null;
};

export default async function ReunioesPage() {
  const supabase = await createClient();

  // Buscar reuniões com contagem de ações
  const { data, error } = await supabase
    .from("reunioes")
    .select(
      `
      *,
      created_by_user:users!reunioes_created_by_fkey(nome_completo),
      reunioes_acoes(id, status)
    `
    )
    .order("data_reuniao", { ascending: false });

  if (error) {
    console.error("Erro ao carregar reuniões:", error);
  }

  // Processar dados para adicionar contagens
  const reunioes: ReuniaoComContagem[] = (data || []).map((r) => ({
    ...r,
    acoes_count: r.reunioes_acoes?.length || 0,
    acoes_pendentes:
      r.reunioes_acoes?.filter(
        (a: { status: string }) =>
          a.status === "pendente" || a.status === "em_andamento"
      ).length || 0,
    created_by_user: r.created_by_user,
  }));

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Reuniões
          </h1>
          <p className="text-muted-foreground">
            Resumos e ações extraídas das reuniões
          </p>
        </div>
        <Button asChild>
          <Link href="/reunioes/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Reunião
          </Link>
        </Button>
      </div>

      {/* Filters and List */}
      <ReunioesFilters reunioes={reunioes} />
    </div>
  );
}
