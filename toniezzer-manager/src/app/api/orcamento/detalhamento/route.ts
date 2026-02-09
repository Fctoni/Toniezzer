import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  buscarDetalhamentoComCategoria,
  salvarDetalhamento,
  deletarDetalhamentoPorEtapa,
} from "@/lib/services/orcamento-detalhado";

// GET: Buscar detalhamento de uma etapa
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const etapaId = searchParams.get("etapa_id");

    if (!etapaId) {
      return NextResponse.json(
        { error: "Parâmetro etapa_id é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const data = await buscarDetalhamentoComCategoria(supabase, etapaId);

    return NextResponse.json({ detalhamento: data || [] });
  } catch (error) {
    console.error("Erro na API detalhamento GET:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Salvar/atualizar detalhamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { etapa_id, detalhamento } = body;

    if (!etapa_id || !Array.isArray(detalhamento)) {
      return NextResponse.json(
        { error: "Parâmetros inválidos. Esperado: { etapa_id, detalhamento: [] }" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    await salvarDetalhamento(supabase, etapa_id, detalhamento);

    return NextResponse.json({
      success: true,
      message: "Detalhamento salvo com sucesso",
    });
  } catch (error) {
    console.error("Erro na API detalhamento POST:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Limpar detalhamento de uma etapa
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const etapaId = searchParams.get("etapa_id");

    if (!etapaId) {
      return NextResponse.json(
        { error: "Parâmetro etapa_id é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    await deletarDetalhamentoPorEtapa(supabase, etapaId);

    return NextResponse.json({
      success: true,
      message: "Detalhamento limpo com sucesso",
    });
  } catch (error) {
    console.error("Erro na API detalhamento DELETE:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

