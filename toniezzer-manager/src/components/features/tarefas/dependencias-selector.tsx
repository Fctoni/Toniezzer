"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tarefa {
  id: string;
  nome: string;
  status: string;
}

interface DependenciasSelectorProps {
  tarefas: Tarefa[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentTarefaId?: string; // Para evitar auto-referência ao editar
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "text-gray-500" },
  em_andamento: { label: "Em Andamento", color: "text-blue-500" },
  concluida: { label: "Concluída", color: "text-green-500" },
  cancelada: { label: "Cancelada", color: "text-red-500" },
};

export function DependenciasSelector({
  tarefas,
  selectedIds,
  onChange,
  currentTarefaId,
}: DependenciasSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filtrar tarefa atual para evitar auto-referência
  const availableTarefas = tarefas.filter((t) => t.id !== currentTarefaId);

  const handleSelect = (tarefaId: string) => {
    const newSelectedIds = selectedIds.includes(tarefaId)
      ? selectedIds.filter((id) => id !== tarefaId)
      : [...selectedIds, tarefaId];

    onChange(newSelectedIds);
  };

  const handleRemove = (tarefaId: string) => {
    onChange(selectedIds.filter((id) => id !== tarefaId));
  };

  const selectedTarefas = availableTarefas.filter((t) =>
    selectedIds.includes(t.id)
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} tarefa(s) selecionada(s)`
              : "Selecione tarefas..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tarefa..." />
            <CommandEmpty>Nenhuma tarefa encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {availableTarefas.map((tarefa) => {
                const isSelected = selectedIds.includes(tarefa.id);
                const statusInfo = statusConfig[tarefa.status] || statusConfig.pendente;

                return (
                  <CommandItem
                    key={tarefa.id}
                    value={tarefa.nome}
                    onSelect={() => handleSelect(tarefa.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="truncate">{tarefa.nome}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusInfo.color)}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Lista de tarefas selecionadas */}
      {selectedTarefas.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTarefas.map((tarefa) => (
            <Badge
              key={tarefa.id}
              variant="secondary"
              className="gap-1 pr-1 max-w-[200px]"
            >
              <span className="truncate">{tarefa.nome}</span>
              <button
                type="button"
                onClick={() => handleRemove(tarefa.id)}
                className="ml-1 hover:bg-muted rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
