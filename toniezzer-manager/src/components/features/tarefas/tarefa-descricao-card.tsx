"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface TarefaDescricaoCardProps {
  descricao: string | null;
  onUpdate: (value: string | null) => void;
}

export function TarefaDescricaoCard({
  descricao,
  onUpdate,
}: TarefaDescricaoCardProps) {
  const [text, setText] = useState(descricao || "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Descrição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onUpdate(text || null)}
          placeholder="Adicione uma descrição..."
          className="resize-none min-h-[80px]"
        />
      </CardContent>
    </Card>
  );
}
