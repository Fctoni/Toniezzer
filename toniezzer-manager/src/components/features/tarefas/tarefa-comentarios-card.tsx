import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Comentario {
  id: string;
  conteudo: string;
  created_at: string | null;
  created_by_nome: string | null;
}

interface TarefaComentariosCardProps {
  comentarios: Comentario[];
  submittingComment: boolean;
  onSubmitComentario: (conteudo: string) => void;
}

function getInitials(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function TarefaComentariosCard({
  comentarios,
  submittingComment,
  onSubmitComentario,
}: TarefaComentariosCardProps) {
  const [novoComentario, setNovoComentario] = useState("");

  const handleSubmit = () => {
    if (!novoComentario.trim()) return;
    onSubmitComentario(novoComentario.trim());
    setNovoComentario("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comentários ({comentarios.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comentarios.length > 0 && (
          <div className="space-y-3 mb-4">
            {comentarios.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {c.created_by_nome
                      ? getInitials(c.created_by_nome)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {c.created_by_nome || "Usuário"}
                    </span>
                    {c.created_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}{" "}
                        {new Date(c.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5">{c.conteudo}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Adicionar comentário..."
            className="resize-none h-20"
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            onClick={handleSubmit}
            disabled={submittingComment || !novoComentario.trim()}
          >
            {submittingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
