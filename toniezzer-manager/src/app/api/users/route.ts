import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Cliente admin com service_role key para operacoes privilegiadas
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Verificar se usuario atual e admin
async function isCurrentUserAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) return false
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()
  
  return profile?.role === 'admin'
}

// POST - Criar novo usuario
export async function POST(request: Request) {
  try {
    // Verificar se e admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, nome_completo, role, especialidade, telefone } = body

    // Validacoes
    if (!email || !password || !nome_completo || !role) {
      return NextResponse.json(
        { error: 'Email, senha, nome e role sao obrigatorios' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role invalido. Use: admin, editor ou viewer' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Criar usuario no Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome: nome_completo
      }
    })

    if (authError) {
      console.error('Erro ao criar usuario no Auth:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 2. Criar perfil na tabela public.users
    const { data: profileData, error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id, // Usar mesmo ID do auth
        email,
        nome_completo,
        role,
        especialidade: especialidade || null,
        telefone: telefone || null,
        ativo: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Se falhou ao criar perfil, deletar usuario do Auth
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: profileData
    })

  } catch (error) {
    console.error('Erro ao criar usuario:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar usuario existente
export async function PATCH(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, nome_completo, role, especialidade, telefone, ativo, nova_senha } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuario e obrigatorio' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Atualizar perfil na tabela public.users
    const updateData: Record<string, unknown> = {}
    if (nome_completo !== undefined) updateData.nome_completo = nome_completo
    if (role !== undefined) updateData.role = role
    if (especialidade !== undefined) updateData.especialidade = especialidade
    if (telefone !== undefined) updateData.telefone = telefone
    if (ativo !== undefined) updateData.ativo = ativo

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await adminClient
        .from('users')
        .update(updateData)
        .eq('id', id)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
        return NextResponse.json(
          { error: 'Erro ao atualizar perfil' },
          { status: 500 }
        )
      }
    }

    // Se tiver nova senha, atualizar no Auth
    if (nova_senha) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        id,
        { password: nova_senha }
      )

      if (authError) {
        console.error('Erro ao atualizar senha:', authError)
        return NextResponse.json(
          { error: 'Erro ao atualizar senha' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar usuario:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Desativar usuario (soft delete)
export async function DELETE(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem desativar usuarios' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuario e obrigatorio' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Soft delete - apenas desativar
    const { error } = await adminClient
      .from('users')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar usuario:', error)
      return NextResponse.json(
        { error: 'Erro ao desativar usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao desativar usuario:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
