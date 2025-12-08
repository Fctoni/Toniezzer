"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  orcamento: number | null;
  gasto_realizado: number;
}

interface OrcamentoEditorProps {
  categorias: Categoria[];
  orcamentoTotal: number;
}

export function OrcamentoEditor({
  categorias: categoriasIniciais,
  orcamentoTotal: totalInicial,
}: OrcamentoEditorProps) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(categoriasIniciais);
  const [isSaving, setIsSaving] = useState(false);

  const orcamentoTotal = categorias.reduce(
    (acc, cat) => acc + (Number(cat.orcamento) || 0),
    0
  );

  const gastoTotal = categorias.reduce((acc, cat) => acc + cat.gasto_realizado, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const parseCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return parseInt(numbers || "0");
  };

  const handleOrcamentoChange = (id: string, value: string) => {
    const valorNumerico = parseCurrency(value);
    setCategorias((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, orcamento: valorNumerico } : cat
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      for (const cat of categorias) {
        await supabase
          .from("categorias")
          .update({ orcamento: cat.orcamento })
          .eq("id", cat.id);
      }

      toast.success("Orçamentos atualizados!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao salvar orçamentos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3 p-4 rounded-lg bg-muted/30">
        <div>
          <p className="text-sm text-muted-foreground">Orçamento Total</p>
          <p className="text-2xl font-bold">{formatCurrency(orcamentoTotal)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Gasto Total</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(gastoTotal)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saldo Restante</p>
          <p
            className={`text-2xl font-bold ${
              orcamentoTotal - gastoTotal < 0 ? "text-destructive" : "text-green-500"
            }`}
          >
            {formatCurrency(orcamentoTotal - gastoTotal)}
          </p>
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="space-y-4">
        {categorias.map((cat) => {
          const percentual = cat.orcamento
            ? (cat.gasto_realizado / Number(cat.orcamento)) * 100
            : 0;
          const status =
            percentual >= 100 ? "over" : percentual >= 80 ? "warning" : "ok";

          return (
            <div
              key={cat.id}
              className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.cor }}
                  />
                  <span className="font-medium">{cat.nome}</span>
                  {status === "over" && (
                    <Badge variant="destructive" className="text-xs">
                      Estourado
                    </Badge>
                  )}
                  {status === "warning" && (
                    <Badge
                      variant="outline"
                      className="text-xs border-yellow-500 text-yellow-500"
                    >
                      80%+
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Gasto</p>
                    <p className="font-medium">
                      {formatCurrency(cat.gasto_realizado)}
                    </p>
                  </div>
                  <div className="w-40">
                    <p className="text-sm text-muted-foreground mb-1">Orçamento</p>
                    <Input
                      value={
                        cat.orcamento
                          ? Number(cat.orcamento).toLocaleString("pt-BR")
                          : ""
                      }
                      onChange={(e) =>
                        handleOrcamentoChange(cat.id, e.target.value)
                      }
                      placeholder="0"
                      className="h-8 text-right"
                    />
                  </div>
                </div>
              </div>
              <Progress
                value={Math.min(percentual, 100)}
                className={`h-2 ${
                  status === "over"
                    ? "[&>div]:bg-destructive"
                    : status === "warning"
                    ? "[&>div]:bg-yellow-500"
                    : ""
                }`}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {percentual.toFixed(0)}% utilizado
              </p>
            </div>
          );
        })}
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

