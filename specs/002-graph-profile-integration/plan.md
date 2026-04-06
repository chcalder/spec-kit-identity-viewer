# Implementation Plan: Microsoft Graph Profile Integration

**Branch**: `002-graph-profile-integration` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Lab**: Lab 2
**Status**: Draft

---

## Lab 2 Intent

Lab 1 established that SpecKit transforms AI-assisted development from prompt engineering into spec-driven development — shifting quality left by requiring a specification before code generation begins.

Lab 2 focuses on the **security dimension** of that shift. Adding a live API call (Microsoft Graph) is precisely the point in an AI SDLC where security debt is most commonly introduced: inline scope strings, `fetch` calls without proper auth headers, silently swallowed token errors, and hardcoded fallback values. Without a governing spec, an AI assistant will produce exactly these patterns because they are the most common patterns in its training data.

The Global Governance Standards (GGS-001 through GGS-005) in the constitution are not documentation — they are **prompt constraints**. Every SpecKit command that follows reads the constitution and generates output bounded by those constraints. The plan, tasks, and implementation code that result are not secure by luck or by the developer catching issues in review; they are secure because the requirements were written that way from the start.

### The Constitution as a Global Security Policy

The constitution is not a feature-scoped document. It is the **standing security policy for the entire project** — applying equally to every feature built now, every feature built in Lab 1, and every feature that will be built in future labs. When GGS-001 through GGS-005 are ratified, they do not only govern the Graph integration being built in this lab. They retroactively establish the standard against which the Lab 1 sign-in flow, claims table, and logout button are also measured.

This has a direct architectural consequence: if a future AI suggestion for any feature — even one outside the scope of Lab 2 — produces an unauthenticated route, an inline scope string, or a raw `fetch` to a protected resource, it is a **named constitutional violation** that can be cited by ID and rejected. The constitution gives the team (and the AI) a shared vocabulary for security review that does not depend on any individual reviewer knowing what "best practice" looks like.

**This is what "shifting security left" means in an AI SDLC**: the security requirements live in the spec, not in a post-generation code review. And once written into the constitution, they are permanent — not negotiated feature by feature.

---

## Technical Summary

Extend the existing React SPA with a live Microsoft Graph API integration. After sign-in, call `https://graph.microsoft.com/v1.0/me` using an access token obtained via `acquireTokenSilent` to retrieve the user's `jobTitle`, `officeLocation`, and `preferredLanguage`. Render these in a new `ProfileCard` component on the Dashboard, with loading and error states. All Graph logic is encapsulated in a dedicated service module.

---

## Technical Context

**Language/Version**: TypeScript, React 19, Vite 8
**Primary Dependencies**: `@azure/msal-react`, `@azure/msal-browser` (already installed)
**New Dependencies**: None — Graph is called via native `fetch` with a Bearer token
**Storage**: None — Graph data held in component state only; not persisted
**Testing**: N/A for v1
**Target Platform**: Browser (desktop, localhost:3000/3001)
**Project Type**: Extension of existing Lab 1 SPA
**Constraints**: `User.Read` scope only; no implicit flow; no client secrets; `acquireTokenSilent` for all token acquisition; all scope definitions in `src/authConfig.ts`

---

## Constitution Check (v2.0.0)

| Standard | Check | Status |
|---|---|---|
| GGS-001 | All Graph calls gated behind MSAL authentication | ✅ PASS |
| GGS-002 | No hardcoded secrets; PKCE + Authorization Code Flow only | ✅ PASS |
| GGS-003 | `acquireTokenSilent` used; `InteractionRequiredAuthError` handled | ✅ PASS |
| GGS-004 | `User.Read` only; scopes in `src/authConfig.ts` (already present) | ✅ PASS |
| GGS-005 | New `ProfileCard` component renders identity data; no raw token display | ✅ PASS |
| Principle I | Auth Code Flow + PKCE; implicit flow remains disabled | ✅ PASS |
| Principle II | Functional components + hooks (`useEffect`, `useState`) | ✅ PASS |
| Principle III | Tailwind CSS dark mode; no inline styles | ✅ PASS |
| Principle IV | No secrets in client code | ✅ PASS |
| Principle V | YAGNI — minimal additions to existing codebase | ✅ PASS |

---

## Scope of Changes

This plan is **additive only**. Existing Lab 1 components (`ClaimsTable`, `SignInPage`, `Dashboard`) are not modified except to mount `ProfileCard`. No changes to `authConfig.ts`, `main.tsx`, `App.tsx`, Bicep, or Vite config are required.

| File | Action |
|---|---|
| `src/services/graphService.ts` | **Create** — Graph fetch logic, token acquisition |
| `src/components/ProfileCard.tsx` | **Create** — renders 3 Graph profile fields |
| `src/components/Dashboard.tsx` | **Modify** — mount `ProfileCard` below existing `ClaimsTable` |
| `src/types/graph.ts` | **Create** — TypeScript interface for Graph `/me` response |

---

## Project Structure (post-Lab 2)

```text
spec-kit-identity-viewer/
└── src/
    ├── main.tsx                   # unchanged — MsalProvider
    ├── authConfig.ts              # unchanged — User.Read scope already present
    ├── App.tsx                    # unchanged — auth routing
    ├── types/
    │   └── graph.ts               # NEW — GraphProfile interface
    ├── services/
    │   └── graphService.ts        # NEW — fetchGraphProfile(instance, account)
    └── components/
        ├── SignInPage.tsx          # unchanged
        ├── Dashboard.tsx          # MODIFIED — add <ProfileCard />
        ├── ClaimsTable.tsx        # unchanged
        └── ProfileCard.tsx        # NEW — renders jobTitle, officeLocation, preferredLanguage
```

---

## Architecture: Silent Token → Graph Fetch Flow

```
Dashboard mounts
       │
       ▼
graphService.fetchGraphProfile(instance, account)
       │
       ├─► acquireTokenSilent({ scopes: loginRequest.scopes, account })
       │         │
       │         ├─ SUCCESS → accessToken in response
       │         │
       │         └─ InteractionRequiredAuthError
       │                   └─► acquireTokenRedirect({ scopes: loginRequest.scopes })
       │
       ▼
fetch('https://graph.microsoft.com/v1.0/me', {
  headers: { Authorization: `Bearer ${accessToken}` }
})
       │
       ├─ 200 OK → return GraphProfile (jobTitle, officeLocation, preferredLanguage)
       │
       └─ Error → throw GraphServiceError (caught by Dashboard, shown in error state)
```

---

## Key Decisions

### 1. Service Layer (`src/services/graphService.ts`)
All Microsoft Graph logic is encapsulated here. No component calls `fetch` directly against Graph. This enforces GGS-003/004 at the architectural level — the service is the single enforcement point for the Bearer token and scope rules.

### 2. No New Dependencies
Graph is called via native `fetch`. No `@microsoft/microsoft-graph-client` SDK introduced. Reason: YAGNI — the SDK adds abstraction overhead for a single endpoint call. The `Authorization` header pattern is simpler and completely transparent to learners.

### 3. Scope Reuse
`User.Read` is already in `loginRequest.scopes` in `src/authConfig.ts` from Lab 1. The service calls `acquireTokenSilent` with `loginRequest.scopes` — no new scope string is introduced anywhere.

### 4. `AbortController` for Cleanup
`graphService.ts` accepts an optional `AbortSignal` so `Dashboard.tsx` can cancel in-flight requests on component unmount, preventing React state updates after unmount.

### 5. Error Boundary Strategy
Errors are caught in `Dashboard.tsx`, not inside `ProfileCard`. `ProfileCard` is a pure display component — it receives data or is not rendered. This separates fetch concerns from UI rendering (Principle II).

### 6. Null Field Handling
The `GraphProfile` TypeScript interface marks all three fields as `string | null`. `ProfileCard` renders `—` for any `null` value. This is enforced by type, not by runtime checks scattered across the component.

---

## Infrastructure Notes

No changes to `main.bicep` or `bicepconfig.json` are required. `User.Read` delegated permission was granted to the App Registration during Lab 1. Implicit flow remains disabled (`enableAccessTokenIssuance: false`, `enableIdTokenIssuance: false` on the SPA platform in Bicep).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `User.Read` permission not admin-consented | Verify in Azure Portal → App Registration → API Permissions before implementing |
| `jobTitle` / `officeLocation` unpopulated in Entra ID | `GraphProfile` interface uses `string \| null`; `ProfileCard` renders `—` for nulls |
| `acquireTokenSilent` fails on first load | `InteractionRequiredAuthError` handler triggers redirect; documented in FR-003 |
| Race condition on rapid retry clicks | Retry button disabled while token acquisition or fetch is in progress (FR-007 edge case) |
| State update on unmounted component | `AbortController` signal passed to `graphService.ts` (FR-011) |
