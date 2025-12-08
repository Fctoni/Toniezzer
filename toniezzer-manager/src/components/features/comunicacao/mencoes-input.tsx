"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface MencoesInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  users: Tables<"users">[];
  placeholder?: string;
  className?: string;
}

export function MencoesInput({
  value,
  onChange,
  users,
  placeholder = "Digite sua mensagem... Use @ para mencionar alguém",
  className,
}: MencoesInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<Tables<"users">[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Extrair IDs das menções do texto
  const extractMentionIds = (text: string): string[] => {
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      ids.push(match[2]);
    }
    return ids;
  };

  // Encontrar query de menção sendo digitada
  const getMentionQuery = (text: string, pos: number): { query: string; start: number } | null => {
    const beforeCursor = text.slice(0, pos);
    
    // Procurar último @ que não faz parte de uma menção completa
    let lastAtPos = -1;
    let i = beforeCursor.length - 1;
    
    while (i >= 0) {
      if (beforeCursor[i] === "@") {
        // Verificar se esse @ já faz parte de uma menção completa @[...]()
        const afterAt = text.slice(i);
        const mentionMatch = afterAt.match(/^@\[([^\]]+)\]\(([^)]+)\)/);
        if (mentionMatch) {
          // Pular esta menção completa
          i = i - 1;
          continue;
        }
        
        // Verificar se não tem espaço ou newline entre @ e cursor
        const textAfterAt = beforeCursor.slice(i + 1);
        if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
          lastAtPos = i;
          break;
        }
      }
      i--;
    }
    
    if (lastAtPos === -1) return null;
    
    const query = beforeCursor.slice(lastAtPos + 1);
    return { query, start: lastAtPos };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPosition(pos);

    // Detectar se está digitando uma menção
    const mentionQuery = getMentionQuery(newValue, pos);

    if (mentionQuery) {
      const filtered = users.filter((user) =>
        user.nome_completo.toLowerCase().includes(mentionQuery.query.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }

    // Passar valor e menções extraídas
    onChange(newValue, extractMentionIds(newValue));
  };

  const insertMention = (user: Tables<"users">) => {
    const mentionQuery = getMentionQuery(value, cursorPosition);
    if (!mentionQuery) return;

    const beforeMention = value.slice(0, mentionQuery.start);
    const afterMention = value.slice(cursorPosition);
    
    // Inserir menção no formato @[Nome](id)
    const mentionTag = `@[${user.nome_completo}](${user.id})`;
    const newValue = beforeMention + mentionTag + " " + afterMention;
    
    // Calcular nova posição do cursor
    const newCursorPos = beforeMention.length + mentionTag.length + 1;
    
    // Atualizar valor e menções
    onChange(newValue, extractMentionIds(newValue));
    setShowSuggestions(false);

    // Posicionar cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case "Enter":
        if (filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case "Tab":
        if (filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      const selectedItem = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[100px] resize-none", className)}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent",
                index === selectedIndex && "bg-accent"
              )}
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {user.nome_completo
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{user.nome_completo}</p>
                {user.especialidade && (
                  <p className="text-xs text-muted-foreground">
                    {user.especialidade}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
