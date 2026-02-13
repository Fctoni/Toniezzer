import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcamentoEtapaEditor } from "@/components/features/cronograma/orcamento-etapa-editor";
import { buscarCategoriasParaDropdown } from "@/lib/services/categorias";
import { buscarGastosPorEtapa } from "@/lib/services/gastos";
import { buscarDetalhamentoPorEtapa } from "@/lib/services/orcamento-detalhado";
import { buscarEtapas } from "@/lib/services/etapas";

export default async function OrcamentoPage() {
  const supabase = await createClient();

  const [
    etapas,
    categorias,
    gastos,
    detalhamentos,
  ] = await Promise.all([
    buscarEtapas(supabase),
    buscarCategoriasParaDropdown(supabase),
    buscarGastosPorEtapa(supabase),
    buscarDetalhamentoPorEtapa(supabase),
  ]);

  // Calcular gastos por etapa
  const etapasComGastos = etapas.map((etapa) => {
    const gasto =
      gastos
        ?.filter((g) => g.etapa_relacionada_id === etapa.id)
        .reduce((acc, g) => acc + Number(g.valor), 0) || 0;

    const temDetalhamento = detalhamentos?.some((d) => d.etapa_id === etapa.id) || false;

    return {
      id: etapa.id,
      nome: etapa.nome,
      ordem: etapa.ordem,
      orcamento: etapa.orcamento,
      gasto_realizado: gasto,
      tem_detalhamento: temDetalhamento,
    };
  });

  const orcamentoTotal = etapasComGastos.reduce(
    (acc, etapa) => acc + (Number(etapa.orcamento) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orçamento</h1>
        <p className="text-muted-foreground">
          Configure o orçamento por etapa da obra
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orçamento por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <OrcamentoEtapaEditor
            etapas={etapasComGastos}
            categorias={categorias || []}
            orcamentoTotal={orcamentoTotal}
          />
        </CardContent>
      </Card>
    </div>
  );
}

