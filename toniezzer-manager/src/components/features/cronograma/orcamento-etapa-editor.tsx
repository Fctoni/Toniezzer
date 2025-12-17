"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, BarChart3 } from "lucide-react";
import { OrcamentoDetalhamentoDialog } from "./orcamento-detalhamento-dialog";

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  orcamento: number | null;
  gasto_realizado: number;
  tem_detalhamento: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface OrcamentoEtapaEditorProps {
  etapas: Etapa[];
  categorias: Categoria[];
  orcamentoTotal: number;
}

export function OrcamentoEtapaEditor({
  etapas: etapasIniciais,
  categorias,
  orcamentoTotal: totalInicial,
}: OrcamentoEtapaEditorProps) {
  const router = useRouter();
  const [etapas, setEtapas] = useState(etapasIniciais);
  const [isSaving, setIsSaving] = useState(false);
  const [etapaDetalhamento, setEtapaDetalhamento] = useState<Etapa | null>(null);

  useEffect(() => {
    setEtapas(etapasIniciais);
  }, [etapasIniciais]);

  const orcamentoTotal = etapas.reduce(
    (acc, etapa) => acc + (Number(etapa.orcamento) || 0),
    0
  );

  const gastoTotal = etapas.reduce((acc, etapa) => acc + etapa.gasto_realizado, 0);

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
    setEtapas((prev) =>
      prev.map((etapa) =>
        etapa.id === id ? { ...etapa, orcamento: valorNumerico } : etapa
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      for (const etapa of etapas) {
        await supabase
          .from("etapas")
          .update({ orcamento: etapa.orcamento })
          .eq("id", etapa.id);
      }

      toast.success("Orçamentos atualizados!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao salvar orçamentos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetalhamentoSuccess = () => {
    router.refresh();
    setEtapaDetalhamento(null);
  };

  return (
    <>
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

        {/* Lista de Etapas */}
        <div className="space-y-4">
          {etapas.map((etapa) => {
            const percentual = etapa.orcamento
              ? (etapa.gasto_realizado / Number(etapa.orcamento)) * 100
              : 0;
            const status =
              percentual >= 100 ? "over" : percentual >= 80 ? "warning" : "ok";

            return (
              <div
                key={etapa.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{etapa.nome}</span>
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
                    {etapa.tem_detalhamento && (
                      <Badge variant="secondary" className="text-xs">
                        📊 Detalhado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Gasto</p>
                      <p className="font-medium">
                        {formatCurrency(etapa.gasto_realizado)}
                      </p>
                    </div>
                    <div className="w-40">
                      <p className="text-sm text-muted-foreground mb-1">Orçamento</p>
                      <Input
                        value={
                          etapa.orcamento
                            ? Number(etapa.orcamento).toLocaleString("pt-BR")
                            : ""
                        }
                        onChange={(e) =>
                          handleOrcamentoChange(etapa.id, e.target.value)
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEtapaDetalhamento(etapa)}
                      disabled={!etapa.orcamento || etapa.orcamento === 0}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Detalhar
                    </Button>
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

      {/* Modal de Detalhamento */}
      {etapaDetalhamento && (
        <OrcamentoDetalhamentoDialog
          open={!!etapaDetalhamento}
          onOpenChange={(open) => !open && setEtapaDetalhamento(null)}
          etapa={etapaDetalhamento}
          categorias={categorias}
          onSuccess={handleDetalhamentoSuccess}
        />
      )}
    </>
  );
}

