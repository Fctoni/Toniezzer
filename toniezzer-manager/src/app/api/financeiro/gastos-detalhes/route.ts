import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriaId = searchParams.get("categoria_id");
    const etapaId = searchParams.get("etapa_id");

    if (!categoriaId || !etapaId) {
      return NextResponse.json(
        { error: "Parâmetros categoria_id e etapa_id são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Construir query baseado se tem etapa ou não
    let query = supabase
      .from("gastos")
      .select(`
        id,
        descricao,
        valor,
        data,
        forma_pagamento,
        nota_fiscal_numero,
        parcela_atual,
        parcelas,
        fornecedores:fornecedor_id(nome),
        criado_por_user:criado_por(nome_completo)
      `)
      .eq("categoria_id", categoriaId)
      .eq("status", "aprovado");

    // Filtrar por etapa
    if (etapaId === "sem_etapa") {
      query = query.is("etapa_relacionada_id", null);
    } else {
      query = query.eq("etapa_relacionada_id", etapaId);
    }

    const { data: gastos, error } = await query.order("data", { ascending: false });

    if (error) {
      console.error("Erro ao buscar gastos detalhados:", error);
      return NextResponse.json(
        { error: "Erro ao buscar gastos" },
        { status: 500 }
      );
    }

    // Transformar dados para formato mais amigável
    const gastosDetalhados = gastos?.map((gasto) => ({
      id: gasto.id,
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      forma_pagamento: gasto.forma_pagamento,
      nota_fiscal_numero: gasto.nota_fiscal_numero,
      parcela_atual: gasto.parcela_atual,
      parcelas: gasto.parcelas,
      fornecedor_nome: (gasto.fornecedores as unknown as { nome: string } | null)?.nome || null,
      criado_por_nome: (gasto.criado_por_user as unknown as { nome_completo: string } | null)?.nome_completo || null,
    }));

    return NextResponse.json({
      gastos: gastosDetalhados,
      total: gastosDetalhados?.length || 0,
    });
  } catch (error) {
    console.error("Erro na API gastos-detalhes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

