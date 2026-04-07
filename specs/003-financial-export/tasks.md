# Tasks: High-Sensitivity Financial Export

**Status**: Not started
**Lab**: Lab 3
**Input**: Design documents from `/specs/003-financial-export/`

---

## Phase 1: Pre-flight Checks

> **Responsibility boundary**: T001 is a developer code change. T002–T004 require deployment and identity admin rights and are typically owned by the infrastructure or platform team. The developer can complete T005 and T006 independently.

### Developer tasks
- [ ] T001 Add `Financial.Auditor` app role to `main.bicep` — `appRoles` array with generated GUID (`uuidgen`), `allowedMemberTypes: ['User']`, `value: 'Financial.Auditor'`, `isEnabled: true` *(FSC-EXPORT-001)*
- [ ] T005 Create `.env.local` with `VITE_APPINSIGHTS_CONNECTION_STRING=<your-connection-string>` *(GGS-002 — not hardcoded)*

### Infrastructure / identity admin tasks
- [ ] T002 Deploy updated `main.bicep` to publish the new app role to the App Registration manifest
- [ ] T003 Assign the `Financial.Auditor` role to users or a security group in Azure Portal → Enterprise Applications → [App Name] → Users and Groups

  > **Recommended enterprise pattern**: assign a **security group** to the role rather than individual users. Any member of the group will automatically receive `Financial.Auditor` in their `roles` claim. Individual user assignment is for lab/testing only.

- [ ] T004 Confirm role assignment: sign out and sign back in to obtain a refreshed ID token — verify `roles: ["Financial.Auditor"]` appears in the claims table from Lab 1

---

## Phase 2: Role Definitions

- [ ] T006 Create `src/roles.ts` — export `AppRole` const with `FinancialAuditor: 'Financial.Auditor'` *(FSC-EXPORT-001)*
- [ ] T007 Verify no role name string `'Financial.Auditor'` exists anywhere outside `src/roles.ts` — auditable via grep *(FSC-EXPORT-001)*

---

## Phase 3: Security Utilities *(FSC-EXPORT-001, FSC-EXPORT-002)*

- [ ] T008 Create `src/utils/` folder
- [ ] T009 Create `src/utils/securityUtils.ts` — export `hasRole(claims: IdTokenClaims | undefined, role: string): boolean` *(FSC-EXPORT-001)*
- [ ] T010 Implement `hasRole`: read `claims?.roles`, return `false` if absent, not an array, or role not found — default-deny *(FSC-EXPORT-001)*
- [ ] T011 Create `src/utils/mask.ts` — export `maskAccountNumber(value: string): string` *(FSC-EXPORT-002)*
- [ ] T012 Implement `maskAccountNumber` using regex `/(\d{4})$/` to extract last 4 digits — return `****${last4}` or `****` if fewer than 4 digits *(FSC-EXPORT-002)*

---

## Phase 4: Type Definitions & Audit Service

- [ ] T013 Create `src/types/financial.ts` — export `FinancialRecord` interface with `accountNumber: string`, `balance: number`, `transactionDate: string`
- [ ] T014 Create `src/services/auditService.ts` — export `auditExportAttempt(upn: string, status: 'granted' | 'denied'): Promise<void>` *(FSC-EXPORT-003)*
- [ ] T015 Implement `auditExportAttempt`: read `VITE_APPINSIGHTS_CONNECTION_STRING` from `import.meta.env` — if absent, log `console.warn` and return *(GGS-002)*
- [ ] T016 Fire Application Insights custom event with `userPrincipalName`, `status`, `timestamp` (ISO 8601 UTC), `featureId: 'financial-export'` *(FSC-EXPORT-003)*
- [ ] T017 Wrap telemetry call in try/catch — on failure log `console.warn('Audit telemetry failed:', error)` — do not rethrow *(FSC-EXPORT-003)*

---

## Phase 5: FinancialExportCard Component *(FSC-EXPORT-001, FSC-EXPORT-002, FSC-EXPORT-003)*

- [ ] T018 Create `src/components/FinancialExportCard.tsx` — accept `claims: IdTokenClaims` as prop
- [ ] T019 Implement async `handleExport()` click handler inside the component
- [ ] T020 **Invocation gate**: call `hasRole(claims, AppRole.FinancialAuditor)` at the start of `handleExport` — if false, call `auditExportAttempt(upn, 'denied')` and return *(FSC-EXPORT-001)*
- [ ] T021 **Audit before action**: `await auditExportAttempt(upn, 'granted')` before any data is fetched or displayed *(FSC-EXPORT-003)*
- [ ] T022 Generate mock `FinancialRecord` payload: `{ accountNumber: '00012345678', balance: 98432.50, transactionDate: new Date().toISOString() }`
- [ ] T023 Apply `maskAccountNumber(record.accountNumber)` before setting display state — unmasked value MUST NOT appear in component state or JSX *(FSC-EXPORT-002)*
- [ ] T024 Render masked `accountNumber`, `balance`, and `transactionDate` in a read-only display using Tailwind dark-mode classes *(GGS-005)*
- [ ] T025 Add loading state (`isExporting`) — disable button while handler is in progress to prevent duplicate invocations
- [ ] T026 No MSAL imports, no `graphService` imports — `FinancialExportCard` is a pure display+handler component; security utilities are imported as functions

---

## Phase 6: Dashboard Integration *(FSC-EXPORT-001)*

- [ ] T027 Import `hasRole`, `AppRole`, and `FinancialExportCard` into `Dashboard.tsx`
- [ ] T028 Add **render gate**: only render `<FinancialExportCard claims={idTokenClaims} />` if `hasRole(idTokenClaims, AppRole.FinancialAuditor)` returns true *(FSC-EXPORT-001)*
- [ ] T029 Add an informational message ("Financial export is not available for your account") for users that fail the render gate — do not silently hide the section

---

## Phase 7: Build & Verification

- [ ] T030 `npm run build` — must pass clean with all new files *(SC-007)*
- [ ] T031 Sign in as a user **with** `Financial.Auditor` role — verify export button is visible and data renders masked (e.g. `****5678`) *(SC-001, SC-004)*
- [ ] T032 Verify no unmasked `accountNumber` value appears in the DOM (DevTools → Elements → search for account number digits) *(FSC-EXPORT-002)*
- [ ] T033 Sign in as a user **without** `Financial.Auditor` role — verify button is NOT rendered and informational message is shown *(SC-002)*
- [ ] T034 Open DevTools → Console — click export button, confirm Application Insights event fires (network request or `console.warn` if no connection string) *(SC-003)*
- [ ] T035 Verify `hasRole()` returns `false` when `roles` is absent — sign in with a user that has no roles and confirm render gate denies *(SC-005)*
- [ ] T036 Grep audit: confirm `'Financial.Auditor'` string only in `src/roles.ts` *(SC-006)*

```bash
grep -rn "Financial.Auditor" src/ --include="*.ts" --include="*.tsx"
# Expected: 1 match — src/roles.ts only
```
