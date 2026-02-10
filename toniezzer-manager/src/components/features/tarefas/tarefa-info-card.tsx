import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers } from "lucide-react";

interface UserOption {
  id: string;
  nome_completo: string;
}

interface TarefaInfoData {
  status: string;
  prioridade: string | null;
  responsavel_id: string | null;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
}

interface TarefaInfoCardProps {
  tarefa: TarefaInfoData;
  users: UserOption[];
  saving: boolean;
  updateField: (field: string, value: unknown) => void;
}

export function TarefaInfoCard({
  tarefa,
  users,
  saving,
  updateField,
}: TarefaInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Informações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={tarefa.status}
            onValueChange={(v) => updateField("status", v)}
            disabled={saving}
          >
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="bloqueada">Bloqueada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prioridade */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Prioridade</span>
          <Select
            value={tarefa.prioridade || "media"}
            onValueChange={(v) => updateField("prioridade", v)}
            disabled={saving}
          >
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Responsável */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Responsável</span>
          <Select
            value={tarefa.responsavel_id || "nenhum"}
            onValueChange={(v) =>
              updateField("responsavel_id", v === "nenhum" ? null : v)
            }
            disabled={saving}
          >
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Nenhum</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Prevista */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Prazo</span>
          <span className="text-sm font-medium">
            {tarefa.data_prevista
              ? new Date(
                  tarefa.data_prevista + "T12:00:00"
                ).toLocaleDateString("pt-BR")
              : "Não definido"}
          </span>
        </div>

        {/* Data Início Real */}
        {tarefa.data_inicio_real && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Início Real</span>
            <span className="text-sm">
              {new Date(tarefa.data_inicio_real).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}

        {/* Data Conclusão Real */}
        {tarefa.data_conclusao_real && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Concluída em</span>
            <span className="text-sm text-green-500">
              {new Date(tarefa.data_conclusao_real).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
