'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ConfiguracoesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirecionar para a aba de usuarios por padrao
    router.replace('/configuracoes/usuarios')
  }, [router])

  return null
}
