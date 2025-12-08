import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcamentoEditor } from "@/components/features/financeiro/orcamento-editor";

export default async function OrcamentoPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: gastos }] = await Promise.all([
    supabase.from("categorias").select("*").eq("ativo", true).order("ordem"),
    supabase.from("gastos").select("categoria_id, valor").eq("status", "aprovado"),
  ]);

  // Calcular gastos por categoria
  const categoriasComGastos = categorias?.map((cat) => {
    const gasto =
      gastos
        ?.filter((g) => g.categoria_id === cat.id)
        .reduce((acc, g) => acc + Number(g.valor), 0) || 0;
    return { ...cat, gasto_realizado: gasto };
  }) || [];

  const orcamentoTotal = categoriasComGastos.reduce(
    (acc, cat) => acc + (Number(cat.orcamento) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orçamento</h1>
        <p className="text-muted-foreground">
          Configure o orçamento por categoria
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orçamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <OrcamentoEditor
            categorias={categoriasComGastos}
            orcamentoTotal={orcamentoTotal}
          />
        </CardContent>
      </Card>
    </div>
  );
}

