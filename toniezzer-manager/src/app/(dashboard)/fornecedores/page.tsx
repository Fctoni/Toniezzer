"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/types/database";
import { buscarFornecedores } from "@/lib/services/fornecedores";
import { FornecedorCard } from "@/components/features/fornecedores/fornecedor-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search } from "lucide-react";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Tables<"fornecedores">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");

  const fetchFornecedores = useCallback(async () => {
    try {
      const supabase = createClient();
      const filtros: { tipo?: string; search?: string } = {};

      if (tipoFilter !== "all") {
        filtros.tipo = tipoFilter;
      }
      if (search) {
        filtros.search = search;
      }

      const data = await buscarFornecedores(supabase, filtros);
      setFornecedores(data);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    } finally {
      setLoading(false);
    }
  }, [search, tipoFilter]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const totalFornecedores = fornecedores.length;
  const prestadores = fornecedores.filter(
    (f) => f.tipo === "prestador_servico"
  ).length;
  const materiais = fornecedores.filter(
    (f) => f.tipo === "fornecedor_material"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores e prestadores de serviço
          </p>
        </div>
        <Button asChild>
          <Link href="/fornecedores/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-2xl font-bold">{totalFornecedores}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-600">{prestadores}</p>
          <p className="text-sm text-amber-600/70">Prestadores</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-600">{materiais}</p>
          <p className="text-sm text-blue-600/70">Fornecedores</p>
        </div>
      </div>

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
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-lg border bg-card">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : fornecedores.length === 0 ? (
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
          {fornecedores.map((fornecedor) => (
            <FornecedorCard key={fornecedor.id} fornecedor={fornecedor} />
          ))}
        </div>
      )}
    </div>
  );
}

