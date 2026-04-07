# Secure React Identity & Graph POC Constitution

## Infrastructure

| Key | Value |
|---|---|
| Client ID | `YOUR_CLIENT_ID` |
| Tenant ID | `YOUR_TENANT_ID` |
| Authority | `https://login.microsoftonline.com/YOUR_TENANT_ID` |

## Global Governance Standards (GGS)

### GGS-001 — Identity Baseline
All features must be gated by `@azure/msal-react`. No anonymous access is permitted anywhere in the application. Unauthenticated users must be redirected to the sign-in page before any protected content is rendered.

### GGS-002 — Credential Security
Absolute prohibition of hardcoded Client Secrets or API Keys. Use `PublicClientApplication` with Authorization Code Flow + PKCE exclusively. No implicit flow. No client credentials.

### GGS-003 — Token Governance
All API calls (including Microsoft Graph) MUST use the `acquireTokenSilent` pattern. Explicitly handle `InteractionRequiredAuthError` to trigger a login popup or redirect only when silent acquisition fails. Never call Graph or any protected API with a manually stored token.

### GGS-004 — Least Privilege Scopes
Scopes must be minimised to only what is required for the current feature. For Lab 2, use only `User.Read`. All scope definitions must be centralised in `src/authConfig.ts`. No ad-hoc scope strings in component code.

### GGS-005 — UI Integrity
Use the existing `ClaimsTable` component (or a consistent `SanitizedDataView` equivalent) for rendering all identity data. This prevents XSS and maintains architectural consistency. Never render raw token values via `dangerouslySetInnerHTML`.

## Core Principles

### I. Authentication — Authorization Code Flow with PKCE Only
Strictly use `@azure/msal-react` for all authentication. Authorization Code Flow with PKCE is the only permitted flow. No client secrets. No implicit flow. No access tokens issued via the browser implicit grant.

### II. Architecture — Functional Components with Hooks
All React components must be functional. Class components are prohibited. State, side effects, and auth context must be managed via React Hooks (`useState`, `useEffect`, `useMemo`, custom hooks).

### III. UI — Tailwind CSS with Dark Mode
All styling must use Tailwind CSS utility classes. A modern dark-mode UI is the default. No inline styles. No external CSS frameworks alongside Tailwind.

### IV. Security — No Secrets in Client Code
No client secrets, tokens, or sensitive values may be hardcoded or committed. MSAL handles all token acquisition and storage. Token validation happens server-side or via Microsoft identity platform.

### V. Simplicity — YAGNI
Start simple. No over-engineering. Build only what is needed for the current feature. Complexity must be justified.

## Technology Stack

- **Auth**: `@azure/msal-react`, `@azure/msal-browser`
- **Graph Client**: Microsoft Graph REST API via `acquireTokenSilent` + `fetch`
- **UI Framework**: React (functional components + hooks)
- **Styling**: Tailwind CSS (dark mode default)
- **Language**: TypeScript
- **Auth Flow**: Authorization Code Flow with PKCE

## Governance

This constitution supersedes all other practices for this project. Any deviation requires explicit justification. All features must comply with both the GGS standards and core principles above. The GGS standards take precedence in the event of any conflict.

### The Guardrail Effect
This constitution serves as a **prompt bias and review standard**, not a hard technical constraint. It is injected as context for every SpecKit command, increasing the likelihood that AI-generated suggestions conform to these standards. It does not prevent non-compliant code from being generated or compiled — enforcement is human-in-the-loop.

The following patterns are **named violations** that any reviewer (human or AI) should flag and reject:

| Violation | Rule Broken |
|---|---|
| `fetch` call without `Authorization: Bearer <token>` from `acquireTokenSilent` | GGS-003 |
| Hardcoded API key, client secret, or bearer token string | GGS-002 |
| Scope string defined outside `src/authConfig.ts` | GGS-004 |
| Identity data rendered without `ClaimsTable` or equivalent sanitised component | GGS-005 |
| Any route or component accessible without MSAL authentication guard | GGS-001 |

When a suggestion violates one of the above, cite the standard by ID (e.g. "GGS-003 violation") and request a corrected implementation before accepting the code.

### Scaffolding Safety Rule
Never scaffold new tooling (Vite, CRA, etc.) into an existing project directory using destructive flags such as `--overwrite`. Always scaffold into a **new empty directory first**, then copy or merge files in. The `.specify/` and `specs/` directories must never be deleted or overwritten.

### Layered Governance Model

The GGS standards above are the **global security floor** — the minimum acceptable behaviour for every feature in this project. They are permanent and non-negotiable.

For high-risk features, individual feature specs may define **Feature-Specific Controls (FSCs)** that raise the security bar beyond the global baseline. FSCs live in the feature's `spec.md` and apply **only to that feature**. They do not modify the constitution and do not affect other features.

This resolves the false choice between:
- A narrow global policy (missing controls for sensitive surfaces), and
- An over-specified global policy (burdening simple components with rules they don't need)

**The model:**

| Layer | Defined in | Scope | Examples |
|---|---|---|---|
| Global Governance Standards (GGS) | `constitution.md` | All features, always | Auth gating, PKCE, token patterns, XSS prevention |
| Feature-Specific Controls (FSC) | `specs/NNN/spec.md` | This feature only | RBAC enforcement, data masking, export audit logging |

**Rules for FSCs:**
1. FSCs may only *add* constraints — they may never relax or override a GGS standard
2. FSCs must be explicitly numbered within the spec (e.g. `FSC-ROLES-001`)
3. The feature spec must declare which GGS standards it inherits and confirm they remain satisfied
4. An AI-generated suggestion that violates an FSC is a **feature-level violation** and must be corrected before acceptance

**Version**: 3.0.0 | **Ratified**: 2026-04-05 | **Last Amended**: 2026-04-05
