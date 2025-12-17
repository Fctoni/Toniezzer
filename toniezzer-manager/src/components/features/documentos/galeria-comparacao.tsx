"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState, useRef } from "react";

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

interface GaleriaComparacaoProps {
  fotos: Foto[];
  etapas: Etapa[];
  onFotoClick: (foto: Foto) => void;
}

export function GaleriaComparacao({ fotos, etapas, onFotoClick }: GaleriaComparacaoProps) {
  const [fotoAntes, setFotoAntes] = useState<string>("");
  const [fotoDepois, setFotoDepois] = useState<string>("");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [modoVisualizacao, setModoVisualizacao] = useState<"slider" | "lado-a-lado">("slider");
  const containerRef = useRef<HTMLDivElement>(null);

  // Separar fotos por tag "antes" e "depois"
  const { fotosAntes, fotosDepois, todasFotosOrdenadas } = useMemo(() => {
    const antes = fotos.filter((f) => f.tags?.some((t) => t.toLowerCase() === "antes"));
    const depois = fotos.filter((f) => f.tags?.some((t) => t.toLowerCase() === "depois"));
    const todas = [...fotos].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return { fotosAntes: antes, fotosDepois: depois, todasFotosOrdenadas: todas };
  }, [fotos]);

  const fotoAntesSelecionada = fotos.find((f) => f.id === fotoAntes);
  const fotoDepoisSelecionada = fotos.find((f) => f.id === fotoDepois);

  // Se nao houver fotos com tags antes/depois, usar selecao manual
  const usarSelecaoManual = fotosAntes.length === 0 || fotosDepois.length === 0;

  // Verificar se há pares de comparacao disponiveis
  const temComparacaoDisponivel = fotoAntes && fotoDepois;

  return (
    <div className="space-y-6">
      {/* Aviso se nao houver tags */}
      {usarSelecaoManual && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Dica: Use tags para organizar
              </p>
              <p className="text-sm text-muted-foreground">
                Adicione as tags <Badge variant="outline">antes</Badge> e{" "}
                <Badge variant="outline">depois</Badge> nas suas fotos para facilitar comparacoes automaticas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selecao de fotos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Foto ANTES
              {fotosAntes.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {fotosAntes.length} com tag
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={fotoAntes} onValueChange={setFotoAntes}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma foto" />
              </SelectTrigger>
              <SelectContent>
                {(usarSelecaoManual ? todasFotosOrdenadas : fotosAntes).map((foto) => (
                  <SelectItem key={foto.id} value={foto.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{foto.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(foto.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Foto DEPOIS
              {fotosDepois.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {fotosDepois.length} com tag
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={fotoDepois} onValueChange={setFotoDepois}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma foto" />
              </SelectTrigger>
              <SelectContent>
                {(usarSelecaoManual ? todasFotosOrdenadas : fotosDepois).map((foto) => (
                  <SelectItem key={foto.id} value={foto.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{foto.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(foto.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Modo de visualizacao */}
      {temComparacaoDisponivel && (
        <div className="flex justify-center gap-2">
          <Button
            variant={modoVisualizacao === "slider" ? "default" : "outline"}
            size="sm"
            onClick={() => setModoVisualizacao("slider")}
          >
            Slider
          </Button>
          <Button
            variant={modoVisualizacao === "lado-a-lado" ? "default" : "outline"}
            size="sm"
            onClick={() => setModoVisualizacao("lado-a-lado")}
          >
            Lado a lado
          </Button>
        </div>
      )}

      {/* Area de comparacao */}
      {temComparacaoDisponivel ? (
        modoVisualizacao === "slider" ? (
          <Card>
            <CardContent className="p-4">
              {/* Comparador Slider */}
              <div
                ref={containerRef}
                className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden"
              >
                {/* Imagem DEPOIS (fundo) */}
                {fotoDepoisSelecionada?.url && (
                  <Image
                    src={fotoDepoisSelecionada.url}
                    alt="Depois"
                    fill
                    className="object-contain"
                  />
                )}

                {/* Imagem ANTES (clip) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  {fotoAntesSelecionada?.url && (
                    <Image
                      src={fotoAntesSelecionada.url}
                      alt="Antes"
                      fill
                      className="object-contain"
                    />
                  )}
                </div>

                {/* Linha divisoria */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <ChevronLeft className="h-4 w-4 absolute left-0.5" />
                    <ChevronRight className="h-4 w-4 absolute right-0.5" />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-500">ANTES</Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500">DEPOIS</Badge>
                </div>
              </div>

              {/* Controle do slider */}
              <div className="mt-4 px-4">
                <Slider
                  value={[sliderPosition]}
                  onValueChange={([value]) => setSliderPosition(value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Info das fotos */}
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <div className="text-center">
                  <p className="font-medium text-foreground">{fotoAntesSelecionada?.nome}</p>
                  <p>
                    {fotoAntesSelecionada &&
                      format(parseISO(fotoAntesSelecionada.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                  </p>
                  {fotoAntesSelecionada?.etapas && (
                    <Badge variant="outline" className="mt-1">
                      {fotoAntesSelecionada.etapas.nome}
                    </Badge>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 self-center" />
                <div className="text-center">
                  <p className="font-medium text-foreground">{fotoDepoisSelecionada?.nome}</p>
                  <p>
                    {fotoDepoisSelecionada &&
                      format(parseISO(fotoDepoisSelecionada.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                  </p>
                  {fotoDepoisSelecionada?.etapas && (
                    <Badge variant="outline" className="mt-1">
                      {fotoDepoisSelecionada.etapas.nome}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Modo lado a lado */
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  ANTES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => fotoAntesSelecionada && onFotoClick(fotoAntesSelecionada)}
                >
                  {fotoAntesSelecionada?.url && (
                    <Image
                      src={fotoAntesSelecionada.url}
                      alt="Antes"
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="mt-2 text-center text-sm">
                  <p className="font-medium">{fotoAntesSelecionada?.nome}</p>
                  <p className="text-muted-foreground">
                    {fotoAntesSelecionada &&
                      format(parseISO(fotoAntesSelecionada.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  DEPOIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => fotoDepoisSelecionada && onFotoClick(fotoDepoisSelecionada)}
                >
                  {fotoDepoisSelecionada?.url && (
                    <Image
                      src={fotoDepoisSelecionada.url}
                      alt="Depois"
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="mt-2 text-center text-sm">
                  <p className="font-medium">{fotoDepoisSelecionada?.nome}</p>
                  <p className="text-muted-foreground">
                    {fotoDepoisSelecionada &&
                      format(parseISO(fotoDepoisSelecionada.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        /* Placeholder quando nao tem selecao */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-muted-foreground">
              Selecione duas fotos para comparar
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha uma foto &quot;antes&quot; e uma foto &quot;depois&quot; nos campos acima
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

