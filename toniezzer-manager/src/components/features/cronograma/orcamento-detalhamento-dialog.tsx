"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Etapa {
  id: string;
  nome: string;
  orcamento: number | null;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface DetalhamentoItem {
  categoria_id: string;
  valor_previsto: number;
  observacoes?: string;
}

interface OrcamentoDetalhamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapa: Etapa;
  categorias: Categoria[];
  onSuccess: () => void;
}

export function OrcamentoDetalhamentoDialog({
  open,
  onOpenChange,
  etapa,
  categorias,
  onSuccess,
}: OrcamentoDetalhamentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [detalhamentoExistente, setDetalhamentoExistente] = useState<DetalhamentoItem[]>([]);

  const orcamentoTotal = Number(etapa.orcamento) || 0;

  useEffect(() => {
    if (open && etapa.id) {
      fetchDetalhamento();
    }
  }, [open, etapa.id]);

  const fetchDetalhamento = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orcamento/detalhamento?etapa_id=${etapa.id}`);
      if (!response.ok) throw new Error("Erro ao buscar detalhamento");

      const data = await response.json();
      const detalhamento = data.detalhamento || [];
      setDetalhamentoExistente(detalhamento);

      // Preencher valores existentes
      const valoresIniciais: Record<string, number> = {};
      detalhamento.forEach((item: any) => {
        valoresIniciais[item.categoria_id] = item.valor_previsto;
      });
      setValores(valoresIniciais);
    } catch (error) {
      console.error("Erro ao buscar detalhamento:", error);
      toast.error("Erro ao carregar detalhamento");
    } finally {
      setLoading(false);
    }
  };

  const handleValorChange = (categoriaId: string, value: string) => {
    const valorNumerico = parseCurrency(value);
    setValores((prev) => ({
      ...prev,
      [categoriaId]: valorNumerico,
    }));
  };

  const parseCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return parseInt(numbers || "0");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Calcular soma total dos valores preenchidos
  const somaAtual = Object.values(valores).reduce((acc, val) => acc + (val || 0), 0);
  const diferenca = somaAtual - orcamentoTotal;
  const isValid = diferenca === 0;
  const temValores = Object.values(valores).some((v) => v > 0);

  const handleSalvar = async () => {
    if (!isValid) {
      toast.error("A soma dos valores deve ser igual ao orçamento total da etapa");
      return;
    }

    if (!temValores) {
      toast.error("Preencha pelo menos uma categoria");
      return;
    }

    setSaving(true);

    try {
      // Preparar array de detalhamento
      const detalhamento = Object.entries(valores)
        .filter(([_, valor]) => valor > 0)
        .map(([categoria_id, valor_previsto]) => ({
          categoria_id,
          valor_previsto,
        }));

      const response = await fetch("/api/orcamento/detalhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapa_id: etapa.id,
          detalhamento,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      toast.success("Detalhamento salvo com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar detalhamento:", error);
      toast.error("Erro ao salvar detalhamento");
    } finally {
      setSaving(false);
    }
  };

  const handleLimpar = async () => {
    if (!confirm("Deseja realmente limpar o detalhamento desta etapa?")) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/orcamento/detalhamento?etapa_id=${etapa.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Erro ao limpar");

      toast.success("Detalhamento limpo com sucesso!");
      setValores({});
      onSuccess();
    } catch (error) {
      console.error("Erro ao limpar detalhamento:", error);
      toast.error("Erro ao limpar detalhamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDistribuirUniforme = () => {
    const categoriasAtivas = categorias.filter((cat) => !valores[cat.id] || valores[cat.id] === 0);
    if (categoriasAtivas.length === 0) {
      toast.error("Todas as categorias já têm valores definidos");
      return;
    }

    const valorRestante = orcamentoTotal - somaAtual;
    const valorPorCategoria = Math.floor(valorRestante / categoriasAtivas.length);
    const resto = valorRestante % categoriasAtivas.length;

    const novosValores = { ...valores };
    categoriasAtivas.forEach((cat, index) => {
      const valor = valorPorCategoria + (index === 0 ? resto : 0);
      novosValores[cat.id] = valor;
    });

    setValores(novosValores);
    toast.success("Valores distribuídos uniformemente");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhar Orçamento: {etapa.nome}</DialogTitle>
          <DialogDescription>
            Distribua o orçamento total de <strong>{formatCurrency(orcamentoTotal)}</strong> entre
            as categorias
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Alert de Validação */}
            <div className="space-y-2">
              {isValid && temValores ? (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Soma correta! Pronto para salvar.
                  </AlertDescription>
                </Alert>
              ) : diferenca !== 0 && temValores ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {diferenca > 0 ? (
                      <>
                        Soma excede em <strong>{formatCurrency(diferenca)}</strong>. Ajuste os
                        valores.
                      </>
                    ) : (
                      <>
                        Faltam <strong>{formatCurrency(Math.abs(diferenca))}</strong> para completar
                        o orçamento.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    Preencha os valores por categoria. A soma deve ser exatamente{" "}
                    {formatCurrency(orcamentoTotal)}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Orçamento Total</p>
                  <p className="text-lg font-bold">{formatCurrency(orcamentoTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Soma Atual</p>
                  <p
                    className={`text-lg font-bold ${
                      diferenca === 0 ? "text-green-500" : "text-destructive"
                    }`}
                  >
                    {formatCurrency(somaAtual)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {diferenca >= 0 ? "Diferença" : "Faltando"}
                  </p>
                  <p className={`text-lg font-bold ${diferenca === 0 ? "text-green-500" : ""}`}>
                    {formatCurrency(Math.abs(diferenca))}
                  </p>
                </div>
              </div>
            </div>

            {/* Botão Distribuir */}
            {somaAtual < orcamentoTotal && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleDistribuirUniforme}>
                  Distribuir Restante Uniformemente
                </Button>
              </div>
            )}

            {/* Tabela de Categorias */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Categoria</TableHead>
                    <TableHead className="w-[30%]">Valor Previsto</TableHead>
                    <TableHead className="w-[30%]">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => {
                    const valor = valores[categoria.id] || 0;
                    const percentual = orcamentoTotal > 0 ? (valor / orcamentoTotal) * 100 : 0;

                    return (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: categoria.cor }}
                            />
                            <span className="font-medium">{categoria.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={valor > 0 ? valor.toLocaleString("pt-BR") : ""}
                            onChange={(e) => handleValorChange(categoria.id, e.target.value)}
                            placeholder="0"
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          {valor > 0 ? (
                            <Badge variant="outline">{percentual.toFixed(1)}%</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {detalhamentoExistente.length > 0 && (
              <Button
                variant="outline"
                onClick={handleLimpar}
                disabled={saving || loading}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Detalhamento
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={!isValid || !temValores || saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Salvar Detalhamento"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

