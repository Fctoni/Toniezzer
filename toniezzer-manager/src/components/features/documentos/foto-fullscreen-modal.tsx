"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Calendar,
  GitBranch,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface FotoFullscreenModalProps {
  foto: Foto | null;
  fotos: Foto[];
  onClose: () => void;
  onDelete?: (foto: Foto) => void;
  onNavigate: (foto: Foto) => void;
}

export function FotoFullscreenModal({
  foto,
  fotos,
  onClose,
  onDelete,
  onNavigate,
}: FotoFullscreenModalProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const fotoIndex = foto ? fotos.findIndex((f) => f.id === foto.id) : -1;
  const temAnterior = fotoIndex > 0;
  const temProxima = fotoIndex < fotos.length - 1;

  const irParaAnterior = useCallback(() => {
    if (temAnterior) {
      onNavigate(fotos[fotoIndex - 1]);
    }
  }, [temAnterior, fotoIndex, fotos, onNavigate]);

  const irParaProxima = useCallback(() => {
    if (temProxima) {
      onNavigate(fotos[fotoIndex + 1]);
    }
  }, [temProxima, fotoIndex, fotos, onNavigate]);

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      irParaProxima();
    } else if (isRightSwipe) {
      irParaAnterior();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") irParaAnterior();
      if (e.key === "ArrowRight") irParaProxima();
    };

    if (foto) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [foto, onClose, irParaAnterior, irParaProxima]);

  if (!foto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <span className="text-white text-sm">
          {fotoIndex + 1} / {fotos.length}
        </span>

        <div className="flex gap-2">
          {foto.url && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-white hover:bg-white/20"
            >
              <a href={foto.url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5" />
              </a>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(foto)}
              className="text-white hover:bg-red-500/50"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Image */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => setShowInfo(!showInfo)}
      >
        {foto.url ? (
          <img
            src={foto.url}
            alt={foto.nome}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <p className="text-white/50">Imagem nao disponivel</p>
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      {temAnterior && (
        <Button
          variant="ghost"
          size="icon"
          onClick={irParaAnterior}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 hidden md:flex"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {temProxima && (
        <Button
          variant="ghost"
          size="icon"
          onClick={irParaProxima}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 hidden md:flex"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Info panel (bottom) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-transform duration-300",
          showInfo ? "translate-y-0" : "translate-y-full md:translate-y-0"
        )}
      >
        <p className="text-white font-medium truncate mb-2">{foto.nome}</p>
        
        <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(foto.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </div>

          {foto.etapas && (
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              <Badge variant="secondary" className="text-xs">
                {foto.etapas.nome}
              </Badge>
            </div>
          )}

          {foto.tags && foto.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-4 w-4" />
              {foto.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs text-white/70 border-white/30">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Swipe hint (mobile only) */}
        <p className="text-white/40 text-xs text-center mt-3 md:hidden">
          Deslize para navegar • Toque para mostrar/ocultar info
        </p>
      </div>
    </div>
  );
}
