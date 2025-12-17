"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Trash2,
  Loader2,
  Calendar,
  LayoutGrid,
  GitBranch,
  Columns,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tag,
  FileImage,
  Pencil,
  X,
  Plus,
  Save,
} from "lucide-react";
import Image from "next/image";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Importar componentes de visualizacao
import { GaleriaGrid } from "./galeria-grid";
import { GaleriaTimeline } from "./galeria-timeline";
import { GaleriaEtapas } from "./galeria-etapas";
import { GaleriaComparacao } from "./galeria-comparacao";
import { FotoFullscreenModal } from "./foto-fullscreen-modal";
import { useMobile } from "@/lib/hooks/use-media-query";

interface Foto {
  id: string;
  nome: string;
  url: string;
  created_at: string;
  etapa_relacionada_id: string | null;
  etapas: { nome: string } | null;
  tags: string[];
  tamanho_bytes: number | null;
}

interface Etapa {
  id: string;
  nome: string;
}

interface GaleriaFotosProps {
  fotos: Foto[];
  etapas: Etapa[];
}

export function GaleriaFotos({ fotos, etapas }: GaleriaFotosProps) {
  const router = useRouter();
  const isMobile = useMobile();
  
  // Estados de filtro
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [filtroTag, setFiltroTag] = useState<string>("todas");
  
  // Estados do modal
  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);
  const [fotoParaExcluir, setFotoParaExcluir] = useState<Foto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de edicao
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editData, setEditData] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editEtapa, setEditEtapa] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Funcoes de edicao
  const iniciarEdicao = () => {
    if (fotoSelecionada) {
      setEditNome(fotoSelecionada.nome);
      setEditData(fotoSelecionada.created_at.split("T")[0]);
      setEditTags(fotoSelecionada.tags || []);
      setEditEtapa(fotoSelecionada.etapa_relacionada_id || "");
      setModoEdicao(true);
    }
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setEditNome("");
    setEditData("");
    setEditTags([]);
    setEditTagInput("");
    setEditEtapa("");
  };

  const adicionarTag = () => {
    const tag = editTagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setEditTagInput("");
    }
  };

  const removerTag = (tagParaRemover: string) => {
    setEditTags(editTags.filter((t) => t !== tagParaRemover));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarTag();
    }
  };

  const salvarEdicao = async () => {
    if (!fotoSelecionada) return;

    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("documentos")
        .update({
          nome: editNome,
          created_at: new Date(editData + "T12:00:00").toISOString(),
          tags: editTags.length > 0 ? editTags : null,
          etapa_relacionada_id: editEtapa || null,
        })
        .eq("id", fotoSelecionada.id);

      if (error) throw error;

      toast.success("Foto atualizada com sucesso");
      setModoEdicao(false);
      setFotoSelecionada(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar foto");
    } finally {
      setIsSaving(false);
    }
  };

  // Extrair todas as tags unicas
  const todasTags = useMemo(() => {
    const tags = new Set<string>();
    fotos.forEach((f) => f.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [fotos]);

  // Filtrar fotos
  const fotosFiltradas = useMemo(() => {
    return fotos.filter((foto) => {
      // Filtro por etapa
      if (filtroEtapa !== "todas" && foto.etapa_relacionada_id !== filtroEtapa) {
        return false;
      }

      // Filtro por tag
      if (filtroTag !== "todas" && !foto.tags?.includes(filtroTag)) {
        return false;
      }

      // Filtro por data inicio
      if (dataInicio) {
        const fotoDate = parseISO(foto.created_at);
        const inicioDate = startOfDay(parseISO(dataInicio));
        if (isBefore(fotoDate, inicioDate)) {
          return false;
        }
      }

      // Filtro por data fim
      if (dataFim) {
        const fotoDate = parseISO(foto.created_at);
        const fimDate = endOfDay(parseISO(dataFim));
        if (isAfter(fotoDate, fimDate)) {
          return false;
        }
      }

      return true;
    });
  }, [fotos, filtroEtapa, filtroTag, dataInicio, dataFim]);

  // Navegacao entre fotos no modal
  const fotoAtualIndex = fotoSelecionada
    ? fotosFiltradas.findIndex((f) => f.id === fotoSelecionada.id)
    : -1;
  const temFotoAnterior = fotoAtualIndex > 0;
  const temProximaFoto = fotoAtualIndex < fotosFiltradas.length - 1;

  const irParaFotoAnterior = () => {
    if (temFotoAnterior) {
      setFotoSelecionada(fotosFiltradas[fotoAtualIndex - 1]);
    }
  };

  const irParaProximaFoto = () => {
    if (temProximaFoto) {
      setFotoSelecionada(fotosFiltradas[fotoAtualIndex + 1]);
    }
  };

  const handleDelete = async (foto: Foto) => {
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const urlParts = foto.url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      await supabase.storage.from("fotos-obra").remove([fileName]);

      const { error } = await supabase.from("documentos").delete().eq("id", foto.id);

      if (error) throw error;

      toast.success("Foto excluida com sucesso");
      setFotoParaExcluir(null);
      setFotoSelecionada(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir foto");
    } finally {
      setIsDeleting(false);
    }
  };

  const limparFiltros = () => {
    setFiltroEtapa("todas");
    setFiltroTag("todas");
    setDataInicio("");
    setDataFim("");
  };

  const temFiltrosAtivos =
    filtroEtapa !== "todas" || filtroTag !== "todas" || dataInicio || dataFim;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Tamanho desconhecido";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (fotos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhuma foto encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Faca upload de fotos para visualizar a galeria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Etapa</Label>
          <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as etapas</SelectItem>
              {etapas.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tag</Label>
          <Select value={filtroTag} onValueChange={setFiltroTag}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as tags</SelectItem>
              {todasTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data inicial</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-[150px] pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data final</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-[150px] pl-9"
            />
          </div>
        </div>

        {temFiltrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {fotosFiltradas.length} de {fotos.length} foto(s)
        </div>
      </div>

      {/* Abas de Visualizacao */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="etapas" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Por Etapa</span>
          </TabsTrigger>
          <TabsTrigger value="comparacao" className="gap-2">
            <Columns className="h-4 w-4" />
            <span className="hidden sm:inline">Antes/Depois</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <GaleriaTimeline fotos={fotosFiltradas} onFotoClick={setFotoSelecionada} />
        </TabsContent>

        <TabsContent value="etapas">
          <GaleriaEtapas
            fotos={fotosFiltradas}
            etapas={etapas}
            onFotoClick={setFotoSelecionada}
          />
        </TabsContent>

        <TabsContent value="comparacao">
          <GaleriaComparacao
            fotos={fotosFiltradas}
            etapas={etapas}
            onFotoClick={setFotoSelecionada}
          />
        </TabsContent>

        <TabsContent value="grid">
          <GaleriaGrid fotos={fotosFiltradas} onFotoClick={setFotoSelecionada} />
        </TabsContent>
      </Tabs>

      {/* Modal de Visualizacao (Desktop only) */}
      <Dialog
        open={!!fotoSelecionada && !isMobile}
        onOpenChange={() => {
          setFotoSelecionada(null);
          cancelarEdicao();
        }}
      >
        <DialogContent className="max-w-4xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              {modoEdicao ? (
                <span className="text-primary">Editando foto</span>
              ) : (
                <span className="truncate max-w-[300px]">{fotoSelecionada?.nome}</span>
              )}
              <div className="flex gap-2">
                {!modoEdicao && (
                  <>
                    <Button variant="outline" size="sm" onClick={iniciarEdicao}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {fotoSelecionada?.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={fotoSelecionada.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => fotoSelecionada && setFotoParaExcluir(fotoSelecionada)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </>
                )}
                {modoEdicao && (
                  <>
                    <Button variant="ghost" size="sm" onClick={cancelarEdicao} disabled={isSaving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={salvarEdicao} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Imagem com navegacao */}
          <div className="relative min-w-0 w-full">
            <div className="flex items-center justify-center bg-muted rounded-lg p-2 min-w-0">
              {fotoSelecionada?.url ? (
                <img
                  src={fotoSelecionada.url}
                  alt={fotoSelecionada.nome}
                  className="rounded max-h-[55vh] max-w-full h-auto w-auto object-contain"
                />
              ) : (
                <div className="flex items-center justify-center py-20">
                  <p className="text-muted-foreground">Imagem nao disponivel</p>
                </div>
              )}
            </div>

            {/* Botoes de navegacao (so quando nao esta editando) */}
            {!modoEdicao && temFotoAnterior && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                onClick={irParaFotoAnterior}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {!modoEdicao && temProximaFoto && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                onClick={irParaProximaFoto}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Modo Edicao */}
          {modoEdicao ? (
            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da foto</Label>
                <Input
                  id="edit-nome"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome da foto"
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="edit-data">Data</Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                />
              </div>

              {/* Etapa */}
              <div className="space-y-2">
                <Label>Etapa relacionada</Label>
                <Select value={editEtapa || "sem-etapa"} onValueChange={(v) => setEditEtapa(v === "sem-etapa" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-etapa">Sem etapa</SelectItem>
                    {etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma tag e pressione Enter"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={adicionarTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removerTag(tag)}
                          className="ml-1 hover:text-destructive rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Sugestoes: antes, depois, fachada, fundacao, acabamento
                </p>
              </div>
            </div>
          ) : (
            /* Modo Visualizacao */
            <>
              {/* Informacoes detalhadas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {fotoSelecionada &&
                        format(new Date(fotoSelecionada.created_at), "dd/MM/yyyy 'as' HH:mm", {
                          locale: ptBR,
                        })}
                    </span>
                  </div>
                  {fotoSelecionada?.etapas && (
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{fotoSelecionada.etapas.nome}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatFileSize(fotoSelecionada?.tamanho_bytes ?? null)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {fotoSelecionada?.tags && fotoSelecionada.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {fotoSelecionada.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contador de navegacao */}
              <div className="text-center text-sm text-muted-foreground">
                Foto {fotoAtualIndex + 1} de {fotosFiltradas.length}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmacao de Exclusao */}
      <AlertDialog open={!!fotoParaExcluir} onOpenChange={() => setFotoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a foto &quot;{fotoParaExcluir?.nome}&quot;? Esta
              acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fotoParaExcluir && handleDelete(fotoParaExcluir)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Fullscreen Mobile */}
      {isMobile && (
        <FotoFullscreenModal
          foto={fotoSelecionada}
          fotos={fotosFiltradas}
          onClose={() => {
            setFotoSelecionada(null);
            cancelarEdicao();
          }}
          onDelete={(foto) => setFotoParaExcluir(foto)}
          onNavigate={setFotoSelecionada}
        />
      )}
    </div>
  );
}
