"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

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

interface GaleriaTimelineProps {
  fotos: Foto[];
  onFotoClick: (foto: Foto) => void;
}

interface FotosPorDia {
  data: string;
  diaSemana: string;
  fotos: Foto[];
}

interface FotosPorMes {
  mes: string;
  mesAno: string;
  dias: FotosPorDia[];
  totalFotos: number;
}

export function GaleriaTimeline({ fotos, onFotoClick }: GaleriaTimelineProps) {
  // Agrupar fotos por mes e dia
  const fotosAgrupadas = useMemo(() => {
    const grupos: Record<string, Record<string, Foto[]>> = {};

    fotos.forEach((foto) => {
      const data = parseISO(foto.created_at);
      const mesKey = format(data, "yyyy-MM");
      const diaKey = format(data, "yyyy-MM-dd");

      if (!grupos[mesKey]) grupos[mesKey] = {};
      if (!grupos[mesKey][diaKey]) grupos[mesKey][diaKey] = [];
      grupos[mesKey][diaKey].push(foto);
    });

    // Converter para array estruturado
    const resultado: FotosPorMes[] = Object.entries(grupos)
      .sort(([a], [b]) => b.localeCompare(a)) // Mais recente primeiro
      .map(([mesKey, dias]) => {
        const primeiroDia = Object.keys(dias)[0];
        const dataMes = parseISO(primeiroDia);

        const diasArray: FotosPorDia[] = Object.entries(dias)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([diaKey, fotosDia]) => {
            const dataDia = parseISO(diaKey);

            return {
              data: format(dataDia, "dd/MM", { locale: ptBR }),
              diaSemana: format(dataDia, "EEEE", { locale: ptBR }),
              fotos: fotosDia,
            };
          });

        return {
          mes: mesKey,
          mesAno: format(dataMes, "MMMM yyyy", { locale: ptBR }),
          dias: diasArray,
          totalFotos: diasArray.reduce((acc, d) => acc + d.fotos.length, 0),
        };
      });

    return resultado;
  }, [fotos]);

  if (fotos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma foto encontrada
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {fotosAgrupadas.map((mes) => (
        <div key={mes.mes} className="relative">
          {/* Cabecalho do Mes */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold capitalize">{mes.mesAno}</span>
            </div>
            <Badge variant="secondary">{mes.totalFotos} foto(s)</Badge>
          </div>

          {/* Timeline dos dias */}
          <div className="relative pl-8 space-y-6">
            {/* Linha vertical */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

            {mes.dias.map((dia) => (
              <div key={dia.data} className="relative">
                {/* Ponto na linha */}
                <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                {/* Conteudo do dia */}
                <div className="bg-card rounded-lg border p-4 space-y-3">
                  {/* Data e dia da semana */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{dia.data}</span>
                      <span className="text-muted-foreground capitalize">
                        {dia.diaSemana}
                      </span>
                    </div>
                    <Badge variant="outline">{dia.fotos.length} foto(s)</Badge>
                  </div>

                  {/* Fotos em scroll horizontal */}
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-3 pb-2">
                      {dia.fotos.map((foto) => (
                        <div
                          key={foto.id}
                          className="flex-shrink-0 space-y-1"
                        >
                          <div
                            className="relative w-36 h-36 rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                            onClick={() => onFotoClick(foto)}
                          >
                            {foto.url && (
                              <Image
                                src={foto.url}
                                alt={foto.nome}
                                fill
                                className="object-cover"
                                sizes="144px"
                              />
                            )}
                            {/* Overlay com tags e etapa */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                              <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
                                {/* Etapa */}
                                {foto.etapas && (
                                  <Badge className="bg-amber-500/90 text-white text-[10px] px-1.5 py-0">
                                    🏗️ {foto.etapas.nome}
                                  </Badge>
                                )}
                                {/* Tags */}
                                {foto.tags && foto.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {foto.tags.slice(0, 3).map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="bg-black/50 text-white border-white/30 text-[10px] px-1.5 py-0"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                    {foto.tags.length > 3 && (
                                      <Badge
                                        variant="outline"
                                        className="bg-black/50 text-white border-white/30 text-[10px] px-1.5 py-0"
                                      >
                                        +{foto.tags.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Nome no hover */}
                            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs truncate font-medium">
                                {foto.nome}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

