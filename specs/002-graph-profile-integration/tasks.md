# Tasks: Microsoft Graph Profile Integration

**Status**: All phases implemented ✅
**Lab**: Lab 2
**Input**: Design documents from `/specs/002-graph-profile-integration/`

---

## Phase 1: Pre-flight Checks ✅

- [x] T001 Verify `User.Read` delegated permission is granted and admin-consented in Azure Portal → App Registration → API Permissions
- [x] T002 Confirm `User.Read` is present in `loginRequest.scopes` in `src/authConfig.ts` (no change expected — carried from Lab 1)
- [x] T003 Confirm Entra ID App Registration has implicit flow disabled (`enableAccessTokenIssuance: false`, `enableIdTokenIssuance: false`) in `main.bicep` *(FR-012)*

---

## Phase 2: Type Definitions ✅

- [x] T004 Create `src/types/graph.ts` — export `GraphProfile` interface with fields `jobTitle: string | null`, `officeLocation: string | null`, `preferredLanguage: string | null`

---

## Phase 3: Graph Service Layer *(GGS-003, GGS-004)* ✅

- [x] T005 Create `src/services/` folder
- [x] T006 Create `src/services/graphService.ts` — export `fetchGraphProfile(instance: IPublicClientApplication, account: AccountInfo, signal?: AbortSignal): Promise<GraphProfile>`
- [x] T007 Implement `acquireTokenSilent({ scopes: loginRequest.scopes, account })` inside `fetchGraphProfile` *(GGS-003)*
- [x] T008 Catch `InteractionRequiredAuthError` — call `instance.acquireTokenRedirect({ scopes: loginRequest.scopes })` when silent acquisition fails *(FR-003)*
- [x] T009 Implement `fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: \`Bearer ${accessToken}\` }, signal })` *(GGS-003)*
- [x] T010 Parse response JSON and return only `{ jobTitle, officeLocation, preferredLanguage }` — discard all other fields *(GGS-004)*
- [x] T011 Throw a typed error if Graph returns a non-200 status so callers can distinguish Graph errors from token errors

---

## Phase 4: ProfileCard Component *(GGS-005)* ✅

- [x] T012 Create `src/components/ProfileCard.tsx` — accept `profile: GraphProfile` as prop
- [x] T013 Render three read-only fields: `jobTitle`, `officeLocation`, `preferredLanguage` using Tailwind dark-mode utility classes
- [x] T014 Render `—` for any field where value is `null` *(FR-005)*
- [x] T015 No fetch logic, no MSAL imports — `ProfileCard` is a pure display component *(plan Key Decision #5)*

---

## Phase 5: Dashboard Integration ✅

- [x] T016 Add `profile`, `isLoadingProfile`, and `profileError` state to `Dashboard.tsx` using `useState`
- [x] T017 Add `useEffect` in `Dashboard.tsx` — on mount, call `fetchGraphProfile(instance, account, abortController.signal)` *(FR-002)*
- [x] T018 Implement `AbortController` in the `useEffect` cleanup function to cancel in-flight requests on unmount *(FR-011)*
- [x] T019 Render "Fetching Profile..." loading state while `isLoadingProfile` is `true` *(FR-006)*
- [x] T020 Render `<ProfileCard profile={profile} />` once data is loaded *(GGS-005)*
- [x] T021 Render user-friendly error message and "Retry" button when `profileError` is set *(FR-007)*
- [x] T022 Disable "Retry" button while a token acquisition or fetch is in progress to prevent race conditions *(edge case)*
- [x] T023 On "Retry" click — reset error state and re-invoke `fetchGraphProfile` *(US-3, scenario 3)*

---

## Phase 6: Build & Verification

- [x] T024 Start dev server (`npm run dev`) and sign in — verify `ProfileCard` renders with live Graph data
- [x] T025 Open browser DevTools → Network tab — verify `Authorization: Bearer <token>` header present on `/v1.0/me` request *(SC-002)*
- [x] T026 Verify loading state appears before `ProfileCard` data renders *(SC-003)*
- [x] T027 Verify null fields render `—` in `ProfileCard` *(FR-005)*
- [x] T028 Confirm no scope strings exist outside `src/authConfig.ts` — ✅ only 1 match in authConfig.ts *(SC-005)*
- [x] T029 Build passes clean: `npm run build` ✅
