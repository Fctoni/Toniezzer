"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables, FeedTipo } from "@/lib/types/database";
import { X } from "lucide-react";

interface FiltrosFeedProps {
  users: Tables<"users">[];
  etapas: Tables<"etapas">[];
  filtros: {
    tipo?: FeedTipo;
    autorId?: string;
    etapaId?: string;
  };
  onFiltrosChange: (filtros: {
    tipo?: FeedTipo;
    autorId?: string;
    etapaId?: string;
  }) => void;
}

export function FiltrosFeed({
  users,
  etapas,
  filtros,
  onFiltrosChange,
}: FiltrosFeedProps) {
  const hasFilters =
    filtros.tipo || filtros.autorId || filtros.etapaId;

  const clearFilters = () => {
    onFiltrosChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">
        Filtrar por:
      </span>

      <Select
        value={filtros.tipo || "all"}
        onValueChange={(v) =>
          onFiltrosChange({
            ...filtros,
            tipo: v === "all" ? undefined : (v as FeedTipo),
          })
        }
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="post">Post</SelectItem>
          <SelectItem value="decisao">Decisão</SelectItem>
          <SelectItem value="alerta">Alerta</SelectItem>
          <SelectItem value="sistema">Sistema</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filtros.autorId || "all"}
        onValueChange={(v) =>
          onFiltrosChange({
            ...filtros,
            autorId: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Autor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os autores</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.nome_completo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.etapaId || "all"}
        onValueChange={(v) =>
          onFiltrosChange({
            ...filtros,
            etapaId: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as etapas</SelectItem>
          {etapas.map((etapa) => (
            <SelectItem key={etapa.id} value={etapa.id}>
              {etapa.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 gap-1 text-xs"
        >
          <X className="h-3 w-3" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

