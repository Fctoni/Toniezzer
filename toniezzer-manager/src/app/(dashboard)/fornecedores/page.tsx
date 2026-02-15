import { createClient } from '@/lib/supabase/server'
import { fetchSuppliers } from '@/lib/services/fornecedores'
import { FornecedoresPageClient } from '@/components/features/fornecedores/fornecedores-page-client'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const fornecedores = await fetchSuppliers(supabase)
  return <FornecedoresPageClient initialFornecedores={fornecedores} />
}
