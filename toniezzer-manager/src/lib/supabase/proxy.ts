import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rotas publicas que nao precisam de autenticacao
  const publicRoutes = ['/login', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Se e rota publica, nao precisa verificar autenticacao
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Tentar verificar autenticacao com tratamento de erro
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[Proxy] Erro ao verificar usuario:', error.message)
    } else {
      user = data.user
    }
  } catch (error) {
    // Erro de rede/DNS - logar e permitir que o request continue
    // O cliente fara a verificacao de autenticacao
    console.error('[Proxy] Falha de conexao com Supabase:', error instanceof Error ? error.message : error)
    // Retornar a resposta sem bloquear - o cliente verificara a auth
    return supabaseResponse
  }

  // Se nao esta logado e tenta acessar rota protegida
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se esta logado e tenta acessar pagina de login (ja tratado acima, mas por seguranca)
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
