"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

export interface TarefasFilters {
  search: string;
  status: string;
  prioridade: string;
  responsavel_id: string;
  tag: string;
}

interface User {
  id: string;
  nome_completo: string;
}

interface TarefasFiltersProps {
  filters: TarefasFilters;
  onFilterChange: (filters: TarefasFilters) => void;
  users: User[];
  availableTags: string[];
}

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const prioridadeOptions = [
  { value: "todos", label: "Todas as prioridades" },
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export function TarefasFilters({
  filters,
  onFilterChange,
  users,
  availableTags,
}: TarefasFiltersProps) {
  const updateFilter = <K extends keyof TarefasFilters>(
    key: K,
    value: TarefasFilters[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      status: "todos",
      prioridade: "todos",
      responsavel_id: "todos",
      tag: "",
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "todos" ||
    filters.prioridade !== "todos" ||
    filters.responsavel_id !== "todos" ||
    filters.tag !== "";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome da tarefa..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.prioridade}
          onValueChange={(value) => updateFilter("prioridade", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {prioridadeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.responsavel_id}
          onValueChange={(value) => updateFilter("responsavel_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.nome_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tag}
          onValueChange={(value) => updateFilter("tag", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as tags</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters & Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <button
                onClick={() => updateFilter("search", "")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status !== "todos" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((o) => o.value === filters.status)?.label}
              <button
                onClick={() => updateFilter("status", "todos")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.prioridade !== "todos" && (
            <Badge variant="secondary" className="gap-1">
              Prioridade:{" "}
              {prioridadeOptions.find((o) => o.value === filters.prioridade)?.label}
              <button
                onClick={() => updateFilter("prioridade", "todos")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.responsavel_id !== "todos" && (
            <Badge variant="secondary" className="gap-1">
              Resp.:{" "}
              {filters.responsavel_id === "sem_responsavel"
                ? "Sem responsável"
                : users.find((u) => u.id === filters.responsavel_id)?.nome_completo}
              <button
                onClick={() => updateFilter("responsavel_id", "todos")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tag && (
            <Badge variant="secondary" className="gap-1">
              Tag: {filters.tag}
              <button
                onClick={() => updateFilter("tag", "")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}
