import { SignJWT, jwtVerify } from 'jose'

/**
 * Token de auto-login usado para embutir o LeadMap dentro de um iFrame
 * (ex: Custom Menu Link do GoHighLevel).
 *
 * Este token NÃO é a sessão do Supabase — é um "convite" assinado com um
 * segredo próprio (EMBED_JWT_SECRET) que, se válido, autoriza o backend a
 * criar uma sessão real do Supabase para o e-mail informado (via magic link).
 */

const EMBED_ISSUER = 'leadmap-embed'
const EMBED_AUDIENCE = 'leadmap-ghl-iframe'

function getSecretKey() {
  const secret = process.env.EMBED_JWT_SECRET
  if (!secret) {
    throw new Error('EMBED_JWT_SECRET não está configurado nas variáveis de ambiente.')
  }
  return new TextEncoder().encode(secret)
}

export interface EmbedTokenPayload {
  email: string
}

/**
 * Cria um token de auto-login para um e-mail específico.
 * @param email E-mail do usuário que já existe no Supabase Auth.
 * @param expiresIn Duração do token (ex: '15m', '1h', '7d'). Use o menor
 *                   prazo que fizer sentido para o seu caso de uso.
 */
export async function createEmbedToken(email: string, expiresIn: string = '15m') {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(EMBED_ISSUER)
    .setAudience(EMBED_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(getSecretKey())
}

/**
 * Valida o token de auto-login. Lança erro se estiver expirado, com
 * assinatura inválida, ou com issuer/audience incorretos.
 */
export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    issuer: EMBED_ISSUER,
    audience: EMBED_AUDIENCE,
  })

  if (typeof payload.email !== 'string' || !payload.email) {
    throw new Error('Token inválido: e-mail ausente no payload.')
  }

  return { email: payload.email }
}
