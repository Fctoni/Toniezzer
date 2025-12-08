export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome_completo: string
          telefone: string | null
          especialidade: string | null
          avatar_url: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_completo: string
          telefone?: string | null
          especialidade?: string | null
          avatar_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          telefone?: string | null
          especialidade?: string | null
          avatar_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nome: string
          cor: string
          icone: string | null
          ordem: number
          orcamento: number | null
          ativo: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cor: string
          icone?: string | null
          ordem?: number
          orcamento?: number | null
          ativo?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string
          icone?: string | null
          ordem?: number
          orcamento?: number | null
          ativo?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subcategorias: {
        Row: {
          id: string
          categoria_id: string
          nome: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          categoria_id: string
          nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          categoria_id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      centros_custo: {
        Row: {
          id: string
          nome: string
          codigo: string | null
          descricao: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo?: string | null
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string | null
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      fornecedores: {
        Row: {
          id: string
          nome: string
          cnpj_cpf: string | null
          email: string | null
          telefone: string | null
          endereco: string | null
          tipo: string | null
          especialidade: string | null
          avaliacao: number | null
          comentario_avaliacao: string | null
          ativo: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj_cpf?: string | null
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          tipo?: string | null
          especialidade?: string | null
          avaliacao?: number | null
          comentario_avaliacao?: string | null
          ativo?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj_cpf?: string | null
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          tipo?: string | null
          especialidade?: string | null
          avaliacao?: number | null
          comentario_avaliacao?: string | null
          ativo?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      etapas: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          status: EtapaStatus
          data_inicio_prevista: string | null
          data_fim_prevista: string | null
          data_inicio_real: string | null
          data_fim_real: string | null
          responsavel_id: string | null
          progresso_percentual: number
          progresso_manual: boolean
          ordem: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          status?: EtapaStatus
          data_inicio_prevista?: string | null
          data_fim_prevista?: string | null
          data_inicio_real?: string | null
          data_fim_real?: string | null
          responsavel_id?: string | null
          progresso_percentual?: number
          progresso_manual?: boolean
          ordem: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          status?: EtapaStatus
          data_inicio_prevista?: string | null
          data_fim_prevista?: string | null
          data_inicio_real?: string | null
          data_fim_real?: string | null
          responsavel_id?: string | null
          progresso_percentual?: number
          progresso_manual?: boolean
          ordem?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      etapas_dependencias: {
        Row: {
          id: string
          etapa_id: string
          depende_de_etapa_id: string
          tipo: 'obrigatoria' | 'recomendada'
          created_at: string
        }
        Insert: {
          id?: string
          etapa_id: string
          depende_de_etapa_id: string
          tipo: 'obrigatoria' | 'recomendada'
          created_at?: string
        }
        Update: {
          id?: string
          etapa_id?: string
          depende_de_etapa_id?: string
          tipo?: 'obrigatoria' | 'recomendada'
          created_at?: string
        }
      }
      gastos: {
        Row: {
          id: string
          descricao: string
          valor: number
          data: string
          categoria_id: string
          subcategoria_id: string | null
          fornecedor_id: string | null
          forma_pagamento: FormaPagamento
          parcelas: number
          parcela_atual: number | null
          nota_fiscal_url: string | null
          nota_fiscal_numero: string | null
          etapa_relacionada_id: string | null
          centro_custo_id: string | null
          status: GastoStatus
          aprovado_por: string | null
          aprovado_em: string | null
          criado_por: string | null
          criado_via: CriadoVia
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          descricao: string
          valor: number
          data: string
          categoria_id: string
          subcategoria_id?: string | null
          fornecedor_id?: string | null
          forma_pagamento: FormaPagamento
          parcelas?: number
          parcela_atual?: number | null
          nota_fiscal_url?: string | null
          nota_fiscal_numero?: string | null
          etapa_relacionada_id?: string | null
          centro_custo_id?: string | null
          status?: GastoStatus
          aprovado_por?: string | null
          aprovado_em?: string | null
          criado_por?: string | null
          criado_via?: CriadoVia
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          valor?: number
          data?: string
          categoria_id?: string
          subcategoria_id?: string | null
          fornecedor_id?: string | null
          forma_pagamento?: FormaPagamento
          parcelas?: number
          parcela_atual?: number | null
          nota_fiscal_url?: string | null
          nota_fiscal_numero?: string | null
          etapa_relacionada_id?: string | null
          centro_custo_id?: string | null
          status?: GastoStatus
          aprovado_por?: string | null
          aprovado_em?: string | null
          criado_por?: string | null
          criado_via?: CriadoVia
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documentos: {
        Row: {
          id: string
          nome: string
          tipo: DocumentoTipo
          url: string
          tamanho_bytes: number | null
          mime_type: string | null
          etapa_relacionada_id: string | null
          gasto_relacionado_id: string | null
          versao: number
          documento_pai_id: string | null
          tags: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: DocumentoTipo
          url: string
          tamanho_bytes?: number | null
          mime_type?: string | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          versao?: number
          documento_pai_id?: string | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: DocumentoTipo
          url?: string
          tamanho_bytes?: number | null
          mime_type?: string | null
          etapa_relacionada_id?: string | null
          gasto_relacionado_id?: string | null
          versao?: number
          documento_pai_id?: string | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          usuario_id: string | null
          tipo: NotificacaoTipo
          titulo: string
          mensagem: string
          link: string | null
          lida: boolean
          lida_em: string | null
          origem_id: string | null
          origem_tipo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          tipo: NotificacaoTipo
          titulo: string
          mensagem: string
          link?: string | null
          lida?: boolean
          lida_em?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          tipo?: NotificacaoTipo
          titulo?: string
          mensagem?: string
          link?: string | null
          lida?: boolean
          lida_em?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          created_at?: string
        }
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
  }
}

// Enums
export type EtapaStatus = 
  | 'nao_iniciada' 
  | 'em_andamento' 
  | 'aguardando_aprovacao' 
  | 'aguardando_qualidade' 
  | 'em_retrabalho' 
  | 'pausada' 
  | 'atrasada' 
  | 'concluida'

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao' | 'boleto' | 'cheque'

export type GastoStatus = 'pendente_aprovacao' | 'aprovado' | 'rejeitado'

export type CriadoVia = 'manual' | 'email' | 'ocr' | 'bancario'

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

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

