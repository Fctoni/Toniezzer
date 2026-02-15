import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type User = Tables<'users'>

// ===== SELECT =====

export async function fetchUsers(supabase: TypedSupabaseClient): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('nome_completo')
  if (error) throw error
  return data
}

export async function fetchActiveUsers(supabase: TypedSupabaseClient): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').eq('ativo', true).order('nome_completo')
  if (error) throw error
  return data
}

export async function fetchUsersForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<User, 'id' | 'nome_completo'>[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, nome_completo')
    .eq('ativo', true)
  if (error) throw error
  return data
}

export async function fetchUserByEmail(
  supabase: TypedSupabaseClient,
  email: string
): Promise<Pick<User, 'id'>> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  if (error) throw error
  return data
}

export async function fetchFirstUser(
  supabase: TypedSupabaseClient
): Promise<Pick<User, 'id'>> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single()
  if (error) throw error
  return data
}

export async function isAdmin(
  supabase: TypedSupabaseClient,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .single()
  return data?.role === 'admin'
}

// ===== INSERT =====

export async function createUser(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'users'>
): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return user
}

// ===== UPDATE =====

export async function updateUser(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'users'>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateUser(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ ativo: false })
    .eq('id', id)
  if (error) throw error
}
