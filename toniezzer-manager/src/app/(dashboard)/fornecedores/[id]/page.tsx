"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/types/database";
import { buscarFornecedorPorId, atualizarAvaliacao, desativarFornecedor } from "@/lib/services/fornecedores";
import { buscarGastosPorFornecedor } from "@/lib/services/gastos";
import { parseDateString } from "@/lib/utils";
import { AvaliacaoStars } from "@/components/features/fornecedores/avaliacao-stars";
import { FornecedorForm } from "@/components/features/fornecedores/fornecedor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Phone,
  Mail,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  DollarSign,
  Wrench,
  Package,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type Gasto = Tables<"gastos"> & {
  categoria?: Tables<"categorias"> | null;
};

export default function FornecedorDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [fornecedor, setFornecedor] = useState<Tables<"fornecedores"> | null>(
    null
  );
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [avaliacao, setAvaliacao] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [savingAvaliacao, setSavingAvaliacao] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();

      const [fornecedorData, gastosData] = await Promise.all([
        buscarFornecedorPorId(supabase, id),
        buscarGastosPorFornecedor(supabase, id),
      ]);

      setFornecedor(fornecedorData);
      setAvaliacao(fornecedorData.avaliacao);
      setComentario(fornecedorData.comentario_avaliacao || "");
      setGastos(gastosData);
    } catch (error) {
      console.error("Erro ao buscar dados do fornecedor:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAvaliacao = async () => {
    if (!avaliacao) {
      toast.error("Selecione uma avaliação");
      return;
    }

    setSavingAvaliacao(true);

    try {
      const supabase = createClient();
      await atualizarAvaliacao(supabase, id, avaliacao, comentario || null);

      toast.success("Avaliação salva!");
      fetchData();
    } catch {
      toast.error("Erro ao salvar avaliação");
    } finally {
      setSavingAvaliacao(false);
    }
  };

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      await desativarFornecedor(supabase, id);

      toast.success("Fornecedor excluído!");
      router.push("/fornecedores");
    } catch {
      toast.error("Erro ao excluir fornecedor");
    }
  };

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.valor), 0);
  const isPrestador = fornecedor?.tipo === "prestador_servico";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!fornecedor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Fornecedor não encontrado</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/fornecedores">Voltar para lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fornecedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                isPrestador
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {isPrestador ? (
                <Wrench className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {fornecedor.nome}
              </h1>
              <Badge variant="outline" className="text-xs">
                {isPrestador ? "Prestador de Serviço" : "Fornecedor de Material"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Fornecedor</DialogTitle>
              </DialogHeader>
              <FornecedorForm
                fornecedor={fornecedor}
                onSuccess={() => {
                  setEditDialogOpen(false);
                  fetchData();
                }}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este fornecedor? Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fornecedor.especialidade && (
              <div>
                <p className="text-sm text-muted-foreground">Especialidade</p>
                <p className="font-medium">{fornecedor.especialidade}</p>
              </div>
            )}

            <div className="space-y-2">
              {fornecedor.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{fornecedor.telefone}</span>
                </div>
              )}
              {fornecedor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{fornecedor.email}</span>
                </div>
              )}
              {fornecedor.cnpj_cpf && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{fornecedor.cnpj_cpf}</span>
                </div>
              )}
              {fornecedor.endereco && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{fornecedor.endereco}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avaliação */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Clique para avaliar
              </p>
              <AvaliacaoStars
                value={avaliacao}
                onChange={setAvaliacao}
                size="lg"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Comentário</p>
              <Textarea
                placeholder="Adicione um comentário sobre este fornecedor..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSaveAvaliacao}
              disabled={!avaliacao || savingAvaliacao}
              className="w-full"
            >
              {savingAvaliacao ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pagamentos */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Histórico de Pagamentos
            </span>
            <Badge variant="secondary">
              Total: R$ {totalGastos.toLocaleString("pt-BR")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gastos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nenhum pagamento registrado para este fornecedor
            </p>
          ) : (
            <div className="space-y-3">
              {gastos.map((gasto) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{gasto.descricao}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {parseDateString(gasto.data).toLocaleDateString("pt-BR")}
                      </span>
                      {gasto.categoria && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: gasto.categoria.cor,
                              color: gasto.categoria.cor,
                            }}
                          >
                            {gasto.categoria.nome}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold">
                    R$ {Number(gasto.valor).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

