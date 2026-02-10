"use client";

import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { QuickAddFornecedor } from "@/components/features/ocr/quick-add-fornecedor";

/**
 * Campos mínimos obrigatórios que o form deve ter para usar CompraInfoSection.
 * Tanto o create-form quanto o edit-form satisfazem esta interface.
 */
interface CompraInfoFormFields {
  descricao: string;
  data_compra: Date;
  fornecedor_id: string;
  categoria_id: string;
  subcategoria_id?: string;
  etapa_relacionada_id?: string;
}

interface CompraInfoSectionProps<T extends FieldValues & CompraInfoFormFields> {
  form: UseFormReturn<T>;
  fornecedores: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string; cor: string }>;
  subcategoriasDisponiveis: Array<{ id: string; nome: string; categoria_id: string }>;
  etapas: Array<{ id: string; nome: string }>;
  categoriaSelecionada: string | undefined;
  onFornecedorAdded: (novoFornecedor: { id: string; nome: string }) => void;
  /** Só é necessário quando o campo valor_total existe no form (modo criação) */
  formatCurrencyInput?: (value: string) => string;
  /** Quando true, oculta o campo "Valor Total" (usado no modo edição) */
  hideValorTotal?: boolean;
}

export function CompraInfoSection<T extends FieldValues & CompraInfoFormFields>({
  form,
  fornecedores,
  categorias,
  subcategoriasDisponiveis,
  etapas,
  categoriaSelecionada,
  onFornecedorAdded,
  formatCurrencyInput,
  hideValorTotal = false,
}: CompraInfoSectionProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informações da Compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Descrição */}
        <FormField
          control={form.control}
          name={"descricao" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Porcelanato Portinari 60x60 (50 caixas)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor e Data da Compra */}
        {!hideValorTotal && formatCurrencyInput ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={"valor_total" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"data_compra" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Compra *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name={"data_compra" as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Compra *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Fornecedor e Categoria */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={"fornecedor_id" as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <QuickAddFornecedor
                      onFornecedorAdded={(novoFornecedor) => {
                        onFornecedorAdded(novoFornecedor);
                        field.onChange(novoFornecedor.id);
                      }}
                    />
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"categoria_id" as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.cor }}
                          />
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Subcategoria (condicional) */}
        {categoriaSelecionada && subcategoriasDisponiveis.length > 0 && (
          <FormField
            control={form.control}
            name={"subcategoria_id" as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategoria (opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {subcategoriasDisponiveis.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Etapa Relacionada */}
        <FormField
          control={form.control}
          name={"etapa_relacionada_id" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etapa Relacionada (opcional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
