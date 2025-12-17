export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          ativo: boolean | null
          cor: string
          created_at: string | null
          created_by: string | null
          icone: string | null
          id: string
          nome: string
          orcamento: number | null
          ordem: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor: string
          created_at?: string | null
          created_by?: string | null
          icone?: string | null
          id?: string
          nome: string
          orcamento?: number | null
          ordem?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          created_by?: string | null
          icone?: string | null
          id?: string
          nome?: string
          orcamento?: number | null
          ordem?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      compras: {
        Row: {
          categoria_id: string
          centro_custo_id: string | null
          created_at: string | null
          criado_por: string | null
          criado_via: string
          data_compra: string
          data_primeira_parcela: string
          descricao: string
          etapa_relacionada_id: string | null
          forma_pagamento: string
          fornecedor_id: string
          id: string
          nota_fiscal_numero: string | null
          nota_fiscal_url: string | null
          observacoes: string | null
          parcelas: number
          parcelas_pagas: number | null
          status: string
          subcategoria_id: string | null
          updated_at: string | null
          valor_pago: number | null
          valor_total: number
        }
        Insert: {
          categoria_id: string
          centro_custo_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          criado_via?: string
          data_compra: string
          data_primeira_parcela: string
          descricao: string
          etapa_relacionada_id?: string | null
          forma_pagamento: string
          fornecedor_id: string
          id?: string
          nota_fiscal_numero?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          parcelas?: number
          parcelas_pagas?: number | null
          status?: string
          subcategoria_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total: number
        }
        Update: {
          categoria_id?: string
          centro_custo_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          criado_via?: string
          data_compra?: string
          data_primeira_parcela?: string
          descricao?: string
          etapa_relacionada_id?: string | null
          forma_pagamento?: string
          fornecedor_id?: string
          id?: string
          nota_fiscal_numero?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          parcelas?: number
          parcelas_pagas?: number | null
          status?: string
          subcategoria_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_etapa_relacionada_id_fkey"
            columns: ["etapa_relacionada_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string | null
          updated_by: string | null
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_sistema_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string | null
          created_by: string | null
          documento_pai_id: string | null
          etapa_relacionada_id: string | null
          gasto_relacionado_id: string | null
          id: string
          mime_type: string | null
          nome: string
          tags: string[] | null
          tamanho_bytes: number | null
          tipo: string
          url: string
          versao: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          documento_pai_id?: string | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          tags?: string[] | null
          tamanho_bytes?: number | null
          tipo: string
          url: string
          versao?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          documento_pai_id?: string | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          tags?: string[] | null
          tamanho_bytes?: number | null
          tipo?: string
          url?: string
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_documento_pai_id_fkey"
            columns: ["documento_pai_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_etapa_relacionada_id_fkey"
            columns: ["etapa_relacionada_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gasto_relacionado_id_fkey"
            columns: ["gasto_relacionado_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_monitorados: {
        Row: {
          anexos: Json | null
          assunto: string
          compra_sugerida_id: string | null
          corpo: string | null
          created_at: string | null
          dados_extraidos: Json | null
          data_recebimento: string
          email_id_externo: string
          erro_mensagem: string | null
          gasto_sugerido_id: string | null
          id: string
          processado_em: string | null
          processado_por: string | null
          remetente: string
          remetente_nome: string | null
          status: string
        }
        Insert: {
          anexos?: Json | null
          assunto: string
          compra_sugerida_id?: string | null
          corpo?: string | null
          created_at?: string | null
          dados_extraidos?: Json | null
          data_recebimento: string
          email_id_externo: string
          erro_mensagem?: string | null
          gasto_sugerido_id?: string | null
          id?: string
          processado_em?: string | null
          processado_por?: string | null
          remetente: string
          remetente_nome?: string | null
          status?: string
        }
        Update: {
          anexos?: Json | null
          assunto?: string
          compra_sugerida_id?: string | null
          corpo?: string | null
          created_at?: string | null
          dados_extraidos?: Json | null
          data_recebimento?: string
          email_id_externo?: string
          erro_mensagem?: string | null
          gasto_sugerido_id?: string | null
          id?: string
          processado_em?: string | null
          processado_por?: string | null
          remetente?: string
          remetente_nome?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_monitorados_compra_sugerida_id_fkey"
            columns: ["compra_sugerida_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_monitorados_gasto_sugerido_id_fkey"
            columns: ["gasto_sugerido_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_monitorados_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          id: string
          nome: string
          orcamento: number | null
          ordem: number
          progresso_manual: boolean | null
          progresso_percentual: number | null
          responsavel_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome: string
          orcamento?: number | null
          ordem: number
          progresso_manual?: boolean | null
          progresso_percentual?: number | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          orcamento?: number | null
          ordem?: number
          progresso_manual?: boolean | null
          progresso_percentual?: number | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_dependencias: {
        Row: {
          created_at: string | null
          depende_de_etapa_id: string
          etapa_id: string
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          depende_de_etapa_id: string
          etapa_id: string
          id?: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          depende_de_etapa_id?: string
          etapa_id?: string
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_dependencias_depende_de_etapa_id_fkey"
            columns: ["depende_de_etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_dependencias_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comentarios: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string | null
          editado: boolean | null
          feed_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string | null
          editado?: boolean | null
          feed_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string | null
          editado?: boolean | null
          feed_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comentarios_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feed_comunicacao"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comunicacao: {
        Row: {
          anexos: Json | null
          autor_id: string
          conteudo: string
          created_at: string | null
          editado: boolean | null
          etapa_relacionada_id: string | null
          gasto_relacionado_id: string | null
          id: string
          mencoes: string[] | null
          reuniao_relacionada_id: string | null
          tipo: string
          topico_id: string | null
          updated_at: string | null
        }
        Insert: {
          anexos?: Json | null
          autor_id: string
          conteudo: string
          created_at?: string | null
          editado?: boolean | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          id?: string
          mencoes?: string[] | null
          reuniao_relacionada_id?: string | null
          tipo: string
          topico_id?: string | null
          updated_at?: string | null
        }
        Update: {
          anexos?: Json | null
          autor_id?: string
          conteudo?: string
          created_at?: string | null
          editado?: boolean | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          id?: string
          mencoes?: string[] | null
          reuniao_relacionada_id?: string | null
          tipo?: string
          topico_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comunicacao_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comunicacao_etapa_relacionada_id_fkey"
            columns: ["etapa_relacionada_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comunicacao_gasto_relacionado_id_fkey"
            columns: ["gasto_relacionado_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comunicacao_reuniao_relacionada_id_fkey"
            columns: ["reuniao_relacionada_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comunicacao_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos_comunicacao"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          avaliacao: number | null
          cnpj_cpf: string | null
          comentario_avaliacao: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          endereco: string | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avaliacao?: number | null
          cnpj_cpf?: string | null
          comentario_avaliacao?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avaliacao?: number | null
          cnpj_cpf?: string | null
          comentario_avaliacao?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          categoria_id: string
          centro_custo_id: string | null
          compra_id: string | null
          comprovante_pagamento_url: string | null
          created_at: string | null
          criado_por: string | null
          criado_via: string
          data: string
          descricao: string
          etapa_relacionada_id: string | null
          forma_pagamento: string
          fornecedor_id: string | null
          id: string
          nota_fiscal_numero: string | null
          nota_fiscal_url: string | null
          observacoes: string | null
          pago: boolean | null
          pago_em: string | null
          parcela_atual: number | null
          parcelas: number | null
          status: string
          subcategoria_id: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          categoria_id: string
          centro_custo_id?: string | null
          compra_id?: string | null
          comprovante_pagamento_url?: string | null
          created_at?: string | null
          criado_por?: string | null
          criado_via?: string
          data: string
          descricao: string
          etapa_relacionada_id?: string | null
          forma_pagamento: string
          fornecedor_id?: string | null
          id?: string
          nota_fiscal_numero?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          pago?: boolean | null
          pago_em?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string
          subcategoria_id?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          categoria_id?: string
          centro_custo_id?: string | null
          compra_id?: string | null
          comprovante_pagamento_url?: string | null
          created_at?: string | null
          criado_por?: string | null
          criado_via?: string
          data?: string
          descricao?: string
          etapa_relacionada_id?: string | null
          forma_pagamento?: string
          fornecedor_id?: string | null
          id?: string
          nota_fiscal_numero?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          pago?: boolean | null
          pago_em?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string
          subcategoria_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_etapa_relacionada_id_fkey"
            columns: ["etapa_relacionada_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          link: string | null
          mensagem: string
          origem_id: string | null
          origem_tipo: string | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem?: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_detalhado: {
        Row: {
          id: string
          etapa_id: string
          categoria_id: string
          valor_previsto: number
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          etapa_id: string
          categoria_id: string
          valor_previsto: number
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          etapa_id?: string
          categoria_id?: string
          valor_previsto?: number
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_detalhado_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_detalhado_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          arquivo_original_url: string | null
          created_at: string | null
          created_by: string
          data_reuniao: string
          id: string
          participantes: string[] | null
          resumo_markdown: string
          titulo: string
        }
        Insert: {
          arquivo_original_url?: string | null
          created_at?: string | null
          created_by: string
          data_reuniao: string
          id?: string
          participantes?: string[] | null
          resumo_markdown: string
          titulo: string
        }
        Update: {
          arquivo_original_url?: string | null
          created_at?: string | null
          created_by?: string
          data_reuniao?: string
          id?: string
          participantes?: string[] | null
          resumo_markdown?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes_acoes: {
        Row: {
          categoria_id: string | null
          compra_criada_id: string | null
          created_at: string | null
          descricao: string
          etapa_id: string | null
          feed_criado_id: string | null
          gasto_criado_id: string | null
          id: string
          prazo: string | null
          responsavel_id: string | null
          reuniao_id: string
          status: string
          tipo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          categoria_id?: string | null
          compra_criada_id?: string | null
          created_at?: string | null
          descricao: string
          etapa_id?: string | null
          feed_criado_id?: string | null
          gasto_criado_id?: string | null
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id: string
          status?: string
          tipo: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          categoria_id?: string | null
          compra_criada_id?: string | null
          created_at?: string | null
          descricao?: string
          etapa_id?: string | null
          feed_criado_id?: string | null
          gasto_criado_id?: string | null
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id?: string
          status?: string
          tipo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_acoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_compra_criada_id_fkey"
            columns: ["compra_criada_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_feed_criado_id_fkey"
            columns: ["feed_criado_id"]
            isOneToOne: false
            referencedRelation: "feed_comunicacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_gasto_criado_id_fkey"
            columns: ["gasto_criado_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_acoes_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias: {
        Row: {
          ativo: boolean | null
          categoria_id: string
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id: string
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          etapa_id: string
          id: string
          nome: string
          ordem: number
          peso_percentual: number | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          etapa_id: string
          id?: string
          nome: string
          ordem: number
          peso_percentual?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          etapa_id?: string
          id?: string
          nome?: string
          ordem?: number
          peso_percentual?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topicos_comunicacao: {
        Row: {
          autor_id: string
          created_at: string | null
          descricao: string | null
          etapa_relacionada_id: string | null
          fixado: boolean | null
          id: string
          prioridade: string
          status: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          created_at?: string | null
          descricao?: string | null
          etapa_relacionada_id?: string | null
          fixado?: boolean | null
          id?: string
          prioridade?: string
          status?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          created_at?: string | null
          descricao?: string | null
          etapa_relacionada_id?: string | null
          fixado?: boolean | null
          id?: string
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topicos_comunicacao_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topicos_comunicacao_etapa_relacionada_id_fkey"
            columns: ["etapa_relacionada_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          especialidade: string | null
          id: string
          nome_completo: string
          role: UserRole
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome_completo: string
          role?: UserRole
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome_completo?: string
          role?: UserRole
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Helper types
export type EtapaStatus = 'nao_iniciada' | 'em_andamento' | 'aguardando_aprovacao' | 'aguardando_qualidade' | 'em_retrabalho' | 'pausada' | 'atrasada' | 'concluida'

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao' | 'boleto' | 'cheque'

export type GastoStatus = 'pendente_aprovacao' | 'aprovado' | 'rejeitado'

export type CriadoVia = 'manual' | 'email' | 'ocr' | 'bancario'

export type CompraStatus = 'ativa' | 'quitada' | 'cancelada'

export type CompraCriadoVia = 'manual' | 'email' | 'ocr' | 'plaud'

export type DocumentoTipo = 'foto' | 'planta' | 'contrato' | 'nota_fiscal' | 'outro'

export type NotificacaoTipo = 
  | 'orcamento_80' 
  | 'orcamento_100' 
  | 'etapa_atrasada' 
  | 'etapa_aguardando'
  | 'mencao' 
  | 'gasto_aprovacao'
  | 'mudanca_escopo'
  | 'email_novo'
  | 'tarefa_atribuida'
  | 'sistema'

export type FeedTipo = 'post' | 'decisao' | 'alerta' | 'sistema'

export type TopicoStatus = 'aberto' | 'resolvido' | 'arquivado'

export type TopicoPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente'

export type EmailStatus =
  | 'nao_processado'
  | 'processando'
  | 'aguardando_revisao'
  | 'processado'
  | 'erro'
  | 'ignorado'

export type AcaoTipo = 'decisao' | 'tarefa' | 'gasto' | 'problema' | 'mudanca_escopo'

export type AcaoStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'

export type UserRole = 'admin' | 'editor' | 'viewer'
