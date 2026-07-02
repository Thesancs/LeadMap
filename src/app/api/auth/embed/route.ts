import { NextRequest, NextResponse } from 'next/server'
import { verifyEmbedToken } from '@/lib/embed-token'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Rota de auto-login para uso em iFrame (ex: Custom Menu Link do GoHighLevel).
 *
 * Fluxo:
 * 1. Recebe um JWT assinado (?token=...) gerado com createEmbedToken().
 * 2. Valida o token (assinatura, issuer, audience, expiração).
 * 3. Gera um magic link de uso único no Supabase para o e-mail do token.
 * 4. Troca esse magic link por uma sessão real, gravando os cookies do
 *    Supabase na resposta — o usuário fica "logado" sem digitar senha.
 * 5. Redireciona para a aplicação (ou para /login em caso de falha).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const redirectTo = request.nextUrl.searchParams.get('redirect_to') || '/'

  if (!token) {
    return redirectToLogin(request, 'token_ausente')
  }

  try {
    const { email } = await verifyEmbedToken(token)

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (error || !data?.properties?.hashed_token) {
      console.error('[embed] Erro ao gerar magic link:', error)
      return redirectToLogin(request, 'usuario_nao_encontrado')
    }

    const supabase = await createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash: data.properties.hashed_token,
    })

    if (verifyError) {
      console.error('[embed] Erro ao trocar hashed_token por sessão:', verifyError)
      return redirectToLogin(request, 'sessao_invalida')
    }

    const url = request.nextUrl.clone()
    url.pathname = redirectTo.startsWith('/') ? redirectTo : '/'
    url.search = ''
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[embed] Token de auto-login inválido:', err)
    return redirectToLogin(request, 'token_invalido')
  }
}

function redirectToLogin(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?error=${reason}`
  return NextResponse.redirect(url)
}
