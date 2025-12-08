import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormLancamento } from "@/components/features/financeiro/form-lancamento";

export default async function NovoLancamentoPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: fornecedores }, { data: etapas }] =
    await Promise.all([
      supabase.from("categorias").select("*").eq("ativo", true).order("ordem"),
      supabase.from("fornecedores").select("*").eq("ativo", true).order("nome"),
      supabase.from("etapas").select("*").order("ordem"),
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
          <FormLancamento
            categorias={categorias || []}
            fornecedores={fornecedores || []}
            etapas={etapas || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

