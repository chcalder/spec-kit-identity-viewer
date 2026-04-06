# Implementation Plan: Entra ID Sign-In & JWT Claims Dashboard

**Branch**: `001-entra-signin-claims-dashboard` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Status**: Implemented ✅

## Summary

React SPA using `@azure/msal-react` that authenticates users against Microsoft Entra ID via Authorization Code Flow with PKCE. After sign-in, displays a dark-mode dashboard with a personalised welcome message and a full table of decoded JWT claims from the ID token. Logout button clears the session.

## Technical Context

**Language/Version**: TypeScript, React 18
**Primary Dependencies**: `@azure/msal-react`, `@azure/msal-browser`, Tailwind CSS v4, Vite 8
**Storage**: None — all data sourced from MSAL ID token claims cache
**Testing**: N/A for v1
**Target Platform**: Browser (desktop, localhost:3000/3001)
**Project Type**: Single-page web application
**Constraints**: No implicit flow; no client secrets; PKCE only; no backend API calls

## Constitution Check

| Principle | Status |
|---|---|
| Auth Code Flow + PKCE only | ✅ PASS |
| No client secrets | ✅ PASS |
| `@azure/msal-react` | ✅ PASS |
| Functional components + Hooks | ✅ PASS |
| Tailwind CSS + dark mode | ✅ PASS |
| Simplicity / YAGNI | ✅ PASS |

## Project Structure

```text
spec-kit-identity-viewer/
├── index.html                 # dark class on <html>, title "Identity Claims Viewer"
├── vite.config.ts             # @tailwindcss/vite plugin, port 3000
├── main.bicep                 # Entra ID App Registration (SPA, PKCE, redirect URIs)
├── bicepconfig.json           # microsoftGraphV1 extension reference
└── src/
    ├── main.tsx               # MsalProvider wrapping App
    ├── authConfig.ts          # MSAL config (clientId, tenantId, scopes, dynamic redirectUri)
    ├── App.tsx                # Auth routing: loading → SignInPage → Dashboard
    ├── components/
    │   ├── SignInPage.tsx      # Unauthenticated landing — loginRedirect on button click
    │   ├── Dashboard.tsx      # Welcome message + ClaimsTable + logoutRedirect
    │   └── ClaimsTable.tsx    # Two-column table of all ID token claims
    └── index.css              # @import "tailwindcss"
```

## Key Decisions

- `redirectUri: window.location.origin` — dynamic, handles Vite port auto-increment (3000 → 3001)
- `cacheLocation: 'sessionStorage'` — tokens cleared on tab close
- `InteractionStatus.None` guard in `App.tsx` — prevents flash of sign-in page during redirect
- Tailwind v4 CSS-first config — `@import "tailwindcss"` in index.css, no `tailwind.config.js`
- `<html class="dark">` in `index.html` — permanent dark mode

## Infrastructure Notes

App Registration redirect URIs (registered in `main.bicep`):
- `http://localhost:3000`
- `http://localhost:3001` (Vite fallback when 3000 is in use)
