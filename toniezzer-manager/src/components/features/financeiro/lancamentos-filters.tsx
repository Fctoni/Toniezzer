"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Search,
  X,
  ChevronDown,
  Receipt,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LancamentosFilters {
  busca: string;
  status_pagamento: string;
  fornecedor_id: string;
  categoria_id: string;
  vencimento_inicio: Date | undefined;
  vencimento_fim: Date | undefined;
  pagamento_inicio: Date | undefined;
  pagamento_fim: Date | undefined;
  valor_min: string;
  valor_max: string;
  vinculo_compra: string;
}

interface ResumoLancamentos {
  total: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  qtdPago: number;
  qtdPendente: number;
}

interface LancamentosFiltersProps {
  filters: LancamentosFilters;
  onFiltersChange: (filters: LancamentosFilters) => void;
  fornecedores: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string; cor: string }>;
  resumo: ResumoLancamentos;
  resultadosFiltrados: number;
}

export const defaultLancamentosFilters: LancamentosFilters = {
  busca: "",
  status_pagamento: "todos",
  fornecedor_id: "todos",
  categoria_id: "todos",
  vencimento_inicio: undefined,
  vencimento_fim: undefined,
  pagamento_inicio: undefined,
  pagamento_fim: undefined,
  valor_min: "",
  valor_max: "",
  vinculo_compra: "todos",
};

export function LancamentosFiltersComponent({
  filters,
  onFiltersChange,
  fornecedores,
  categorias,
  resumo,
  resultadosFiltrados,
}: LancamentosFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof LancamentosFilters>(
    key: K,
    value: LancamentosFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(defaultLancamentosFilters);
  };

  const countActiveFilters = [
    filters.status_pagamento !== "todos",
    filters.fornecedor_id !== "todos",
    filters.categoria_id !== "todos",
    filters.vencimento_inicio !== undefined || filters.vencimento_fim !== undefined,
    filters.pagamento_inicio !== undefined || filters.pagamento_fim !== undefined,
    filters.valor_min !== "" || filters.valor_max !== "",
    filters.vinculo_compra !== "todos",
  ].filter(Boolean).length;

  const hasActiveFilters = countActiveFilters > 0 || filters.busca !== "";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: value >= 100000 ? "compact" : "standard",
      maximumFractionDigits: value >= 100000 ? 1 : 0,
    }).format(value);

  return (
    <div className="rounded-lg border bg-card">
      {/* Linha principal: Busca + Botão Filtros */}
      <div className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar descrição, fornecedor, categoria..."
              value={filters.busca}
              onChange={(e) => updateFilter("busca", e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Botão Filtros */}
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
            Filtros
            {countActiveFilters > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {countActiveFilters}
              </span>
            )}
          </Button>

          {/* Limpar */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Resumo compacto */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {resultadosFiltrados === resumo.total
                ? `${resumo.total} parcelas`
                : `${resultadosFiltrados} de ${resumo.total}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600">
              {formatCurrency(resumo.valorPago)} pago ({resumo.qtdPago})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-amber-600">
              {formatCurrency(resumo.valorPendente)} pendente ({resumo.qtdPendente})
            </span>
          </div>
        </div>
      </div>

      {/* Painel de Filtros (colapsável) */}
      {isOpen && (
        <div className="border-t p-3 space-y-3 bg-muted/30">
          {/* Linha 1: Selects principais */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status Pagamento */}
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status_pagamento}
                onValueChange={(value) => updateFilter("status_pagamento", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fornecedor */}
            <div className="space-y-1.5">
              <Label className="text-xs">Fornecedor</Label>
              <Select
                value={filters.fornecedor_id}
                onValueChange={(value) => updateFilter("fornecedor_id", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select
                value={filters.categoria_id}
                onValueChange={(value) => updateFilter("categoria_id", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.cor }}
                        />
                        {c.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vínculo com Compra */}
            <div className="space-y-1.5">
              <Label className="text-xs">Origem</Label>
              <Select
                value={filters.vinculo_compra}
                onValueChange={(value) => updateFilter("vinculo_compra", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="com_compra">Com compra</SelectItem>
                  <SelectItem value="sem_compra">Avulso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2: Período de Vencimento e Valores */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Vencimento de</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.vencimento_inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.vencimento_inicio
                      ? format(filters.vencimento_inicio, "dd/MM/yy", { locale: ptBR })
                      : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.vencimento_inicio}
                    onSelect={(date) => updateFilter("vencimento_inicio", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Vencimento até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.vencimento_fim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.vencimento_fim
                      ? format(filters.vencimento_fim, "dd/MM/yy", { locale: ptBR })
                      : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.vencimento_fim}
                    onSelect={(date) => updateFilter("vencimento_fim", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Valor Mínimo */}
            <div className="space-y-1.5">
              <Label className="text-xs">Valor mín</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.valor_min}
                  onChange={(e) => updateFilter("valor_min", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Valor Máximo */}
            <div className="space-y-1.5">
              <Label className="text-xs">Valor máx</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.valor_max}
                  onChange={(e) => updateFilter("valor_max", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Linha 3: Período de Pagamento */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Pago de</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.pagamento_inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.pagamento_inicio
                      ? format(filters.pagamento_inicio, "dd/MM/yy", { locale: ptBR })
                      : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.pagamento_inicio}
                    onSelect={(date) => updateFilter("pagamento_inicio", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pago até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.pagamento_fim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.pagamento_fim
                      ? format(filters.pagamento_fim, "dd/MM/yy", { locale: ptBR })
                      : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.pagamento_fim}
                    onSelect={(date) => updateFilter("pagamento_fim", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
