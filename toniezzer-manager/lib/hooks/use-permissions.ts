'use client'

import { useUser } from './use-user'
import type { User, Etapa, Gasto, UserPerfil } from '@/lib/types/database'

interface PermissionsReturn {
  // Current user info
  user: User | null
  perfil: UserPerfil | null
  isLoading: boolean
  
  // Check functions
  isAdmin: () => boolean
  isAdminObra: () => boolean
  isArquiteto: () => boolean
  isPrestador: () => boolean
  isVisualizador: () => boolean
  
  // Permission checks
  can: {
    // Financeiro
    verGastos: (gasto?: Gasto) => boolean
    verFinanceiroCompleto: () => boolean
    lancarGasto: () => boolean
    editarGasto: (gasto: Gasto) => boolean
    aprovarGasto: () => boolean
    
    // Etapas
    verEtapas: () => boolean
    criarEtapa: () => boolean
    editarEtapa: (etapa: Etapa) => boolean
    solicitarConclusaoEtapa: (etapa: Etapa) => boolean
    aprovarEtapa: () => boolean
    preencherChecklist: () => boolean
    
    // Documentos
    verDocumentos: () => boolean
    uploadDocumentos: () => boolean
    deletarDocumentos: () => boolean
    
    // Fornecedores
    verFornecedores: () => boolean
    criarFornecedor: () => boolean
    editarFornecedor: () => boolean
    
    // Comunicacao
    verFeed: () => boolean
    postarNoFeed: () => boolean
    
    // Mudancas de Escopo
    sugerirMudanca: () => boolean
    aprovarMudanca: () => boolean
    
    // Configuracoes
    acessarConfiguracoes: () => boolean
    gerenciarUsuarios: () => boolean
  }
}

/**
 * Hook to check user permissions based on profile
 * Implements the permission matrix from PRD section 5.1
 */
export function usePermissions(): PermissionsReturn {
  const { user, isLoading } = useUser()
  
  const perfil = user?.perfil ?? null

  // Role checks
  const isAdmin = () => perfil === 'admin_sistema'
  const isAdminObra = () => perfil === 'admin_obra'
  const isArquiteto = () => perfil === 'arquiteto'
  const isPrestador = () => perfil === 'prestador'
  const isVisualizador = () => perfil === 'visualizador'

  const can = {
    // Financeiro
    verGastos: (gasto?: Gasto) => {
      if (isAdmin()) return true
      if (isAdminObra()) {
        // Admin obra ve gastos das suas etapas ou gastos gerais
        if (!gasto) return true
        return gasto.etapa_relacionada_id === null || 
               gasto.criado_por === user?.id
      }
      if (isPrestador()) {
        // Prestador ve so seus pagamentos
        if (!gasto) return true
        return gasto.fornecedor_id !== null // simplified, should check if supplier is linked to user
      }
      if (isArquiteto()) return true // ve macro, sem detalhes de NF
      return false
    },
    
    verFinanceiroCompleto: () => {
      return isAdmin()
    },
    
    lancarGasto: () => {
      return isAdmin() || isAdminObra()
    },
    
    editarGasto: (gasto: Gasto) => {
      if (isAdmin()) return true
      if (isAdminObra() && gasto.status === 'pendente_aprovacao') {
        return gasto.criado_por === user?.id
      }
      return false
    },
    
    aprovarGasto: () => {
      return isAdmin()
    },
    
    // Etapas
    verEtapas: () => {
      // Todos podem ver etapas
      return !!perfil
    },
    
    criarEtapa: () => {
      return isAdmin() || isAdminObra()
    },
    
    editarEtapa: (etapa: Etapa) => {
      if (isAdmin() || isAdminObra()) return true
      if (isPrestador()) {
        return etapa.responsavel_id === user?.id
      }
      return false
    },
    
    solicitarConclusaoEtapa: (etapa: Etapa) => {
      if (isAdmin() || isAdminObra()) return true
      return etapa.responsavel_id === user?.id
    },
    
    aprovarEtapa: () => {
      return isAdmin() || isAdminObra()
    },
    
    preencherChecklist: () => {
      return isAdmin() || isAdminObra() || isArquiteto()
    },
    
    // Documentos
    verDocumentos: () => {
      // Todos podem ver documentos (RLS controla visibilidade)
      return !!perfil
    },
    
    uploadDocumentos: () => {
      return perfil !== 'visualizador'
    },
    
    deletarDocumentos: () => {
      return isAdmin()
    },
    
    // Fornecedores
    verFornecedores: () => {
      // Visualizador nao ve
      return perfil !== 'visualizador'
    },
    
    criarFornecedor: () => {
      return isAdmin() || isAdminObra()
    },
    
    editarFornecedor: () => {
      return isAdmin() || isAdminObra()
    },
    
    // Comunicacao
    verFeed: () => {
      return !!perfil
    },
    
    postarNoFeed: () => {
      return perfil !== 'visualizador'
    },
    
    // Mudancas de Escopo
    sugerirMudanca: () => {
      return perfil !== 'visualizador'
    },
    
    aprovarMudanca: () => {
      return isAdmin()
    },
    
    // Configuracoes
    acessarConfiguracoes: () => {
      return isAdmin()
    },
    
    gerenciarUsuarios: () => {
      return isAdmin()
    },
  }

  return {
    user,
    perfil,
    isLoading,
    isAdmin,
    isAdminObra,
    isArquiteto,
    isPrestador,
    isVisualizador,
    can,
  }
}

