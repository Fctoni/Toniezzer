import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    const { data, error } = await supabase
      .from("orcamento_detalhado")
      .select(`
        id,
        etapa_id,
        categoria_id,
        valor_previsto,
        observacoes,
        categorias:categoria_id(nome, cor)
      `)
      .eq("etapa_id", etapaId)
      .order("valor_previsto", { ascending: false });

    if (error) {
      console.error("Erro ao buscar detalhamento:", error);
      return NextResponse.json(
        { error: "Erro ao buscar detalhamento" },
        { status: 500 }
      );
    }

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

    // 1. Deletar detalhamento existente da etapa
    const { error: deleteError } = await supabase
      .from("orcamento_detalhado")
      .delete()
      .eq("etapa_id", etapa_id);

    if (deleteError) {
      console.error("Erro ao deletar detalhamento anterior:", deleteError);
      return NextResponse.json(
        { error: "Erro ao limpar detalhamento anterior" },
        { status: 500 }
      );
    }

    // 2. Inserir novo detalhamento (se houver)
    if (detalhamento.length > 0) {
      const registros = detalhamento.map((item: {
        categoria_id: string;
        valor_previsto: number;
        observacoes?: string;
      }) => ({
        etapa_id,
        categoria_id: item.categoria_id,
        valor_previsto: item.valor_previsto,
        observacoes: item.observacoes || null,
      }));

      const { error: insertError } = await supabase
        .from("orcamento_detalhado")
        .insert(registros);

      if (insertError) {
        console.error("Erro ao inserir detalhamento:", insertError);
        return NextResponse.json(
          { error: "Erro ao salvar detalhamento" },
          { status: 500 }
        );
      }
    }

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

    const { error } = await supabase
      .from("orcamento_detalhado")
      .delete()
      .eq("etapa_id", etapaId);

    if (error) {
      console.error("Erro ao deletar detalhamento:", error);
      return NextResponse.json(
        { error: "Erro ao limpar detalhamento" },
        { status: 500 }
      );
    }

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

