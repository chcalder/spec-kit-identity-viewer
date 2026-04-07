import { type IdTokenClaims } from '@azure/msal-browser'

// hasRole — pure function, no MSAL dependency (FSC-EXPORT-001)
// Default-deny: returns false if claims are absent, roles is not an array, or role not found
export function hasRole(claims: IdTokenClaims | undefined, role: string): boolean {
  if (!claims?.roles || !Array.isArray(claims.roles)) return false
  return claims.roles.includes(role)
}
