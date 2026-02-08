"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EtapaOption {
  id: string;
  nome: string;
}

interface SubetapaOption {
  id: string;
  nome: string;
  etapa_id: string;
}

interface UserOption {
  id: string;
  nome_completo: string;
}

export interface TarefasFiltersState {
  busca: string;
  etapa_id: string;
  subetapa_id: string;
  responsavel_id: string;
  status: string;
  prioridade: string;
}

interface TarefasFiltersProps {
  filters: TarefasFiltersState;
  onFilterChange: (key: keyof TarefasFiltersState, value: string) => void;
  etapas: EtapaOption[];
  subetapas: SubetapaOption[];
  users: UserOption[];
}

export function TarefasFilters({
  filters,
  onFilterChange,
  etapas,
  subetapas,
  users,
}: TarefasFiltersProps) {
  // Filtrar subetapas pela etapa selecionada
  const filteredSubetapas = filters.etapa_id && filters.etapa_id !== "todas"
    ? subetapas.filter((s) => s.etapa_id === filters.etapa_id)
    : subetapas;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefa..."
          value={filters.busca}
          onChange={(e) => onFilterChange("busca", e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Etapa */}
      <Select
        value={filters.etapa_id}
        onValueChange={(v) => {
          onFilterChange("etapa_id", v);
          // Reset subetapa quando muda etapa
          if (v !== filters.etapa_id) {
            onFilterChange("subetapa_id", "todas");
          }
        }}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas etapas</SelectItem>
          {etapas.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Subetapa */}
      <Select
        value={filters.subetapa_id}
        onValueChange={(v) => onFilterChange("subetapa_id", v)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Subetapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas subetapas</SelectItem>
          {filteredSubetapas.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Responsável */}
      <Select
        value={filters.responsavel_id}
        onValueChange={(v) => onFilterChange("responsavel_id", v)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome_completo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status}
        onValueChange={(v) => onFilterChange("status", v)}
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="em_andamento">Em Andamento</SelectItem>
          <SelectItem value="concluida">Concluída</SelectItem>
          <SelectItem value="bloqueada">Bloqueada</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      {/* Prioridade */}
      <Select
        value={filters.prioridade}
        onValueChange={(v) => onFilterChange("prioridade", v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas</SelectItem>
          <SelectItem value="critica">Crítica</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
