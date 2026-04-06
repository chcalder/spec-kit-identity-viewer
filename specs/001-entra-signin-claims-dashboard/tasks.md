# Tasks: Entra ID Sign-In & JWT Claims Dashboard

**Status**: All phases implemented ✅
**Input**: Design documents from `/specs/001-entra-signin-claims-dashboard/`

---

## Phase 1: Project Setup ✅

- [x] T001 Scaffold Vite project: `npm create vite@latest . -- --template react-ts`
- [x] T002 Install auth dependencies: `@azure/msal-browser`, `@azure/msal-react`
- [x] T003 Install Tailwind CSS v4: `tailwindcss`, `@tailwindcss/vite`
- [x] T004 Configure `vite.config.ts` — `@tailwindcss/vite` plugin, `server.port: 3000`
- [x] T005 Add `@import "tailwindcss"` to `src/index.css`
- [x] T006 Set `<html class="dark">` and title "Identity Claims Viewer" in `index.html`
- [x] T007 Create `src/components/` folder

---

## Phase 2: Foundation — MSAL Configuration ✅

- [x] T008 Create `src/authConfig.ts` — `msalConfig` with clientId, authority, `window.location.origin` redirectUri, sessionStorage cache
- [x] T009 Add `loginRequest` export with scopes `['openid', 'profile', 'email', 'User.Read']`
- [x] T010 Update `src/main.tsx` — `PublicClientApplication` + `MsalProvider` wrapping `<App />`

---

## Phase 3: User Story 1 — Sign In (P1) ✅

- [x] T011 Create `src/components/SignInPage.tsx` — dark-mode centred layout, app title, sign-in button
- [x] T012 Wire sign-in button to `instance.loginRedirect(loginRequest)` via `useMsal()`
- [x] T013 Update `src/App.tsx` — `useIsAuthenticated()` + `InteractionStatus` guard for conditional routing
- [x] T014 Verify `MsalProvider` handles redirect promise automatically on load

---

## Phase 4: User Stories 2 & 3 — Dashboard + Claims Table (P2) ✅

- [x] T015 Create `src/components/ClaimsTable.tsx` — `Record<string, unknown>` props, two-column table
- [x] T016 Style `ClaimsTable` — dark bg, alternating rows, monospace font, `JSON.stringify` for objects, `—` for nulls
- [x] T017 Create `src/components/Dashboard.tsx` — `useAccount()`, `idTokenClaims`, "Welcome [name]" heading
- [x] T018 Render `<ClaimsTable claims={idTokenClaims} />` in `Dashboard.tsx`
- [x] T019 Update `src/App.tsx` — render `<Dashboard />` when authenticated

---

## Phase 5: User Story 4 — Sign Out (P3) ✅

- [x] T020 Logout button in `Dashboard.tsx` → `instance.logoutRedirect()` via `useMsal()`
- [x] T021 Style logout button — top-right header, `bg-red-700 hover:bg-red-600`

---

## Phase 6: Polish ✅

- [x] T022 Loading/spinner state via `InteractionStatus.None` guard in `App.tsx`
- [x] T023 Dynamic `redirectUri: window.location.origin` — handles Vite port auto-increment
- [x] T024 Add `http://localhost:3001` redirect URI to `main.bicep`
- [x] T025 Build passes clean: `npm run build` ✅
