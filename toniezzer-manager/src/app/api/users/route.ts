import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { TablesUpdate } from '@/lib/types/database'
import { isAdmin as verificarAdmin, criarUsuario, atualizarUsuario, desativarUsuario } from '@/lib/services/users'

// ===== Zod Schemas =====

const criarUsuarioSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  nome_completo: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'Role deve ser admin, editor ou viewer' }),
  especialidade: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
})

const atualizarUsuarioSchema = z.object({
  id: z.string().uuid('ID invalido'),
  nome_completo: z.string().min(2).optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  especialidade: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  nova_senha: z.string().min(6).optional(),
})

// Verificar se usuario atual e admin
async function isCurrentUserAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) return false

  return await verificarAdmin(supabase, user.email)
}

// POST - Criar novo usuario
export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const resultado = criarUsuarioSchema.safeParse(body)
    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, nome_completo, role, especialidade, telefone } = resultado.data

    const adminClient = createAdminClient()

    // 1. Criar usuario no Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
    try {
      const profileData = await criarUsuario(adminClient, {
        id: authData.user.id,
        email,
        nome_completo,
        role,
        especialidade: especialidade || null,
        telefone: telefone || null,
        ativo: true
      })

      return NextResponse.json({
        success: true,
        user: profileData
      })
    } catch (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Se falhou ao criar perfil, deletar usuario do Auth
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuario' },
        { status: 500 }
      )
    }

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

    const resultado = atualizarUsuarioSchema.safeParse(body)
    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error.issues[0].message },
        { status: 400 }
      )
    }

    const { id, nome_completo, role, especialidade, telefone, ativo, nova_senha } = resultado.data

    const adminClient = createAdminClient()

    // Atualizar perfil na tabela public.users
    const updateData: TablesUpdate<'users'> = {}
    if (nome_completo !== undefined) updateData.nome_completo = nome_completo
    if (role !== undefined) updateData.role = role
    if (especialidade !== undefined) updateData.especialidade = especialidade
    if (telefone !== undefined) updateData.telefone = telefone
    if (ativo !== undefined) updateData.ativo = ativo

    if (Object.keys(updateData).length > 0) {
      try {
        await atualizarUsuario(adminClient, id, updateData)
      } catch (profileError) {
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
    await desativarUsuario(adminClient, id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao desativar usuario:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
