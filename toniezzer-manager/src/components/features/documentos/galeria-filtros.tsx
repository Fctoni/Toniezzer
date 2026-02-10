"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface Etapa {
  id: string;
  nome: string;
}

interface GaleriaFiltrosProps {
  filtroEtapa: string;
  setFiltroEtapa: (value: string) => void;
  filtroTag: string;
  setFiltroTag: (value: string) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  etapas: Etapa[];
  todasTags: string[];
  temFiltrosAtivos: boolean;
  limparFiltros: () => void;
  totalFotos: number;
  totalFiltradas: number;
}

export function GaleriaFiltros({
  filtroEtapa,
  setFiltroEtapa,
  filtroTag,
  setFiltroTag,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  etapas,
  todasTags,
  temFiltrosAtivos,
  limparFiltros,
  totalFotos,
  totalFiltradas,
}: GaleriaFiltrosProps) {
  return (
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
        {totalFiltradas} de {totalFotos} foto(s)
      </div>
    </div>
  );
}
