"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReuniaoCard } from "./reuniao-card";
import { Plus, Search, FileText } from "lucide-react";
import type { Tables } from "@/lib/types/database";

type ReuniaoComContagem = Tables<"reunioes"> & {
  acoes_count: number;
  acoes_pendentes: number;
  created_by_user: { nome_completo: string } | null;
};

interface ReunioesFiltersProps {
  reunioes: ReuniaoComContagem[];
}

export function ReunioesFilters({ reunioes }: ReunioesFiltersProps) {
  const [search, setSearch] = useState("");

  const reunioesFiltradas = useMemo(() => {
    return reunioes.filter(
      (r) =>
        r.titulo.toLowerCase().includes(search.toLowerCase()) ||
        r.participantes?.some((p) =>
          p.toLowerCase().includes(search.toLowerCase())
        )
    );
  }, [reunioes, search]);

  return (
    <>
      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou participante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de reuniões */}
      {reunioesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? "Nenhuma reunião encontrada" : "Nenhuma reunião cadastrada"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search
              ? "Tente ajustar os termos de busca"
              : "Faça upload de um arquivo Markdown do Plaud para começar"}
          </p>
          {!search && (
            <Button asChild>
              <Link href="/reunioes/nova">
                <Plus className="h-4 w-4 mr-2" />
                Importar Reunião
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reunioesFiltradas.map((reuniao) => (
            <ReuniaoCard key={reuniao.id} reuniao={reuniao} />
          ))}
        </div>
      )}
    </>
  );
}


