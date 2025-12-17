"use client";

import { Badge } from "@/components/ui/badge";
import { ZoomIn } from "lucide-react";
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
  tags: string[];
  tamanho_bytes: number | null;
}

interface GaleriaGridProps {
  fotos: Foto[];
  onFotoClick: (foto: Foto) => void;
}

export function GaleriaGrid({ fotos, onFotoClick }: GaleriaGridProps) {
  if (fotos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma foto encontrada
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fotos.map((foto) => (
        <div
          key={foto.id}
          className="group relative rounded-lg overflow-hidden border bg-card cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onFotoClick(foto)}
        >
          {/* Imagem */}
          <div className="relative aspect-square bg-muted">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ZoomIn className="h-8 w-8 text-muted-foreground/50" />
            </div>
            {foto.url && (
              <Image
                src={foto.url}
                alt={foto.nome}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}
            {/* Overlay no hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Info abaixo da imagem */}
          <div className="p-3 space-y-2">
            <p className="font-medium text-sm truncate" title={foto.nome}>
              {foto.nome}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {format(new Date(foto.created_at), "dd/MM/yy", { locale: ptBR })}
              </span>
              {foto.etapas && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {foto.etapas.nome}
                  </Badge>
                </>
              )}
            </div>

            {foto.tags && foto.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {foto.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    #{tag}
                  </Badge>
                ))}
                {foto.tags.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{foto.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

