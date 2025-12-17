"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Folder, FolderOpen, ImageIcon } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";

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

interface GaleriaEtapasProps {
  fotos: Foto[];
  etapas: Etapa[];
  onFotoClick: (foto: Foto) => void;
}

interface FotosPorEtapa {
  etapa: Etapa | null;
  fotos: Foto[];
}

export function GaleriaEtapas({ fotos, etapas, onFotoClick }: GaleriaEtapasProps) {
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set(["all"]));

  // Agrupar fotos por etapa
  const fotosAgrupadas = useMemo(() => {
    const grupos: Record<string, Foto[]> = {};

    // Inicializar todas as etapas (mesmo vazias)
    etapas.forEach((etapa) => {
      grupos[etapa.id] = [];
    });
    grupos["sem-etapa"] = [];

    // Distribuir fotos
    fotos.forEach((foto) => {
      const etapaId = foto.etapa_relacionada_id || "sem-etapa";
      if (!grupos[etapaId]) grupos[etapaId] = [];
      grupos[etapaId].push(foto);
    });

    // Converter para array ordenado
    const resultado: FotosPorEtapa[] = etapas.map((etapa) => ({
      etapa,
      fotos: grupos[etapa.id].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));

    // Adicionar "Sem Etapa" se houver fotos
    if (grupos["sem-etapa"].length > 0) {
      resultado.push({
        etapa: null,
        fotos: grupos["sem-etapa"].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      });
    }

    return resultado;
  }, [fotos, etapas]);

  const totalFotos = fotos.length;
  const etapasComFotos = fotosAgrupadas.filter((g) => g.fotos.length > 0).length;
  const totalEtapas = etapas.length;

  const toggleEtapa = (etapaId: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(etapaId)) {
        next.delete(etapaId);
      } else {
        next.add(etapaId);
      }
      return next;
    });
  };

  const expandirTodas = () => {
    setExpandedEtapas(new Set(fotosAgrupadas.map((g) => g.etapa?.id || "sem-etapa")));
  };

  const recolherTodas = () => {
    setExpandedEtapas(new Set());
  };

  if (fotos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma foto encontrada
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Progresso */}
      <div className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold">Progresso da Documentacao</span>
          </div>
          <Badge variant="secondary">
            {etapasComFotos}/{totalEtapas} etapas com fotos
          </Badge>
        </div>
        <Progress value={(etapasComFotos / totalEtapas) * 100} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {totalFotos} foto(s) cadastrada(s) em {etapasComFotos} etapa(s)
        </p>
      </div>

      {/* Linha do tempo horizontal */}
      <div className="bg-card rounded-lg border p-4">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 pb-2 min-w-max">
            {etapas.map((etapa, index) => {
              const qtdFotos = fotosAgrupadas.find((g) => g.etapa?.id === etapa.id)?.fotos.length || 0;
              const temFotos = qtdFotos > 0;

              return (
                <div key={etapa.id} className="flex items-center">
                  {/* Circulo */}
                  <div
                    className={`flex flex-col items-center cursor-pointer group`}
                    onClick={() => toggleEtapa(etapa.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        temFotos
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border-2 border-dashed"
                      } group-hover:scale-110`}
                    >
                      {temFotos ? qtdFotos : "0"}
                    </div>
                    <span className="text-[10px] mt-1 max-w-[60px] truncate text-center">
                      {etapa.nome}
                    </span>
                  </div>
                  {/* Linha conectora */}
                  {index < etapas.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        temFotos ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Botoes de controle */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandirTodas}>
          Expandir todas
        </Button>
        <Button variant="outline" size="sm" onClick={recolherTodas}>
          Recolher todas
        </Button>
      </div>

      {/* Lista de etapas colapsaveis */}
      <div className="space-y-3">
        {fotosAgrupadas.map((grupo) => {
          const etapaId = grupo.etapa?.id || "sem-etapa";
          const isExpanded = expandedEtapas.has(etapaId);
          const temFotos = grupo.fotos.length > 0;

          return (
            <Collapsible
              key={etapaId}
              open={isExpanded}
              onOpenChange={() => toggleEtapa(etapaId)}
            >
              <div className="rounded-lg border bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <FolderOpen className="h-5 w-5 text-primary" />
                      ) : (
                        <Folder className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold">
                        {grupo.etapa?.nome || "Sem Etapa Definida"}
                      </span>
                      <Badge
                        variant={temFotos ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {grupo.fotos.length} foto(s)
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {temFotos ? (
                    <div className="p-4 pt-0 border-t">
                      <ScrollArea className="w-full">
                        <div className="flex gap-3 py-3">
                          {grupo.fotos.map((foto) => (
                            <div
                              key={foto.id}
                              className="flex-shrink-0 space-y-1"
                            >
                              <div
                                className="relative w-24 h-24 rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                onClick={() => onFotoClick(foto)}
                              >
                                {foto.url && (
                                  <Image
                                    src={foto.url}
                                    alt={foto.nome}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                  />
                                )}
                              </div>
                              <p className="text-[10px] text-center text-muted-foreground w-24 truncate">
                                {format(parseISO(foto.created_at), "dd/MM/yy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="p-4 pt-0 border-t">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma foto cadastrada nesta etapa
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

