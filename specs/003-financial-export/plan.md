# Implementation Plan: High-Sensitivity Financial Export

**Branch**: `003-financial-export` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Lab**: Lab 3
**Status**: Draft

---

## Lab 3 Intent

Lab 3 demonstrates **Layered Governance** in practice. The GGS standards from the constitution are the security floor — this plan inherits all five without modification. On top of that floor, three Feature-Specific Controls (FSCs) raise the bar for this high-risk surface: step-up RBAC, PII masking, and an audit trail.

The architectural consequence is visible in the file structure: security utilities are isolated (`securityUtils.ts`, `mask.ts`), the UI component (`FinancialExportCard`) is a pure display component with no security logic, and the orchestration layer (`Dashboard`) wires them together. This mirrors the Lab 2 pattern — separation of concerns is not just a code quality principle here; it is the mechanism that makes each FSC independently auditable.

---

## GGS Compliance Check (constitution v3.0.0)

| Standard | Check | Status |
|---|---|---|
| GGS-001 | Export feature inaccessible to unauthenticated users | ✅ PASS — render gate + invocation gate both require authenticated account |
| GGS-002 | No hardcoded secrets; PKCE only | ✅ PASS — App Insights key via `VITE_APPINSIGHTS_CONNECTION_STRING` env var; no new secrets |
| GGS-003 | `acquireTokenSilent` for all API calls | ✅ PASS — any future backend export call uses `acquireTokenSilent`; mock payload requires no token |
| GGS-004 | Scopes in `authConfig.ts` only | ✅ PASS — no new scopes introduced |
| GGS-005 | Sanitised rendering; no `dangerouslySetInnerHTML` | ✅ PASS — `FinancialExportCard` renders masked values via standard JSX only |

---

## FSC Compliance Check

| Control | Architectural Enforcement |
|---|---|
| FSC-EXPORT-001 (RBAC) | `hasRole()` in `src/utils/securityUtils.ts`; `AppRole` const in `src/roles.ts`; double-gate in `Dashboard` (render) + `FinancialExportCard` (invocation) |
| FSC-EXPORT-002 (Masking) | `maskAccountNumber()` in `src/utils/mask.ts`; applied before data reaches component props; unmasked value never in JSX |
| FSC-EXPORT-003 (Audit) | `auditExportAttempt()` in `src/services/auditService.ts`; fires before grant or deny; failed telemetry logs warning |

---

## Alignment with Architecture Input

| Architecture Input | Plan Decision |
|---|---|
| `src/utils/securityUtils.js` for RBAC | → `src/utils/securityUtils.ts` (TypeScript) — exports `hasRole(claims, role)` |
| `ExportButton` component | → `FinancialExportCard` component — wraps button + result display; async handler calls audit, checks role, applies mask |
| Regex helper for masking | → `maskAccountNumber()` uses `/(\d{4})$/` regex to extract last 4 digits; handles short values gracefully |
| GGS-003 reference for API call | → Plan explicitly notes `acquireTokenSilent` is required for any real backend integration; mock payload in lab simulates the data without a network call |

---

## Scope of Changes

This plan is **additive only**. Existing components and services from Labs 1 and 2 remain unchanged.

| File | Action | FSC/GGS |
|---|---|---|
| `src/roles.ts` | **Create** — `AppRole` const with `FinancialAuditor = 'Financial.Auditor'` | FSC-EXPORT-001 |
| `src/utils/securityUtils.ts` | **Create** — `hasRole(claims, role): boolean` with default-deny | FSC-EXPORT-001 |
| `src/utils/mask.ts` | **Create** — `maskAccountNumber(value: string): string` with regex | FSC-EXPORT-002 |
| `src/services/auditService.ts` | **Create** — `auditExportAttempt(upn, status)` → App Insights telemetry | FSC-EXPORT-003 |
| `src/types/financial.ts` | **Create** — `FinancialRecord` interface (`accountNumber`, `balance`, `transactionDate`) | — |
| `src/components/FinancialExportCard.tsx` | **Create** — pure display component; button + masked result; async handler | FSC-EXPORT-001, 002 |
| `main.bicep` | **Modify** — add `Financial.Auditor` app role to App Registration manifest | FSC-EXPORT-001 |
| `src/components/Dashboard.tsx` | **Modify** — render `FinancialExportCard` conditionally on `hasRole()` render gate | FSC-EXPORT-001 |

---

## Project Structure (post-Lab 3)

```text
src/
├── authConfig.ts                    # unchanged
├── roles.ts                         # NEW — AppRole const (Financial.Auditor)
├── types/
│   ├── graph.ts                     # unchanged
│   └── financial.ts                 # NEW — FinancialRecord interface
├── utils/
│   ├── securityUtils.ts             # NEW — hasRole(claims, role)
│   └── mask.ts                      # NEW — maskAccountNumber(value)
├── services/
│   ├── graphService.ts              # unchanged
│   └── auditService.ts              # NEW — auditExportAttempt(upn, status)
└── components/
    ├── SignInPage.tsx                # unchanged
    ├── ClaimsTable.tsx              # unchanged
    ├── ProfileCard.tsx              # unchanged
    ├── FinancialExportCard.tsx      # NEW — button + masked result + async handler
    └── Dashboard.tsx                # MODIFIED — render gate + mount FinancialExportCard
```

---

## Architecture: Export Flow

```
Dashboard mounts
       │
       ▼
hasRole(idTokenClaims, AppRole.FinancialAuditor)   ← render gate (FSC-EXPORT-001)
       │
       ├─ false → FinancialExportCard not rendered
       │
       └─ true → <FinancialExportCard claims={idTokenClaims} />
                       │
                       ▼
               User clicks "Export Financial Data"
                       │
                       ▼
       hasRole(claims, AppRole.FinancialAuditor)    ← invocation gate (FSC-EXPORT-001)
                       │
          ┌────────────┴────────────┐
        false                     true
          │                         │
          ▼                         ▼
  auditExportAttempt(          auditExportAttempt(
    upn, 'denied')               upn, 'granted')     ← fires BEFORE action (FSC-EXPORT-003)
          │                         │
          ▼                         ▼
       deny                   fetch/generate mock payload
                                    │
                                    ▼
                         maskAccountNumber(accountNumber)  ← (FSC-EXPORT-002)
                                    │
                                    ▼
                         render masked FinancialRecord in UI
```

---

## Key Decisions

### 1. `securityUtils.ts` — RBAC isolation (FSC-EXPORT-001)
`hasRole(claims, role)` is a pure function: `(IdTokenClaims | undefined, string) => boolean`. It reads `claims?.roles`, returns `false` if absent or not an array. Single responsibility — no MSAL imports, no component knowledge. Can be unit tested without a browser.

### 2. Regex masking in `mask.ts` (FSC-EXPORT-002)
```ts
export function maskAccountNumber(value: string): string {
  const last4 = value.match(/(\d{4})$/)?.[1] ?? '';
  return last4 ? `****${last4}` : '****';
}
```
The regex `/(\d{4})$/` extracts the last 4 digits. If fewer than 4 digits, the fallback is `****` — never a partial unmask.

### 3. Double-gate pattern (FSC-EXPORT-001)
Render gate in `Dashboard` prevents the button appearing for unauthorised users. Invocation gate in `FinancialExportCard`'s click handler re-checks the role at the moment of execution. This defends against DOM manipulation, race conditions, and stale render state.

### 4. Telemetry before action (FSC-EXPORT-003)
`auditExportAttempt` is `await`ed before the export proceeds or is denied. A try/catch around the telemetry call logs `console.warn` on failure but does not rethrow — the audit failure is visible but does not break the UX flow.

### 5. `FinancialExportCard` is a pure display component
It receives `claims` as a prop and performs the role check internally (invocation gate). It contains the async handler. It does not import `graphService` or `auditService` directly — `auditService` is imported here because the audit is a UI-level concern (triggered by user action), not a data-fetching concern.

### 6. App Insights via environment variable (GGS-002)
```ts
const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;
```
Never hardcoded. If absent (e.g. local dev without `.env`), `auditService` logs a warning and no-ops gracefully — the export is not blocked.

### 7. Bicep update for `Financial.Auditor` role
`main.bicep` must add an `appRoles` array to the App Registration resource. This is a required pre-implementation step — the role must exist in Entra ID before any token will contain it.

---

## Infrastructure Notes

### Responsibility Boundary

The app role **definition** in `main.bicep` is a developer-owned code change — it adds metadata to the App Registration manifest and requires no special portal permissions beyond what's needed to deploy Bicep.

The **deployment** and **role assignment** are infrastructure/identity admin responsibilities. Developers in enterprise environments will typically raise a ticket or PR for these steps rather than executing them directly.

### Developer-owned: Add `appRoles` to `main.bicep`

```bicep
appRoles: [
  {
    id: '<generate with uuidgen>'
    allowedMemberTypes: ['User']
    displayName: 'Financial Auditor'
    description: 'Can access and export financial data'
    value: 'Financial.Auditor'
    isEnabled: true
  }
]
```

### Infra/admin-owned: Role assignment

**Recommended enterprise pattern — assign a security group to the role:**

1. Azure Portal → Microsoft Entra ID → Groups → create a security group (e.g. `sg-financial-auditors`)
2. Azure Portal → Enterprise Applications → [App Name] → Users and Groups → Add assignment
3. Select the security group (not individual users) → assign to `Financial Auditor` role
4. Any group member who signs in will automatically receive `Financial.Auditor` in their `roles` claim

**Why groups over individual users:**
- Membership is managed by the identity admin, not the developer
- Adding/removing access requires no code change or redeployment
- Scales to production — no per-user assignments required

The app code checks `idTokenClaims.roles` regardless of whether the role was assigned directly or via a group. No code change is needed when switching from user-direct to group-based assignment.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `Financial.Auditor` role not in token after Bicep deploy | Assign role to user in Enterprise Applications; sign out/sign in to refresh token |
| App Insights connection string not set in `.env` | `auditService` no-ops with `console.warn`; add to `.env.local` for local dev |
| DOM manipulation bypasses render gate | Invocation gate in click handler prevents action regardless of render state |
| `accountNumber` shorter than 4 digits in mock data | `maskAccountNumber` fallback `****` handles gracefully without throwing |
| Telemetry call blocks export UX | Telemetry failure is caught and warned — never rethrows; does not block UX |
