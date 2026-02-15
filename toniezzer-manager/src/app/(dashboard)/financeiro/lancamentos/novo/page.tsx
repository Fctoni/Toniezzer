import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/features/financeiro/expense-form";
import { fetchActiveCategories } from "@/lib/services/categorias";
import { fetchActiveSuppliers } from "@/lib/services/fornecedores";
import { fetchStages } from "@/lib/services/etapas";

export default async function NovoLancamentoPage() {
  const supabase = await createClient();

  const [categorias, fornecedores, etapas] =
    await Promise.all([
      fetchActiveCategories(supabase),
      fetchActiveSuppliers(supabase),
      fetchStages(supabase),
    ]);

  return (
    <div className="space-y-6 animate-in-up max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Lançamento</h1>
        <p className="text-muted-foreground">
          Registre um novo gasto da obra
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            categorias={categorias || []}
            fornecedores={fornecedores || []}
            etapas={etapas}
          />
        </CardContent>
      </Card>
    </div>
  );
}

