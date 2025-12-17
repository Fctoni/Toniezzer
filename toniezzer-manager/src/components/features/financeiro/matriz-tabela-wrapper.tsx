"use client";

import { useState } from "react";
import { MatrizTabela } from "./matriz-tabela";
import { GastosDetalhesModal } from "./gastos-detalhes-modal";

interface LinhaMatriz {
  categoria_id: string;
  categoria_nome: string;
  categoria_cor: string;
  gastos_por_etapa: Record<string, number>;
  total_categoria: number;
}

interface ColunaEtapa {
  etapa_id: string | 'sem_etapa';
  etapa_nome: string;
  etapa_ordem: number;
  total_etapa: number;
}

interface MatrizTabelaWrapperProps {
  linhas: LinhaMatriz[];
  colunas: ColunaEtapa[];
}

export function MatrizTabelaWrapper({ linhas, colunas }: MatrizTabelaWrapperProps) {
  const [modalData, setModalData] = useState<{
    categoriaId: string;
    categoriaNome: string;
    etapaId: string;
    etapaNome: string;
    valor: number;
  } | null>(null);

  const handleCellClick = (categoriaId: string, etapaId: string, valor: number) => {
    // Encontrar nomes
    const categoria = linhas.find((l) => l.categoria_id === categoriaId);
    const etapa = colunas.find((c) => c.etapa_id === etapaId);

    if (categoria && etapa) {
      setModalData({
        categoriaId,
        categoriaNome: categoria.categoria_nome,
        etapaId,
        etapaNome: etapa.etapa_nome,
        valor,
      });
    }
  };

  return (
    <>
      <MatrizTabela
        linhas={linhas}
        colunas={colunas}
        onCellClick={handleCellClick}
      />

      {modalData && (
        <GastosDetalhesModal
          open={!!modalData}
          onOpenChange={(open) => !open && setModalData(null)}
          categoriaId={modalData.categoriaId}
          categoriaNome={modalData.categoriaNome}
          etapaId={modalData.etapaId}
          etapaNome={modalData.etapaNome}
          valorTotal={modalData.valor}
        />
      )}
    </>
  );
}

