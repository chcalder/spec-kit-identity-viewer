# Feature Specification: High-Sensitivity Financial Export

**Feature Branch**: `003-financial-export`
**Created**: 2026-04-05
**Status**: Draft
**Lab**: Lab 3
**Constitution Version**: 3.0.0

---

## Lab 3 Intent

Labs 1 and 2 established the **Global Governance Standards (GGS)** as a project-wide security floor. Every feature inherits that floor automatically — no anonymous access, PKCE-only tokens, `acquireTokenSilent`, scopes in `authConfig.ts`, sanitised rendering.

Lab 3 introduces the second layer: **Feature-Specific Controls (FSCs)**. These are security requirements that are too specific or too strict to be global, but are essential for a particular high-risk surface. The Financial Export feature is that surface.

### The Layered Governance Demonstration

Without layered governance, teams face a binary choice:
- Keep the global policy narrow → high-risk features like financial export get no special protection
- Expand the global policy to cover export scenarios → every simple component is burdened with RBAC and masking rules it doesn't need

SpecKit resolves this with FSCs. The GGS standards are **inherited unchanged** — this feature still requires MSAL gating, PKCE, `acquireTokenSilent`, and sanitised rendering. On top of that foundation, the spec defines three additional controls that apply **only here**:

| Layer | Standard | Scope |
|---|---|---|
| Global (inherited) | GGS-001 through GGS-005 | All features |
| Feature-Specific | FSC-EXPORT-001: Step-up RBAC | This feature only |
| Feature-Specific | FSC-EXPORT-002: PII Masking | This feature only |
| Feature-Specific | FSC-EXPORT-003: Audit Trail | This feature only |

**The core lesson**: The spec is where you dial up security for high-risk surfaces. The constitution remains clean. Simple components are unaffected. The AI receives both layers as context and generates to the higher of the two — without being told explicitly which rules to apply where.

---

## GGS Inheritance Declaration

This feature inherits all GGS standards from `constitution.md` v3.0.0. The following table confirms each standard remains satisfied:

| Standard | Inherited Requirement | Satisfied By |
|---|---|---|
| GGS-001 | All features gated by MSAL | Export button only rendered when authenticated; export action re-checks auth state |
| GGS-002 | No hardcoded secrets or implicit flow | Token via `acquireTokenSilent` only |
| GGS-003 | `acquireTokenSilent` for all API calls | Any backend export API call uses Bearer token from silent acquisition |
| GGS-004 | Scopes in `authConfig.ts` only | No new scope strings introduced in components |
| GGS-005 | Sanitised rendering of identity/financial data | Masked values rendered via dedicated `MaskedField` component |

FSCs in this spec add constraints **on top of** the above. They do not relax or override any GGS standard.

---

## Feature-Specific Controls (FSCs)

### FSC-EXPORT-001 — Step-up RBAC
The Export Financial Data button and all downstream export logic MUST only be accessible to users whose ID token `roles` claim contains `Financial.Auditor`. Access MUST be evaluated at two points:

1. **Render gate**: the button is not rendered if the user lacks the role
2. **Invocation gate**: the export action re-checks the role at the moment of execution, regardless of render state

The `roles` claim MUST be evaluated via a dedicated `hasRole(claims, role)` utility function. Role name strings MUST be defined as a TypeScript `const` in `src/roles.ts`. No magic strings anywhere in component or service code.

Default behaviour when `roles` is absent, empty, or does not contain `Financial.Auditor`: **deny** — never grant by default.

### FSC-EXPORT-002 — PII Masking
The `accountNumber` field in all financial data MUST be masked on the client side before display or download. The masking format is `****` followed by the last 4 digits (e.g. `****5678`). The unmasked value MUST NOT appear in the DOM, in exported files, or in console output at any point.

Masking MUST be applied in a dedicated `maskAccountNumber(value: string): string` utility function, not inline in component JSX.

### FSC-EXPORT-003 — Audit Trail
Every export attempt (whether granted or denied) MUST trigger a custom Application Insights telemetry event containing:
- `userPrincipalName` from the ID token claims
- `status`: `'granted'` or `'denied'`
- `timestamp`: ISO 8601 UTC string
- `featureId`: `'financial-export'`

The telemetry call MUST fire before the export action proceeds or is blocked. A failed telemetry call MUST NOT silently suppress the audit — it should throw or log a warning so the failure is visible.

---

## User Scenarios & Testing

### User Story 1 — Authorised Export (Priority: P1)

As a user with the `Financial.Auditor` role, I want to export financial data so that I can perform my audit duties.

**Acceptance Scenarios**:

1. **Given** the user is authenticated with the `Financial.Auditor` role, **When** the dashboard loads, **Then** the "Export Financial Data" button is visible.
2. **Given** the user clicks the export button, **When** the role is confirmed at invocation, **Then** a telemetry event is fired with `status: 'granted'`, and the masked financial data is displayed or downloaded.
3. **Given** the `accountNumber` is `"12345678"`, **When** displayed in the export result, **Then** it renders as `"****5678"` with no unmasked value in the DOM.

---

### User Story 2 — Unauthorised Access (Priority: P1)

As a user without the `Financial.Auditor` role, I must be denied access to the export feature — both at the UI and at the invocation level.

**Acceptance Scenarios**:

1. **Given** the user is authenticated but lacks `Financial.Auditor`, **When** the dashboard loads, **Then** the "Export Financial Data" button is NOT rendered.
2. **Given** the button is rendered (e.g. via DOM manipulation), **When** the export action is invoked, **Then** the invocation-gate check denies the action and fires a telemetry event with `status: 'denied'`.
3. **Given** the user's `roles` claim is absent or empty, **When** evaluated by `hasRole()`, **Then** the result is `false` — default-deny. *(FSC-EXPORT-001)*

---

### User Story 3 — Audit Trail Reliability (Priority: P2)

As a compliance officer, I need a reliable audit trail of every export attempt so that I can satisfy regulatory requirements.

**Acceptance Scenarios**:

1. **Given** any export attempt (granted or denied), **When** the button is clicked, **Then** an Application Insights event fires before any data is shown or blocked.
2. **Given** the telemetry call fails, **When** the failure occurs, **Then** a console warning is logged and the failure is surfaced — it does not silently disappear.

---

### Edge Cases

- What if the `roles` claim contains `Financial.Auditor` but with different casing? → `hasRole()` MUST perform a case-sensitive comparison. `financial.auditor` ≠ `Financial.Auditor`.
- What if `accountNumber` is fewer than 4 digits? → `maskAccountNumber()` must handle gracefully — mask the entire value (`****`), never throw.
- What if Application Insights is unavailable? → Log a `console.warn`; do not block the export grant/deny decision or throw an unhandled error.
- What if the user acquires the `Financial.Auditor` role mid-session? → Role is read from the cached ID token at the time of invocation. A fresh token (via sign-out/sign-in) is required for role changes to take effect.

---

## Functional Requirements

### Inherited from GGS (all must remain satisfied)
- **FR-GGS-001**: Feature is inaccessible to unauthenticated users *(GGS-001)*
- **FR-GGS-002**: No hardcoded secrets; token via `acquireTokenSilent` *(GGS-002, GGS-003)*
- **FR-GGS-003**: All scope strings in `src/authConfig.ts` *(GGS-004)*
- **FR-GGS-004**: Financial data rendered via sanitised component, no `dangerouslySetInnerHTML` *(GGS-005)*

### Feature-Specific Requirements

- **FR-001**: An "Export Financial Data" button MUST appear on the dashboard only for users whose `idTokenClaims.roles` contains `Financial.Auditor`. *(FSC-EXPORT-001)*
- **FR-002**: The role check at render time and at invocation MUST use `hasRole(claims, AppRole.FinancialAuditor)` — no inline string comparison. *(FSC-EXPORT-001)*
- **FR-003**: Role name strings MUST be defined in `src/roles.ts` as a TypeScript `const` or `enum`. *(FSC-EXPORT-001)*
- **FR-004**: The default result of `hasRole()` when `roles` is absent or empty MUST be `false`. *(FSC-EXPORT-001)*
- **FR-005**: On click, a mock JSON payload `{ accountNumber, balance, transactionDate }` MUST be fetched (or generated). *(functional)*
- **FR-006**: `accountNumber` MUST be masked via `maskAccountNumber()` before any display or download. The unmasked value MUST NOT appear anywhere in the rendered output. *(FSC-EXPORT-002)*
- **FR-007**: `maskAccountNumber()` MUST be defined in `src/utils/mask.ts` and unit-testable in isolation. *(FSC-EXPORT-002)*
- **FR-008**: Every export attempt MUST trigger an Application Insights telemetry event before the action proceeds or is denied. *(FSC-EXPORT-003)*
- **FR-009**: The telemetry event MUST include `userPrincipalName`, `status` (`'granted'` | `'denied'`), `timestamp` (ISO 8601 UTC), and `featureId: 'financial-export'`. *(FSC-EXPORT-003)*
- **FR-010**: A failed telemetry call MUST log a `console.warn` and MUST NOT silently suppress the audit failure. *(FSC-EXPORT-003)*
- **FR-011**: The export action (data display or download) MUST NOT proceed before the telemetry call completes or fails. *(FSC-EXPORT-003)*

### Key Entities

- **`Financial.Auditor`**: The Entra ID App Role required to access the export feature. Defined in the App Registration manifest.
- **`hasRole(claims, role)`**: Utility function (`src/utils/roles.ts`) that evaluates `idTokenClaims.roles` safely. Returns `false` by default.
- **`maskAccountNumber(value)`**: Utility function (`src/utils/mask.ts`) that returns `****` + last 4 digits.
- **`FinancialExportCard`**: The UI component rendering the export button and masked result. Receives financial data and role status as props only.
- **`auditExportAttempt(upn, status)`**: Telemetry function (`src/services/auditService.ts`) that fires the Application Insights event.

---

## Success Criteria

- **SC-001**: A user with `Financial.Auditor` in their token sees the export button, clicks it, and receives masked data. *(US-1)*
- **SC-002**: A user without the role does not see the button. Direct DOM invocation is denied and logged. *(US-2)*
- **SC-003**: Every export attempt (granted and denied) produces an Application Insights event with all required fields. *(US-3)*
- **SC-004**: `accountNumber: "12345678"` renders as `"****5678"` — confirmed via DOM inspection. *(FSC-EXPORT-002)*
- **SC-005**: `hasRole()` returns `false` when `roles` is `undefined`, `null`, `[]`, or contains only unrelated roles. *(FSC-EXPORT-001)*
- **SC-006**: No role name string appears outside `src/roles.ts`. Auditable via grep. *(FSC-EXPORT-001)*
- **SC-007**: `npm run build` passes clean with all new files included.

---

## Assumptions

- The `Financial.Auditor` app role is **defined** in `main.bicep` by the developer (code change), and **deployed + assigned** by the infrastructure/identity admin team.
- **Recommended assignment pattern**: a security group (e.g. `sg-financial-auditors`) is assigned to the `Financial.Auditor` app role in Enterprise Applications. Group membership is managed by the identity admin — no code change or redeployment is required to add or remove access.
- The `roles` claim in the ID token is populated identically whether the role was assigned directly to a user or via a group. The app code does not distinguish between assignment methods.
- Application Insights connection string is available as a Vite environment variable (`VITE_APPINSIGHTS_CONNECTION_STRING`). It is NOT hardcoded. *(GGS-002)*
- The financial data payload (`accountNumber`, `balance`, `transactionDate`) is mocked client-side for this lab. A real backend API integration is out of scope.
- The unmasked `accountNumber` never leaves the client — there is no API call transmitting it.
- TypeScript strict mode remains enabled throughout.
