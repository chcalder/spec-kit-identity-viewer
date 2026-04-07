# Feature Specification: Entra ID Sign-In & JWT Claims Dashboard

**Feature Branch**: `001-entra-signin-claims-dashboard`
**Created**: 2026-04-05
**Status**: Implemented
**Lab**: Lab 1
**Input**: User description: "Create a React SPA that allows a user to sign in via Microsoft Entra ID. After login, it should display a dashboard showing a 'Welcome [Name]' message and a table of all JWT claims from the ID token. Include a logout button."

---

## Lab 1 Intent

In traditional software development, security requirements are often discovered late — in code review, penetration testing, or after a breach. In AI-assisted development, this problem is amplified: when a developer prompts an AI to "build a login page," the AI produces something that works, but the security properties of that output are entirely dependent on what was in the prompt.

Lab 1 introduces **SpecKit** as the answer to this problem. Instead of prompting the AI directly for code, the developer first runs `/speckit.constitution` to establish governing principles — PKCE-only auth, no implicit flow, no hardcoded secrets, functional components — and then runs `/speckit.specify` to produce a reviewable feature specification before any code is written.

The result is that security is no longer something added to code after the fact. It is written into the requirements. The AI then writes code *to those requirements*, and the spec becomes the audit trail proving it did so.

**The core lesson**: Switching from prompt engineering ("write me a login page") to spec-driven development ("here is the specification — implement it") is not just a workflow improvement. It is a **security control**. SpecKit makes that switch systematic.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In with Microsoft Entra ID (Priority: P1)

A user lands on the app and sees a sign-in prompt. They click "Sign In", are redirected to Microsoft Entra ID, authenticate, and are returned to the app as a signed-in user.

**Why this priority**: Without authentication, no other feature is accessible. This is the foundation of the entire app.

**Independent Test**: Can be tested by loading the app, clicking Sign In, completing the Entra ID login flow, and verifying the user is redirected back to the app in an authenticated state.

**Acceptance Scenarios**:

1. **Given** the user is unauthenticated, **When** they visit the app, **Then** they see a Sign In button and no dashboard content.
2. **Given** the user clicks Sign In, **When** they complete Entra ID authentication, **Then** they are returned to the app and the dashboard is displayed.
3. **Given** the user is authenticated, **When** they revisit the app, **Then** they remain signed in (token cached by MSAL).

---

### User Story 2 - Welcome Message on Dashboard (Priority: P2)

After signing in, the user sees a personalised welcome message using their display name from the ID token.

**Why this priority**: Core post-login experience. Directly proves the ID token was received and decoded correctly.

**Independent Test**: After sign-in, verify the dashboard heading reads "Welcome [User's Display Name]" where the name comes from the `name` claim in the ID token.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** the dashboard loads, **Then** a heading reading "Welcome [name]" is displayed using the `name` claim from the ID token.
2. **Given** the `name` claim is absent, **When** the dashboard loads, **Then** the app falls back to the `preferred_username` claim.

---

### User Story 3 - JWT Claims Table (Priority: P2)

After signing in, the user sees a table listing all claims from the decoded ID token — claim name in one column, claim value in the other.

**Why this priority**: This is the primary learning/diagnostic feature of the app. Delivering this alongside the welcome message constitutes a complete MVP.

**Independent Test**: After sign-in, verify a table is rendered with at minimum the following claims visible: `oid`, `sub`, `name`, `preferred_username`, `email`, `tid`, `iss`, `iat`, `exp`.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** the dashboard loads, **Then** a table is displayed with all claims from the decoded ID token.
2. **Given** the ID token contains a claim with a complex value (array or object), **When** rendered in the table, **Then** the value is serialised to a readable string (e.g. JSON).
3. **Given** the user is unauthenticated, **When** they visit the dashboard route, **Then** they are redirected to the sign-in screen.

---

### User Story 4 - Sign Out (Priority: P3)

The signed-in user can click a Logout button to end their session and return to the unauthenticated state.

**Why this priority**: Required for a complete auth flow but does not block the core value delivery of P1–P2 stories.

**Independent Test**: After sign-in, click Logout and verify the user is returned to the unauthenticated landing page with no ID token data visible.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they click Logout, **Then** the MSAL session is cleared and the sign-in screen is shown.
2. **Given** the user has logged out, **When** they revisit the app, **Then** they see the sign-in prompt with no cached session.

---

### Edge Cases

- What happens when the Entra ID authority URL is misconfigured? → MSAL should throw an error; the app should display a clear error message rather than a blank screen.
- What happens if the ID token is expired? → MSAL handles silent token refresh; the app should not manually inspect expiry.
- What happens when a claim value is `null` or `undefined`? → Render as `—` in the table.
- What happens on popup-blocked environments? → MSAL redirect flow is used; no popup dependency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST authenticate users via Microsoft Entra ID using Authorization Code Flow with PKCE.
- **FR-002**: The app MUST use `@azure/msal-react` and `@azure/msal-browser` for all authentication operations.
- **FR-003**: The app MUST display a "Welcome [name]" heading after successful sign-in, sourced from the ID token `name` claim (fallback: `preferred_username`).
- **FR-004**: The app MUST display a table of all decoded ID token claims (claim name + claim value) on the dashboard.
- **FR-005**: The app MUST provide a Logout button that clears the MSAL session and returns the user to the unauthenticated view.
- **FR-006**: The app MUST redirect unauthenticated users away from the dashboard to the sign-in page.
- **FR-007**: No client secrets, access tokens, or sensitive values may be hardcoded or stored in client-side code.
- **FR-008**: Implicit flow MUST remain disabled. No access or ID tokens via implicit grant.

### Key Entities

- **ID Token**: JWT issued by Entra ID after successful authentication. Contains claims about the user.
- **Claim**: A key-value pair within the ID token (e.g., `name`, `oid`, `tid`, `exp`).
- **MSAL Account**: The `AccountInfo` object returned by MSAL after sign-in, used to retrieve the ID token claims.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full sign-in → dashboard → logout flow without errors.
- **SC-002**: The claims table displays a minimum of 8 standard Entra ID claims from the ID token.
- **SC-003**: The app renders correctly in dark mode using Tailwind CSS with no unstyled content flash.
- **SC-004**: No network requests to Microsoft Graph are required for Lab 1 — all data comes from the cached ID token claims only. *(Note: Lab 2 intentionally introduces a live Graph `/me` call as the next step in the SpecKit SDLC workflow, governed by GGS-003 and GGS-004.)*

## Assumptions

- The Entra ID App Registration is already provisioned with Client ID `<YOUR_CLIENT_ID>` and Tenant ID `<YOUR_TENANT_ID>`.
- The SPA redirect URIs `http://localhost:3000` and `http://localhost:3001` are registered in the App Registration.
- The app runs locally during development; `window.location.origin` is used dynamically for the redirect URI.
- Mobile/responsive layout is out of scope for v1; desktop viewport is the target.
- No backend API calls are required — the app reads claims directly from the MSAL ID token cache.
- TypeScript is the implementation language.
