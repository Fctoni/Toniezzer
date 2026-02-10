"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Play, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Subetapa,
  type Tarefa,
  subetapaStatusOptions,
  tarefaStatusOptions,
  prioridadeConfig,
} from "@/components/features/cronograma/cronograma-config";

// --- Tipos ---

export interface SelectedItem {
  type: "subetapa" | "tarefa";
  item: Subetapa | Tarefa;
  parentName: string;
}

interface CronogramaMobileSheetProps {
  selectedItem: SelectedItem | null;
  updating: boolean;
  onClose: () => void;
  onUpdateSubetapa: (subetapaId: string, newStatus: string) => void;
  onUpdateTarefa: (tarefaId: string, newStatus: string) => void;
}

// --- Sub-renderizadores internos ---

function SubetapaSheetContent({
  subetapa,
  parentName,
  updating,
  onUpdateSubetapa,
}: {
  subetapa: Subetapa;
  parentName: string;
  updating: boolean;
  onUpdateSubetapa: (subetapaId: string, newStatus: string) => void;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-left text-base">
          {subetapa.nome}
        </SheetTitle>
        <p className="text-xs text-muted-foreground text-left">{parentName}</p>
      </SheetHeader>

      <div className="space-y-4 mt-4">
        {/* Datas */}
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Inicio
            </p>
            <p className="text-sm font-medium mt-0.5">
              {subetapa.data_inicio_prevista
                ? new Date(
                    subetapa.data_inicio_prevista + "T12:00:00"
                  ).toLocaleDateString("pt-BR")
                : "Nao definida"}
            </p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Fim
            </p>
            <p className="text-sm font-medium mt-0.5">
              {subetapa.data_fim_prevista
                ? new Date(
                    subetapa.data_fim_prevista + "T12:00:00"
                  ).toLocaleDateString("pt-BR")
                : "Nao definida"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={subetapa.status}
            onValueChange={(value) => onUpdateSubetapa(subetapa.id, value)}
            disabled={updating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subetapaStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className={cn("flex items-center gap-2", option.color)}>
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acoes rapidas */}
        <div className="flex gap-2">
          {subetapa.status !== "em_andamento" &&
            subetapa.status !== "concluida" && (
              <Button
                className="flex-1"
                onClick={() => onUpdateSubetapa(subetapa.id, "em_andamento")}
                disabled={updating}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}
          {subetapa.status !== "concluida" && (
            <Button
              variant={
                subetapa.status === "em_andamento" ? "default" : "outline"
              }
              className="flex-1"
              onClick={() => onUpdateSubetapa(subetapa.id, "concluida")}
              disabled={updating}
            >
              <Check className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function TarefaSheetContent({
  tarefa,
  parentName,
  updating,
  onUpdateTarefa,
}: {
  tarefa: Tarefa;
  parentName: string;
  updating: boolean;
  onUpdateTarefa: (tarefaId: string, newStatus: string) => void;
}) {
  const prio = tarefa.prioridade
    ? prioridadeConfig[tarefa.prioridade]
    : null;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-left text-base">{tarefa.nome}</SheetTitle>
        <p className="text-xs text-muted-foreground text-left">{parentName}</p>
      </SheetHeader>

      <div className="space-y-4 mt-4">
        {/* Prazo + Prioridade */}
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Prazo
            </p>
            <p className="text-sm font-medium mt-0.5">
              {tarefa.data_prevista
                ? new Date(
                    tarefa.data_prevista + "T12:00:00"
                  ).toLocaleDateString("pt-BR")
                : "Nao definido"}
            </p>
          </div>
          {prio && (
            <div className="flex-1 p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Prioridade
              </p>
              <p
                className={cn(
                  "text-sm font-medium mt-0.5 flex items-center gap-1",
                  prio.color
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                {prio.label}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {tarefa.tags && tarefa.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tarefa.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={tarefa.status}
            onValueChange={(value) => onUpdateTarefa(tarefa.id, value)}
            disabled={updating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tarefaStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className={cn("flex items-center gap-2", option.color)}>
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acoes rapidas */}
        <div className="flex gap-2">
          {tarefa.status !== "em_andamento" &&
            tarefa.status !== "concluida" && (
              <Button
                className="flex-1"
                onClick={() => onUpdateTarefa(tarefa.id, "em_andamento")}
                disabled={updating}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}
          {tarefa.status !== "concluida" && (
            <Button
              variant={
                tarefa.status === "em_andamento" ? "default" : "outline"
              }
              className="flex-1"
              onClick={() => onUpdateTarefa(tarefa.id, "concluida")}
              disabled={updating}
            >
              <Check className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// --- Componente principal ---

export function CronogramaMobileSheet({
  selectedItem,
  updating,
  onClose,
  onUpdateSubetapa,
  onUpdateTarefa,
}: CronogramaMobileSheetProps) {
  return (
    <Sheet open={!!selectedItem} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[50vh]">
        {selectedItem?.type === "subetapa" && (
          <SubetapaSheetContent
            subetapa={selectedItem.item as Subetapa}
            parentName={selectedItem.parentName}
            updating={updating}
            onUpdateSubetapa={onUpdateSubetapa}
          />
        )}

        {selectedItem?.type === "tarefa" && (
          <TarefaSheetContent
            tarefa={selectedItem.item as Tarefa}
            parentName={selectedItem.parentName}
            updating={updating}
            onUpdateTarefa={onUpdateTarefa}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
