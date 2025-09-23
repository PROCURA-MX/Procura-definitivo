import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

interface TokenPayload {
  jti: string
  sub: string // patientId
  orgId: string
  scope: 'patient-questionnaire'
  aud: '/cuestionario'
}

const USED_JTIS: Map<string, number> = new Map()

function isJtiUsed(jti: string): boolean {
  const exp = USED_JTIS.get(jti)
  if (!exp) return false
  if (Date.now() > exp) {
    USED_JTIS.delete(jti)
    return false
  }
  return true
}

export function markJtiUsed(jti: string, ttlMs: number = 1000 * 60 * 60 * 24): void {
  USED_JTIS.set(jti, Date.now() + ttlMs)
}

export function issueQuestionnaireToken(opts: { patientId: string; orgId: string; expiresIn?: string }): string {
  const secret = process.env.JWT_SECRET || 'supersecreto123'
  const payload: TokenPayload = {
    jti: randomUUID(),
    sub: opts.patientId,
    orgId: opts.orgId,
    scope: 'patient-questionnaire',
    aud: '/cuestionario'
  }
  return jwt.sign(payload, secret, { expiresIn: opts.expiresIn || '48h' })
}

export function verifyQuestionnaireToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET || 'supersecreto123'
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload
  const { jti, sub, orgId, scope, aud } = decoded as any
  if (!jti || !sub || !orgId || scope !== 'patient-questionnaire' || aud !== '/cuestionario') {
    throw new Error('Invalid token scope')
  }
  if (isJtiUsed(jti)) throw new Error('Token already used')
  return { jti, sub, orgId, scope, aud }
}


