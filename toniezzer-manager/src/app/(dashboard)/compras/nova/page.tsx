import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompraForm } from "@/components/features/compras/compra-form";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buscarCategoriasParaDropdown } from "@/lib/services/categorias";
import { buscarFornecedoresParaDropdown } from "@/lib/services/fornecedores";
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";

export default async function NovaCompraPage() {
  const supabase = await createClient();

  // Buscar dados necessários
  const [categorias, fornecedores, etapas] = await Promise.all([
    buscarCategoriasParaDropdown(supabase),
    buscarFornecedoresParaDropdown(supabase),
    buscarEtapasParaDropdown(supabase),
  ]);

  // Verificar se tem fornecedores cadastrados
  const temFornecedores = fornecedores.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/compras">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Compra</h1>
          <p className="text-muted-foreground">
            Registre uma nova compra e suas parcelas
          </p>
        </div>
      </div>

      {/* Alerta se não tem fornecedores */}
      {!temFornecedores && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Você precisa cadastrar pelo menos um fornecedor antes de criar uma
            compra.{" "}
            <Link href="/fornecedores/novo" className="underline font-medium">
              Cadastrar fornecedor
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Formulário */}
      {temFornecedores && (
        <div className="max-w-2xl">
          <CompraForm
            categorias={categorias}
            fornecedores={fornecedores}
            etapas={etapas}
          />
        </div>
      )}
    </div>
  );
}

