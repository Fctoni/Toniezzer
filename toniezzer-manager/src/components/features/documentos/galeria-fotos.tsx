"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Foto {
  id: string;
  nome: string;
  url: string;
  created_at: string;
  etapa_relacionada_id: string | null;
  etapas: { nome: string } | null;
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
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");
  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);

  const fotosFiltradas =
    filtroEtapa === "todas"
      ? fotos
      : fotos.filter((f) => f.etapa_relacionada_id === filtroEtapa);

  if (fotos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma foto encontrada
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex items-center gap-4">
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-[200px]">
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
        <span className="text-sm text-muted-foreground">
          {fotosFiltradas.length} foto(s)
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotosFiltradas.map((foto) => (
          <div
            key={foto.id}
            className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
            onClick={() => setFotoSelecionada(foto)}
          >
            {/* Placeholder/Thumbnail */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ZoomIn className="h-8 w-8 text-muted-foreground/50" />
            </div>

            {/* Image (se URL válida) */}
            {foto.url && (
              <Image
                src={foto.url}
                alt={foto.nome}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {foto.nome}
                </p>
                {foto.etapas && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {foto.etapas.nome}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={!!fotoSelecionada} onOpenChange={() => setFotoSelecionada(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{fotoSelecionada?.nome}</span>
              <div className="flex gap-2">
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
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {fotoSelecionada?.url ? (
              <Image
                src={fotoSelecionada.url}
                alt={fotoSelecionada.nome}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Imagem não disponível</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {fotoSelecionada?.etapas && (
                <Badge variant="outline">{fotoSelecionada.etapas.nome}</Badge>
              )}
            </div>
            <span>
              {fotoSelecionada &&
                format(new Date(fotoSelecionada.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

