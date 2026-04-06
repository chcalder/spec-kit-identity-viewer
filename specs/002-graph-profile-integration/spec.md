# Feature Specification: Microsoft Graph Profile Integration

**Feature Branch**: `002-graph-profile-integration`
**Created**: 2026-04-05
**Status**: Implemented
**Lab**: Lab 2
**Constitution Version**: 2.0.0

---

## Lab 2 Intent

Lab 1 demonstrated that SpecKit shifts AI-assisted development from **ad-hoc prompt engineering** to **spec-driven development** — where every feature begins with a governed, reviewable specification before a single line of code is written.

Lab 2 extends that principle into **security at the SDLC boundary**. When a developer asks an AI assistant to "add a Graph API call", the unconstrained output is typically a `fetch` with a hardcoded token, an inline scope string, and no error handling. This is a direct result of prompting without governance.

By running `/speckit.constitution` first — establishing GGS standards before any code is generated — Lab 2 demonstrates that the **spec itself becomes the security control**. The AI does not invent a token strategy; it is constrained to `acquireTokenSilent`. It does not scatter scope strings; it is constrained to `src/authConfig.ts`. It does not silently swallow errors; it is required to handle `InteractionRequiredAuthError`.

### The Constitution as a Global Security Policy

A critical distinction from Lab 1: the constitution is not scoped to a single feature. It is a **global security policy for the entire project** — covering every feature, past and present. When the Lab 2 constitution (v2.0.0) is ratified with GGS-001 through GGS-005, those standards apply retroactively to the Lab 1 codebase as well. The sign-in flow, the claims table, the logout button — all are now subject to the same governance standards as the new Graph integration.

This means the constitution serves two roles simultaneously:
1. **A generative constraint** — shaping what the AI produces for new features
2. **A standing audit standard** — against which all existing code can be reviewed and challenged

For lab attendees, this models how security policy works in real organisations: a new security standard does not exempt legacy code. When you add GGS-003 to the constitution, every existing API call in the project is now measured against it — not just the one you are about to write.

**The core lesson**: In AI-assisted development, where the AI produces code without a spec, *the developer is the last line of defence*. SpecKit moves security requirements upstream — into the spec, the plan, and the task definition — so the AI is writing to a contract, not guessing. And once that contract exists, it governs everything.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Extended Corporate Profile (Priority: P1)

As an authenticated user, I want to see my extended corporate profile information so that I can verify my identity data as stored in Entra ID.

After signing in, the user sees a `ProfileCard` component displaying their `jobTitle`, `officeLocation`, and `preferredLanguage` as fetched live from the Microsoft Graph `/me` endpoint.

**Why this priority**: This is the entire purpose of Lab 2. Without a successful Graph call, no other story is deliverable.

**Independent Test**: After sign-in, verify the `ProfileCard` renders with the three fields populated from a real Graph API response. Confirm the `Authorization: Bearer <token>` header is present on the request in browser DevTools.

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** the dashboard loads, **Then** a `ProfileCard` component is rendered displaying `jobTitle`, `officeLocation`, and `preferredLanguage`.
2. **Given** a field value is `null` or not set in Entra ID, **When** rendered in the `ProfileCard`, **Then** the field is shown with a `—` placeholder rather than blank or `null`.
3. **Given** the user is unauthenticated, **When** they attempt to access the dashboard, **Then** they are redirected to the sign-in page before any Graph call is made.

---

### User Story 2 — Loading State During Profile Fetch (Priority: P2)

As an authenticated user, I want to see a clear loading indicator while my profile is being fetched so that the app does not appear broken during the API call.

**Why this priority**: Directly impacts perceived quality. Without it, a slow Graph response looks like a hang.

**Independent Test**: On a throttled connection (Chrome DevTools → Slow 3G), verify the `ProfileCard` area renders "Fetching Profile..." text before the Graph response arrives.

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** the Graph API call is in flight, **Then** a "Fetching Profile..." message is displayed in place of the `ProfileCard` content.
2. **Given** the Graph response arrives, **When** data is set in state, **Then** the loading message is replaced by the populated `ProfileCard`.

---

### User Story 3 — Error Handling with Retry (Priority: P2)

As an authenticated user, if the Graph call fails (e.g. due to an expired or insufficient token), I want to see a friendly error message and a "Retry" button so that I can recover without a full page reload.

**Why this priority**: Required by GGS-003 — `InteractionRequiredAuthError` must be handled explicitly. Silent failure is a violation.

**Independent Test**: Simulate a Graph failure by temporarily providing a malformed token. Verify the error state renders with the message and a functional "Retry" button that re-triggers `acquireTokenSilent` and a fresh Graph call.

**Acceptance Scenarios**:

1. **Given** the Graph call fails with any error, **When** the error is caught, **Then** a user-friendly error message is displayed (not a raw error object).
2. **Given** the error is `InteractionRequiredAuthError`, **When** caught, **Then** `acquireTokenPopup` or `acquireTokenRedirect` is triggered to re-establish the session.
3. **Given** the error state is shown, **When** the user clicks "Retry", **Then** `acquireTokenSilent` is called again and the Graph fetch is re-attempted.
4. **Given** the retry succeeds, **When** the Graph response arrives, **Then** the error state is cleared and the `ProfileCard` is rendered with fresh data.

---

### Edge Cases

- What if `jobTitle`, `officeLocation`, or `preferredLanguage` is not set in Entra ID? → Render `—` for each absent field. Never render `null` or `undefined` as a string.
- What if `acquireTokenSilent` succeeds but the Graph call returns a non-200 status? → Treat as a Graph error; display the error state with Retry.
- What if the user navigates away and back while the fetch is in flight? → Cancel in-flight requests via `AbortController` to prevent state updates on unmounted components.
- What if multiple rapid retries are triggered? → Disable the Retry button while a token acquisition or fetch is in progress to prevent race conditions.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST call `https://graph.microsoft.com/v1.0/me` after sign-in to retrieve the authenticated user's profile.
- **FR-002**: The Graph API call MUST use a Bearer token obtained exclusively via `instance.acquireTokenSilent()`. *(GGS-003)*
- **FR-003**: `InteractionRequiredAuthError` MUST be caught and handled by triggering `acquireTokenPopup` or `acquireTokenRedirect`. *(GGS-003)*
- **FR-004**: The fields `jobTitle`, `officeLocation`, and `preferredLanguage` MUST be fetched and displayed in a `ProfileCard` component.
- **FR-005**: Null or absent field values MUST be rendered as `—` in the `ProfileCard`.
- **FR-006**: A loading state ("Fetching Profile...") MUST be displayed while the Graph call is in flight. *(GGS-005)*
- **FR-007**: A user-friendly error message and a "Retry" button MUST be displayed if the Graph call fails.
- **FR-008**: The Graph `User.Read` scope MUST be the only scope requested. It MUST be defined in `src/authConfig.ts` and not inline in component code. *(GGS-004)*
- **FR-009**: No other code path may access Microsoft Graph directly — all Graph calls MUST go through a dedicated service function. *(GGS-003, GGS-004)*
- **FR-010**: The `ProfileCard` component MUST be read-only. No user-editable fields.
- **FR-011**: In-flight requests MUST be cancellable via `AbortController` to prevent state updates on unmounted components.
- **FR-012**: Implicit flow MUST remain disabled on the App Registration. Access tokens for Microsoft Graph MUST be obtained exclusively via Authorization Code Flow + PKCE (`acquireTokenSilent` / `acquireTokenRedirect`). No access or ID tokens may be issued via the implicit grant. *(GGS-002, GGS-004)*

### Key Entities

- **Graph Token**: An access token (not the ID token) obtained via `acquireTokenSilent` with the `User.Read` scope, used in the `Authorization` header for Graph requests.
- **ProfileCard**: A new React component that renders the three Graph profile fields in a structured, read-only UI.
- **Graph Service**: A dedicated module (`src/services/graphService.ts`) encapsulating the `fetch` call to `/v1.0/me` — the single authorised point of access to Graph.
- **InteractionRequiredAuthError**: An MSAL error class indicating silent token acquisition failed and user interaction is needed.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `ProfileCard` renders with populated `jobTitle`, `officeLocation`, and `preferredLanguage` data from a live Graph `/me` response on every authenticated load.
- **SC-002**: The `Authorization: Bearer <token>` header is present on every Graph request (verifiable in browser DevTools Network tab).
- **SC-003**: The loading state is shown before the Graph response and replaced once data arrives.
- **SC-004**: Simulating a token error triggers the error state with a visible Retry button that successfully re-fetches data.
- **SC-005**: No `User.Read` scope string appears anywhere outside `src/authConfig.ts`. *(GGS-004)*
- **SC-006**: No hardcoded token, key, or secret appears anywhere in the codebase. *(GGS-002)*

---

## Assumptions

- The Entra ID App Registration (`YOUR_CLIENT_ID`) already has `User.Read` delegated permission granted.
- The `User.Read` scope is sufficient to return `jobTitle`, `officeLocation`, and `preferredLanguage` from the `/v1.0/me` endpoint.
- The existing `ClaimsTable` and `Dashboard` components from Lab 1 remain unchanged by this feature.
- The `ProfileCard` is additive — it appears alongside the existing claims table, not replacing it.
- TypeScript is the implementation language. Strict mode remains enabled.
- Mobile/responsive layout is out of scope; desktop viewport is the target.
