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

### Scaffolding Safety Rule
Never scaffold new tooling (Vite, CRA, etc.) into an existing project directory using destructive flags such as `--overwrite`. Always scaffold into a **new empty directory first**, then copy or merge files in. The `.specify/` and `specs/` directories must never be deleted or overwritten.

**Version**: 2.0.0 | **Ratified**: 2026-04-05 | **Last Amended**: 2026-04-05
