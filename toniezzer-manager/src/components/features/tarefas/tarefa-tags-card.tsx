"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X } from "lucide-react";

interface TarefaTagsCardProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TarefaTagsCard({
  tags,
  onAddTag,
  onRemoveTag,
}: TarefaTagsCardProps) {
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    if (!newTag.trim()) return;
    onAddTag(newTag.trim());
    setNewTag("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nova tag..."
            className="h-8"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" variant="outline" onClick={handleAdd}>
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
