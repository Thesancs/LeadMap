// Gera um token JWT de auto-login para embutir o LeadMap em iFrame (ex: GHL).
//
// Uso:
//   npm run generate-embed-token -- usuario@empresa.com
//   npm run generate-embed-token -- usuario@empresa.com 7d
//
// Requer EMBED_JWT_SECRET definido em .env.local (o script já carrega o
// arquivo automaticamente via `node --env-file=.env.local`).

import { SignJWT } from 'jose'

const [, , email, expiresIn = '15m'] = process.argv

if (!email) {
  console.error('\nUso: npm run generate-embed-token -- <email> [duracao]')
  console.error('Exemplo: npm run generate-embed-token -- ana@nexya.com 7d\n')
  process.exit(1)
}

const secret = process.env.EMBED_JWT_SECRET

if (!secret) {
  console.error('\nEMBED_JWT_SECRET não encontrado em .env.local.')
  console.error('Gere um valor aleatório e adicione ao .env.local, ex:')
  console.error('  EMBED_JWT_SECRET=' + crypto.randomUUID() + crypto.randomUUID() + '\n')
  process.exit(1)
}

const key = new TextEncoder().encode(secret)

const token = await new SignJWT({ email })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setIssuer('leadmap-embed')
  .setAudience('leadmap-ghl-iframe')
  .setExpirationTime(expiresIn)
  .sign(key)

const baseUrl = process.env.EMBED_BASE_URL || 'https://leadmapallin.vercel.app'

console.log('\nToken gerado (expira em ' + expiresIn + '):\n')
console.log(token)
console.log('\nURL pronta para colar no Custom Menu Link (iFrame) do GHL:\n')
console.log(`${baseUrl}/api/auth/embed?token=${token}\n`)
