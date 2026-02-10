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
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface Etapa {
  id: string;
  nome: string;
}

interface FotoEditFormProps {
  editNome: string;
  setEditNome: (value: string) => void;
  editData: string;
  setEditData: (value: string) => void;
  editTags: string[];
  editTagInput: string;
  setEditTagInput: (value: string) => void;
  adicionarTag: () => void;
  removerTag: (tag: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  editEtapa: string;
  setEditEtapa: (value: string) => void;
  etapas: Etapa[];
}

export function FotoEditForm({
  editNome,
  setEditNome,
  editData,
  setEditData,
  editTags,
  editTagInput,
  setEditTagInput,
  adicionarTag,
  removerTag,
  handleTagKeyDown,
  editEtapa,
  setEditEtapa,
  etapas,
}: FotoEditFormProps) {
  return (
    <div className="space-y-4">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="edit-nome">Nome da foto</Label>
        <Input
          id="edit-nome"
          value={editNome}
          onChange={(e) => setEditNome(e.target.value)}
          placeholder="Nome da foto"
        />
      </div>

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="edit-data">Data</Label>
        <Input
          id="edit-data"
          type="date"
          value={editData}
          onChange={(e) => setEditData(e.target.value)}
        />
      </div>

      {/* Etapa */}
      <div className="space-y-2">
        <Label>Etapa relacionada</Label>
        <Select value={editEtapa || "sem-etapa"} onValueChange={(v) => setEditEtapa(v === "sem-etapa" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma etapa (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sem-etapa">Sem etapa</SelectItem>
            {etapas.map((etapa) => (
              <SelectItem key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma tag e pressione Enter"
            value={editTagInput}
            onChange={(e) => setEditTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <Button type="button" variant="outline" size="icon" onClick={adicionarTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {editTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {editTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                #{tag}
                <button
                  type="button"
                  onClick={() => removerTag(tag)}
                  className="ml-1 hover:text-destructive rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Sugestoes: antes, depois, fachada, fundacao, acabamento
        </p>
      </div>
    </div>
  );
}
