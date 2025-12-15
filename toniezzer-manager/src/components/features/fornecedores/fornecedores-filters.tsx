"use client";

import { useState, useMemo } from "react";
import { Tables } from "@/lib/types/database";
import { FornecedorCard } from "./fornecedor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search } from "lucide-react";
import Link from "next/link";

interface FornecedoresFiltersProps {
  fornecedores: Tables<"fornecedores">[];
}

export function FornecedoresFilters({ fornecedores }: FornecedoresFiltersProps) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      // Filtro de tipo
      if (tipoFilter !== "all" && f.tipo !== tipoFilter) {
        return false;
      }

      // Filtro de busca
      if (search && !f.nome.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [fornecedores, search, tipoFilter]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="fornecedor_material">
              Fornecedor de Material
            </SelectItem>
            <SelectItem value="prestador_servico">
              Prestador de Serviço
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {fornecedoresFiltrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
          <p className="text-sm mb-4">
            {search || tipoFilter !== "all"
              ? "Tente ajustar os filtros"
              : "Cadastre seu primeiro fornecedor"}
          </p>
          {!search && tipoFilter === "all" && (
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Fornecedor
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fornecedoresFiltrados.map((fornecedor) => (
            <FornecedorCard key={fornecedor.id} fornecedor={fornecedor} />
          ))}
        </div>
      )}
    </>
  );
}


