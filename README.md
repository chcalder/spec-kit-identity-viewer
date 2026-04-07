# Agentic SDLC Labs: Spec-Driven Security with Spec-Kit and Microsoft Entra ID

## About This Lab Series

This is a hands-on lab series that teaches you how to use **[Spec-Kit](https://github.com/github/spec-kit)** ([docs](https://github.github.com/spec-kit/)) — a structured AI development workflow — to build secure, identity-aware applications on Azure. Each lab builds on the previous one in a single codebase, progressing from a basic sign-in flow to a production-grade security governance model.

The central thesis: **when security is defined in the spec before the AI writes any code, it stops being something you add at the end and becomes something the code is generated to satisfy from the beginning.** This lab series is designed to make that idea concrete and repeatable.

---

## What Is Spec-Kit?

[Spec-Kit](https://github.com/github/spec-kit) ([official docs](https://github.github.com/spec-kit/)) is a set of VS Code Copilot slash commands that bring structure to AI-assisted development. Instead of asking Copilot to "build me a feature" and hoping the output is secure and well-architected, Spec-Kit guides you through a deliberate sequence:

| Command | Purpose | What It Produces |
|---|---|---|
| `/speckit.constitution` | Define project-wide principles and security standards | `.specify/memory/constitution.md` — injected into every subsequent command |
| `/speckit.specify` | Write user stories, acceptance criteria, and feature requirements | `specs/NNN-feature/spec.md` |
| `/speckit.plan` | Make architecture and technology decisions before writing code | `specs/NNN-feature/plan.md` |
| `/speckit.tasks` | Break the plan into independently testable increments | `specs/NNN-feature/tasks.md` |
| `/speckit.implement` | Execute tasks phase-by-phase with AI assistance | Source code |

The key insight is that the **constitution is injected as context** for every subsequent command. This means the AI generates code that is constrained by your security standards, not by whatever pattern appeared most often in its training data.

---

## What You Will Learn

By completing all three labs, you will be proficient in:

### Spec-Kit Workflow
- Using all five Spec-Kit slash commands in the correct sequence
- Writing a **constitution** that acts as a project-wide security policy
- Writing **feature specs** with traceable requirements and acceptance scenarios
- Using an **implementation plan** to resolve architecture questions before any code is generated
- Breaking work into **phased tasks** with an auditable responsibility boundary between developer and infra/admin

### Security Engineering in the SDLC
- How to define **Global Governance Standards (GGS)** that apply to every feature across the entire project
- How to define **Feature-Specific Controls (FSCs)** that add security constraints for high-sensitivity features — and why they can never relax a GGS standard

### Azure Identity Platform
- Provisioning **[Entra ID App Registrations](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)** with **[Azure Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)** using the **[Microsoft Graph Bicep extension](https://learn.microsoft.com/en-us/graph/templates/overview-bicep)**
- Authenticating users with **[MSAL v5](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview)** (`@azure/msal-react` + `@azure/msal-browser`) using Authorization Code Flow with PKCE
- Acquiring **access tokens** silently via `acquireTokenSilent` and handling `InteractionRequiredAuthError`
- Calling the **[Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)** with a Bearer token
- Working with **[App Roles](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps)** — how they are defined in Bicep, published to the manifest, assigned to users or security groups, and surfaced as `roles` claims in the ID token

---

## Lab Progression

Each lab introduces a deeper layer of Spec-Kit governance and a new security capability:

| Lab | Git Tag | New Security Capability | New Spec-Kit Concept |
|---|---|---|---|
| Lab 1 | `lab1-complete` | Entra ID auth + JWT claims visibility | Constitution, spec, plan, tasks, implement |
| Lab 2 | `lab2-complete` | Global Governance Standards (GGS-001–005) | Constitution as project-wide security policy |
| Lab 3 | `lab3-complete` | Layered Governance — FSC step-up RBAC, PII masking, audit trail | FSCs on top of inherited GGS standards |

The same codebase runs across all labs. Use git tags to navigate:
```bash
git checkout lab1-complete   # see the exact state at the end of Lab 1
git checkout lab2-complete   # see the exact state at the end of Lab 2
git checkout lab3-complete   # see the exact state at the end of Lab 3
git checkout master          # return to latest
```

---

## Getting Started — Prerequisites

Before beginning Lab 1, ensure the following are in place:

### Tools
| Tool | Version | How to Check |
|---|---|---|
| Node.js | 20+ | `node --version` |
| Azure CLI | Latest | `az --version` |
| Bicep CLI | 0.36.1+ | `az bicep version` |
| VS Code | Latest | — |
| Git | Any | `git --version` |

### VS Code Extensions
Install the following before starting:
```bash
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
code --install-extension ms-azuretools.vscode-bicep
code --install-extension ms-vscode.azure-account
```

### Azure Access
- An Azure account with permission to **create App Registrations** (`Application.ReadWrite.OwnedBy` or `Application.ReadWrite.All`)
- An active Azure subscription with permission to create resource groups

### Spec-Kit
Install [Spec-Kit](https://github.com/github/spec-kit) in VS Code ([official docs](https://github.github.com/spec-kit/)):
```bash
code --install-extension specstory.specstory-vscode
```

Then initialise Spec-Kit in your project folder:
```bash
mkdir spec-kit-identity-viewer
cd spec-kit-identity-viewer
specify init --integration copilot
```

> ⚠️ **Important**: Always run `specify init` and complete Spec-Kit setup **before** scaffolding any tooling (Vite, npm, etc.). The `.specify/` folder must exist before you run `/speckit.constitution`. Never run `npm create vite` with `--overwrite` — it will delete `.specify/` and all your spec files.

---

# Lab 1: React SPA Identity Claims Viewer

## Overview

This lab guides you through building a **React Single-Page Application** that authenticates users via **Microsoft Entra ID** and displays all decoded JWT claims from the ID token. The app is built from scratch — from infrastructure provisioning through to a working sign-in flow — using a structured, AI-assisted development workflow powered by **Spec-Kit**.

The lab demonstrates how Spec-Kit transforms the way you work with AI coding assistants, turning free-form prompts into a governed, traceable development process.

---

## What You Will Build

A dark-mode React SPA that:

- Presents a **Sign In with Microsoft** landing page for unauthenticated users
- Authenticates via **Microsoft Entra ID** using Authorization Code Flow with PKCE
- Displays a **dashboard** showing a personalised "Welcome, [Name]" heading after login
- Renders a **full table of all JWT claims** decoded from the Entra ID token
- Provides a **Logout** button to end the session

**Infrastructure**: The Entra ID App Registration is provisioned entirely via **Azure Bicep** using the Microsoft Graph Bicep extension.

---

## Learning Objectives

By completing this lab, you will learn:

### Spec-Kit Workflow
- How to use the **Spec-Kit slash commands** (`/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) as a structured AI development workflow
- How a **constitution** acts as a governing document that enforces consistent decisions across the entire project
- How to write a **feature spec** with user stories, acceptance scenarios, and functional requirements
- How to use an **implementation plan** to make architectural decisions before writing any code
- How a **task list** breaks a feature into independently testable increments

### Infrastructure as Code
- How to provision an **Entra ID App Registration** using Azure Bicep with the Microsoft Graph extension
- How to configure a **SPA platform** (PKCE, redirect URIs, disabled implicit flow) in Bicep
- How to declare **delegated Graph permissions** (`User.Read`, `openid`, `profile`, `email`) in code

### Authentication with MSAL
- How `@azure/msal-react` and `@azure/msal-browser` work together in a React app
- How to configure `PublicClientApplication` and wrap an app in `MsalProvider`
- How to use `useIsAuthenticated`, `useMsal`, and `useAccount` hooks to drive auth state
- How to read **ID token claims** directly from the MSAL account cache — without calling any API

---

## Prerequisites

Before starting, ensure you have:

| Requirement | Version | Check |
|---|---|---|
| Node.js | 20+ | `node --version` |
| Azure CLI | Latest | `az --version` |
| Bicep CLI | 0.36.1+ | `az bicep version` |
| VS Code | Latest | |
| VS Code Bicep extension | Latest | `ms-azuretools.vscode-bicep` |
| Azure account | With permission to create App Registrations | |
| Spec-Kit | 0.5.1+ | Installed in your project |

Install the Azure Account and ARM Tools extensions in VS Code:
```bash
code --install-extension ms-vscode.azure-account
code --install-extension msazurermtools.azurerm-vscode-tools
```

---

## Lab Architecture

```
spec-kit-identity-viewer/
├── main.bicep                  # Entra ID App Registration (IaC)
├── bicepconfig.json            # Microsoft Graph Bicep extension config
├── .specify/
│   └── memory/
│       └── constitution.md     # Spec-Kit project constitution
├── specs/
│   └── 001-entra-signin-claims-dashboard/
│       ├── spec.md             # Feature specification
│       ├── plan.md             # Implementation plan
│       └── tasks.md            # Task breakdown
└── src/
    ├── authConfig.ts           # MSAL configuration
    ├── main.tsx                # App bootstrap + MsalProvider
    ├── App.tsx                 # Auth routing
    └── components/
        ├── SignInPage.tsx       # Unauthenticated landing page
        ├── Dashboard.tsx       # Post-login view
        └── ClaimsTable.tsx     # JWT claims table
```

---

## Step-by-Step Instructions

> ⚠️ **Important**: Always complete Spec-Kit setup **before** scaffolding any tooling. Never run `npm create vite` with `--overwrite` into an existing project directory — it will delete `.specify/` and `specs/`.

---

### Step 1: Create the Project Folder

Create a **new empty folder** for this lab:

```bash
mkdir spec-kit-identity-viewer
cd spec-kit-identity-viewer
```

Initialise Spec-Kit inside it:

```bash
specify init --integration copilot
```

This creates the `.specify/` directory and template files.

---

### Step 2: Define the Constitution (`/speckit.constitution`)

In VS Code Copilot chat, run the `/speckit.constitution` command with the following input:

```
Project: React SPA Identity Claims Viewer.

Infrastructure Details:
- Client ID: (fill in after Bicep deploy)
- Tenant ID: (fill in after Bicep deploy)
- Authority: https://login.microsoftonline.com/[TenantID]

Guiding Principles:
- Use @azure/msal-react for authentication.
- Use Tailwind CSS for a modern, dark-mode UI.
- Security: Strictly use Authorization Code Flow with PKCE. No client secrets.
- Architecture: Functional components with Hooks.
```

This populates `.specify/memory/constitution.md` — the governing document for all AI decisions in this project.

---

### Step 3: Provision the App Registration (Bicep)

Create `bicepconfig.json` in the project root:

```json
{
  "extensions": {
    "microsoftGraphV1": "br:mcr.microsoft.com/bicep/extensions/microsoftgraph/v1.0:1.0.0"
  }
}
```

Create `main.bicep`:

```bicep
extension microsoftGraphV1

param appDisplayName string = 'spec-kit-identity-viewer'

resource app 'Microsoft.Graph/applications@v1.0' = {
  displayName: appDisplayName
  uniqueName: appDisplayName

  spa: {
    redirectUris: [
      'http://localhost:3000'
      'http://localhost:3001'
    ]
  }

  web: {
    implicitGrantSettings: {
      enableAccessTokenIssuance: false
      enableIdTokenIssuance: false
    }
  }

  requiredResourceAccess: [
    {
      resourceAppId: '00000003-0000-0000-c000-000000000000'
      resourceAccess: [
        { id: 'e1fe6dd8-ba31-4d61-89e7-88639da4683d', type: 'Scope' } // User.Read
        { id: '37f7f235-527c-4136-accd-4a02d197296e', type: 'Scope' } // openid
        { id: '14dad69e-099b-42c9-810b-d002981feec1', type: 'Scope' } // profile
        { id: '64a6cdd6-aab1-4aff-b8bf-fe6a18a40799', type: 'Scope' } // email
      ]
    }
  ]
}

output clientId string = app.appId
output tenantId string = tenant().tenantId
```

Sign in and deploy:

```bash
az login
az group create --name spec-kit-identity-viewer-rg --location eastus
az deployment group create \
  --resource-group spec-kit-identity-viewer-rg \
  --template-file main.bicep
```

Copy the `clientId` and `tenantId` from the deployment outputs and update your constitution.

---

### Step 4: Write the Feature Spec (`/speckit.specify`)

In Copilot chat, run `/speckit.specify` with:

```
Create a React SPA that allows a user to sign in via Microsoft Entra ID.
After login, it should display a dashboard showing a 'Welcome [Name]' message
and a table of all JWT claims from the ID token. Include a logout button.
```

This creates `specs/001-entra-signin-claims-dashboard/spec.md` with user stories, acceptance scenarios, and functional requirements.

---

### Step 5: Write the Implementation Plan (`/speckit.plan`)

In Copilot chat, run `/speckit.plan` with:

```
Use the Client ID and Tenant ID from the constitution. Use @azure/msal-react
for the auth provider. Use Tailwind CSS for styling. Plan for a modular
structure: authConfig.ts, ClaimsTable.tsx, and App.tsx.
```

This creates `specs/001-entra-signin-claims-dashboard/plan.md`.

---

### Step 6: Generate the Task List (`/speckit.tasks`)

In Copilot chat, run `/speckit.tasks`.

This creates `specs/001-entra-signin-claims-dashboard/tasks.md` with all tasks broken into phases.

---

### Step 7: Scaffold the React App

Scaffold Vite into the current folder:

```bash
npm create vite@latest . -- --template react-ts
```

> When prompted to install and start — select **No** (scaffold only, do not overwrite existing files).

Install dependencies:

```bash
npm install
npm install @azure/msal-browser @azure/msal-react
npm install -D tailwindcss @tailwindcss/vite
```

---

### Step 8: Implement the App (`/speckit.implement`)

Work through the phases using `/speckit.implement` in Copilot chat, following the task list. Key configuration changes:

**`vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
})
```

**`src/index.css`** — replace entire contents with:
```css
@import "tailwindcss";
```

**`index.html`** — update `<html>` tag:
```html
<html lang="en" class="dark">
```

**`src/authConfig.ts`**
```typescript
import { type Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};
```

---

### Step 9: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Expected flow:**
1. Dark landing page — "Identity Claims Viewer" — Sign In button
2. Click → redirected to Microsoft Entra ID login
3. After login → "Welcome, [Your Name]" dashboard with full claims table
4. Logout button top-right → session cleared, back to landing page

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `BCP204: Extension not recognized` | `bicepconfig.json` missing or wrong format | Ensure `bicepconfig.json` exists with the OCI registry string (not `"builtin"`) |
| App Registration not created after deploy | Missing Graph API permissions on deploying user | Deploying user needs `Application.ReadWrite.OwnedBy` or `Application.ReadWrite.All` |
| Port auto-increments to 3001 | Port 3000 already in use | Already handled by `window.location.origin` — both ports are registered in Bicep |
| Claims table empty / double login required | `redirectUri` mismatch | Use `window.location.origin` — never hardcode `localhost:3000` |
| `.specify/` folder missing after scaffold | Used `--overwrite` when running `npm create vite` | Never use `--overwrite` in an existing Spec-Kit project — scaffold into an empty folder first |

---

## Spec-Kit Commands Reference

| Command | Purpose | Output |
|---|---|---|
| `/speckit.constitution` | Define project principles and infrastructure | `.specify/memory/constitution.md` |
| `/speckit.specify` | Write user stories and acceptance criteria | `specs/NNN-feature/spec.md` |
| `/speckit.plan` | Design architecture and technical decisions | `specs/NNN-feature/plan.md` |
| `/speckit.tasks` | Break the plan into phased tasks | `specs/NNN-feature/tasks.md` |
| `/speckit.implement` | Execute tasks phase-by-phase with AI | Source code |

---

## What's Next

This repository uses a **single-directory, git-tag-per-lab** strategy. Each lab builds on the previous one in the same codebase. Use git tags to navigate between completed lab states:

```bash
git checkout lab1-complete   # view the exact Lab 1 completion state
git checkout master          # return to the latest lab
```

| Lab | Git Tag | Feature Added |
|---|---|---|
| Lab 1 | `lab1-complete` | Entra ID sign-in + JWT claims dashboard |
| Lab 2 | `lab2-complete` | Microsoft Graph `/me` profile integration |
| Lab 3 | `lab3-complete` | Financial Export with Layered Governance (GGS + FSC) |
| Lab 4 | — | Deploy to Azure Static Web Apps |

Each lab also introduces a deeper layer of Spec-Kit governance — from basic authentication principles (Lab 1) to a full project-wide security policy via Global Governance Standards (Lab 2 onwards).

---

# Lab 2: Microsoft Graph Profile Integration

## Overview

Lab 2 extends the Lab 1 SPA by calling the **Microsoft Graph API** to retrieve live corporate profile data from Entra ID. It demonstrates how Spec-Kit's **Global Governance Standards (GGS)** function as a project-wide security policy — governing not just the new feature, but all code past and future.

The central lesson: in AI-assisted development, **the spec is the security control**. When you define token acquisition patterns, scope restrictions, and component boundaries in the constitution before any code is generated, the AI writes to those constraints rather than to insecure defaults from its training data.

---

## Why This Lab Matters for Security

Without a governing spec, asking an AI to "add a Graph API call" reliably produces:
- A `fetch` call without a proper `Authorization` header
- Scope strings hardcoded inline in components
- Silent error swallowing when tokens expire
- No handling of `InteractionRequiredAuthError`

These are the most common patterns in publicly available code — and therefore the most common patterns in AI training data. Spec-Kit interrupts this by requiring a **constitution** and **spec** before code generation, injecting security requirements as prompt constraints.

| Without Spec-Kit | With Spec-Kit (GGS) |
|---|---|
| AI guesses a token strategy | GGS-003 mandates `acquireTokenSilent` |
| Scope strings appear in components | GGS-004 requires centralisation in `authConfig.ts` |
| Errors silently swallowed | FR-003 requires `InteractionRequiredAuthError` handling |
| Security reviewed after code exists | Security written into requirements before code is generated |

### The Constitution as a Global Security Policy

The constitution is not scoped to a single feature. Ratifying GGS-001 through GGS-005 in Lab 2 means those standards apply **retroactively** to the Lab 1 codebase as well. Any future AI suggestion — for any feature — that violates a GGS standard can be cited by ID and rejected. This models how security policy works in real organisations: new standards do not exempt legacy code.

---

## What You Will Build

Extending the Lab 1 dashboard with:

- A **`ProfileCard` component** displaying `jobTitle`, `officeLocation`, and `preferredLanguage` from a live Graph `/me` call
- A **"Fetching Profile..." loading state** while the request is in flight
- A **user-friendly error state** with a "Retry" button that re-acquires a token and re-fetches
- A **`graphService.ts` service module** encapsulating all Graph API logic — the single authorised point of access

---

## Learning Objectives

### Spec-Kit Governance
- How to evolve the **constitution** from Lab 1 principles to v2.0.0 with explicit Global Governance Standards
- How GGS standards act as **named violations** — reviewable, citeable, and reject-able by ID
- How the Guardrail Effect works: constitution as prompt bias, not hard enforcement — and why human review remains essential
- How the constitution becomes the **standing security policy** for all features, not just new ones

### Microsoft Graph Integration
- How to acquire an **access token** (distinct from the ID token) via `acquireTokenSilent`
- How to handle **`InteractionRequiredAuthError`** when silent token acquisition fails
- How to make a **Bearer-authenticated `fetch`** to Microsoft Graph `/v1.0/me`
- How to use `AbortController` to cancel in-flight requests on component unmount

### Architecture
- How to separate **API/auth logic** (`graphService.ts`) from **UI rendering** (`ProfileCard.tsx`)
- How to implement **loading, success, and error states** in a single `useEffect`
- How to make security properties **auditable** without reading every line of code

---

## Prerequisites

Completion of Lab 1 (`git checkout lab1-complete` as your starting point), plus:

| Requirement | Notes |
|---|---|
| Lab 1 complete | App Registration provisioned, sign-in flow working |
| `User.Read` permission consented | Verify in Azure Portal → App Registration → API Permissions |
| Implicit flow confirmed disabled | `enableAccessTokenIssuance: false` in `main.bicep` ✅ already set |

> No new npm packages are required. Microsoft Graph is called via native `fetch`.

---

## Lab 2 Architecture

```
src/
├── authConfig.ts              # unchanged — User.Read scope already present
├── main.tsx                   # unchanged
├── App.tsx                    # unchanged
├── types/
│   └── graph.ts               # NEW — GraphProfile interface (3 nullable fields)
├── services/
│   └── graphService.ts        # NEW — acquireTokenSilent → Bearer fetch → GraphProfile
└── components/
    ├── SignInPage.tsx          # unchanged
    ├── ClaimsTable.tsx        # unchanged
    ├── ProfileCard.tsx        # NEW — pure display component, no MSAL imports
    └── Dashboard.tsx          # MODIFIED — adds ProfileCard with loading/error/retry
```

**Dependency rule**: `ProfileCard` never imports from `graphService`. `graphService` never imports from any component. All orchestration lives in `Dashboard`.

---

## Global Governance Standards (GGS)

Defined in `.specify/memory/constitution.md` v2.0.0. These apply to all features in this project.

| Standard | Rule |
|---|---|
| GGS-001 | All features gated by `@azure/msal-react`. No anonymous access. |
| GGS-002 | No hardcoded secrets. `PublicClientApplication` + PKCE only. No implicit flow. |
| GGS-003 | All API calls use `acquireTokenSilent`. Handle `InteractionRequiredAuthError` explicitly. |
| GGS-004 | `User.Read` only. All scope definitions in `src/authConfig.ts`. |
| GGS-005 | Use `ClaimsTable` or `SanitizedDataView` for identity data. No `dangerouslySetInnerHTML`. |

Any AI-generated suggestion that violates one of the above is a **named constitutional violation** — cite the GGS ID and request a corrected implementation.

---

## Step-by-Step Instructions

### Step 1: Start from Lab 1

```bash
git checkout master   # or git checkout lab2-complete to see the finished result
```

Confirm the dev server still runs clean from Lab 1:

```bash
npm run dev
```

---

### Step 2: Evolve the Constitution (`/speckit.constitution`)

In Copilot chat, run `/speckit.constitution` with:

```
Project: Secure React Identity & Graph POC

GGS-001 (Identity Baseline): All features must be gated by @azure/msal-react. No anonymous access.
GGS-002 (Credential Security): No hardcoded secrets. Use PublicClientApplication with PKCE.
GGS-003 (Token Governance): All API calls must use acquireTokenSilent. Handle InteractionRequiredAuthError.
GGS-004 (Least Privilege): User.Read only. Centralise all scopes in src/authConfig.ts.
GGS-005 (UI Integrity): Use ClaimsTable or SanitizedDataView for rendering identity data.
```

This evolves `.specify/memory/constitution.md` to v2.0.0 with GGS standards and the Guardrail Effect section.

---

### Step 3: Write the Feature Spec (`/speckit.specify`)

In Copilot chat, run `/speckit.specify` with:

```
Feature: Microsoft Graph Profile Integration

As an authenticated user, I want to see my extended corporate profile
(jobTitle, officeLocation, preferredLanguage) fetched from Graph /me,
with a loading state, error handling, and a Retry button.
```

This creates `specs/002-graph-profile-integration/spec.md`.

---

### Step 4: Write the Implementation Plan (`/speckit.plan`)

In Copilot chat, run `/speckit.plan` with:

```
Service layer: src/services/graphService.ts encapsulates all Graph logic.
Component: src/components/ProfileCard.tsx is a pure display component.
State: Dashboard orchestrates loading/error/retry via useEffect and useState.
No new npm dependencies — use native fetch with Bearer token.
```

This creates `specs/002-graph-profile-integration/plan.md`.

---

### Step 5: Generate the Task List (`/speckit.tasks`)

In Copilot chat, run `/speckit.tasks`.

This creates `specs/002-graph-profile-integration/tasks.md` with 29 tasks across 6 phases including a pre-flight verification phase.

---

### Step 6: Pre-flight Verification

Before writing any code, confirm:

```bash
# Verify User.Read is only in authConfig.ts (GGS-004 audit)
grep -rn "User.Read" src/ --include="*.ts" --include="*.tsx"
# Expected: 1 match — src/authConfig.ts only
```

In Azure Portal → App Registration → API Permissions, confirm `User.Read` is granted and admin-consented.

---

### Step 7: Implement (`/speckit.implement`)

Work through phases using `/speckit.implement` in Copilot chat. Key files produced:

**`src/types/graph.ts`**
```typescript
export interface GraphProfile {
  jobTitle: string | null;
  officeLocation: string | null;
  preferredLanguage: string | null;
}
```

**`src/services/graphService.ts`** *(GGS-003, GGS-004)*
```typescript
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';

export async function fetchGraphProfile(instance, account, signal?) {
  let accessToken: string;
  try {
    const response = await instance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account,
    });
    accessToken = response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect({ scopes: loginRequest.scopes });
      throw error;
    }
    throw error;
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (!response.ok) throw new Error(`Graph API error: ${response.status}`);

  const data = await response.json();
  return {
    jobTitle: data.jobTitle ?? null,
    officeLocation: data.officeLocation ?? null,
    preferredLanguage: data.preferredLanguage ?? null,
  };
}
```

**`src/components/ProfileCard.tsx`** *(GGS-005 — pure display, no MSAL)*
```typescript
export default function ProfileCard({ profile }) {
  // Renders jobTitle, officeLocation, preferredLanguage
  // Displays '—' for any null field
  // No fetch logic. No MSAL imports.
}
```

**`src/components/Dashboard.tsx`** — add above `ClaimsTable`:
```typescript
const [profile, setProfile] = useState<GraphProfile | null>(null);
const [isLoadingProfile, setIsLoadingProfile] = useState(true);
const [profileError, setProfileError] = useState<string | null>(null);
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  const controller = new AbortController();
  abortControllerRef.current = controller;
  fetchGraphProfile(instance, account, controller.signal)
    .then(setProfile)
    .catch(e => { if (e.name !== 'AbortError') setProfileError('...') })
    .finally(() => setIsLoadingProfile(false));
  return () => controller.abort();
}, [account?.localAccountId]);
```

---

### Step 8: Verify

```bash
npm run build   # must pass clean
npm run dev     # sign in and confirm ProfileCard renders
```

**DevTools verification** (SC-002):
1. Open DevTools → Network tab
2. Sign in and let the dashboard load
3. Filter by `me` — click the `/v1.0/me` request
4. Headers tab → confirm `Authorization: Bearer eyJ...` is present

**Scope audit** (SC-005):
```bash
grep -rn "User.Read" src/ --include="*.ts" --include="*.tsx"
# Must return exactly 1 match: src/authConfig.ts
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `ProfileCard` shows "Fetching Profile..." indefinitely | `User.Read` not admin-consented | Azure Portal → App Registration → API Permissions → Grant admin consent |
| Graph returns 403 | Token acquired but permission not granted | Consent `User.Read` in Azure Portal, then sign out and back in |
| `InteractionRequiredAuthError` on load | Token cache stale or scopes changed | The app automatically triggers `acquireTokenRedirect` — complete the re-auth flow |
| All three fields show `—` | Fields not populated in your Entra ID profile | Expected for personal accounts — confirms null handling works correctly (FR-005) |
| Retry button does nothing | `isRetrying` state not reset | Ensure `setIsRetrying(false)` is called in the `finally` block of `loadProfile` |

---

## Security Audit Checklist

Before marking Lab 2 complete, verify each item:

- [ ] `User.Read` scope string exists only in `src/authConfig.ts` *(GGS-004)*
- [ ] No `fetch` to Graph exists outside `graphService.ts` *(GGS-003)*
- [ ] `Authorization: Bearer` header visible in DevTools Network tab *(SC-002)*
- [ ] `InteractionRequiredAuthError` caught and handled in `graphService.ts` *(FR-003)*
- [ ] `ProfileCard` contains no MSAL imports *(plan Key Decision #5)*
- [ ] `AbortController` cleanup present in `useEffect` return *(FR-011)*
- [ ] `npm run build` passes with no errors *(T029)*

---

# Lab 3: Financial Export with Layered Governance

## Overview

Lab 3 introduces **Layered Governance** — the most important security pattern in the Spec-Kit methodology. Building on the Global Governance Standards (GGS) established in Lab 2, this lab introduces **Feature-Specific Controls (FSCs)**: security constraints defined in the spec *before any code is written*, scoped to a single high-sensitivity feature, and enforced by construction.

The feature is a **Financial Export panel** that only renders for users holding the `Financial.Auditor` Entra ID App Role. It demonstrates three things working together that are rarely seen in AI-assisted development:

1. **The spec defined the security controls** — not the developer's memory, not a post-hoc review
2. **The AI generated code that satisfies those controls** — because the spec was the prompt
3. **The controls are auditable by grep** — not by reading every function

This is the core thesis of the entire lab series: **moving from prompt engineering to spec-driven development shifts security to the beginning of the SDLC**.

---

## Why This Lab Matters for Security

Without a spec, asking an AI to "add a financial export feature" reliably produces:
- A button visible to all authenticated users — no role check
- Raw account numbers rendered directly into the DOM
- No record of who accessed what, or when
- Security added as an afterthought — if at all

This is not because the AI is careless. It is because the AI generates code that matches patterns in its training data, and most training data does not implement step-up RBAC, PII masking, or pre-action audit logging. Spec-Kit changes this by making security a **pre-condition of code generation**, not a post-condition of code review.

| Without Spec-Kit | With Spec-Kit (FSC) |
|---|---|
| Export visible to all authenticated users | FSC-EXPORT-001 mandates `hasRole()` double-gate before render and invocation |
| Raw account number in DOM | FSC-EXPORT-002 mandates `maskAccountNumber()` — unmasked value never enters component state |
| No audit trail | FSC-EXPORT-003 mandates `auditExportAttempt()` fires before any data is returned |
| Security reviewed after code exists | Security written into the spec before the first file is created |

---

## The Layered Governance Model

Lab 3 operates at two layers simultaneously:

**Layer 1 — Global Governance Standards (GGS)**: Defined in `.specify/memory/constitution.md` v3.0.0. Apply to every feature in the project. The Financial Export feature inherits all five GGS standards from Lab 2 — authentication gating, no hardcoded secrets, token governance, least-privilege scopes, and safe UI rendering.

**Layer 2 — Feature-Specific Controls (FSCs)**: Defined in `specs/003-financial-export/spec.md`. Apply only to this feature. FSCs can only *add* constraints — they can never relax a GGS standard.

```
constitution.md (v3.0.0)
└── GGS-001: Auth gating             ← applies to ALL features
└── GGS-002: No hardcoded secrets    ← applies to ALL features
└── GGS-003: Token governance        ← applies to ALL features
└── GGS-004: Least-privilege scopes  ← applies to ALL features
└── GGS-005: Safe UI rendering       ← applies to ALL features

specs/003-financial-export/spec.md
└── FSC-EXPORT-001: Step-up RBAC     ← Financial Export only
└── FSC-EXPORT-002: PII masking      ← Financial Export only
└── FSC-EXPORT-003: Audit trail      ← Financial Export only
```

This mirrors how real security frameworks operate: a global policy floor with feature-specific high-water marks layered on top.

---

## What You Will Build

Extending the Lab 2 dashboard with:

- A **`Financial.Auditor` App Role** defined in `main.bicep` and published to the Entra ID App Registration
- A **render gate** in `Dashboard.tsx` — the panel only renders if the signed-in user holds the role
- A **`FinancialExportCard` component** with an invocation gate — role checked again inside the click handler, not just at render time (prevents UI-bypass attacks)
- A **`maskAccountNumber()` utility** — account numbers masked *before* they enter component state; the raw value never touches the DOM
- An **`auditExportAttempt()` service** — fires before any data is returned, with a `console.warn` fallback if App Insights is not configured
- A **`hasRole()` pure function** — default-deny, no MSAL dependency, independently testable
- An **`AppRole` const** — `'Financial.Auditor'` lives in exactly one file; compliance auditable in one grep command

---

## Learning Objectives

### Spec-Kit Governance
- How to evolve the **constitution** to v3.0.0 with the Layered Governance Model
- How **FSCs** are defined in the spec and traced directly to implementation — every control has a citation
- How Spec-Kit tasks enforce a **developer/infra responsibility boundary** — T001 (Bicep app role definition) is developer-owned; T002–T004 (deploy, group creation, role assignment) are infra/admin-owned
- How the **grep-auditable single source of truth** pattern makes security properties visible without reading every function

### Security Engineering
- How **Entra ID App Roles** work — why `roles` claims are preferred over `groups` claims for application RBAC, and how security groups map to roles in Enterprise Applications
- How a **double-gate** (render gate + invocation gate) defends against UI-bypass attacks
- How **PII masking** applied before state assignment prevents accidental DOM exposure, even in edge cases
- How **pre-action audit logging** satisfies trail requirements for both granted and denied attempts

### Architecture
- How to keep `hasRole()` as a pure function — making it portable and independently testable without mocking MSAL
- How to structure telemetry with a `console.warn` fallback so missing configuration never causes a runtime failure
- How the `AppRole` const pattern makes role strings refactorable and auditable in one command

---

## Prerequisites

Completion of Lab 2 (`git checkout lab2-complete` as your starting point), plus:

| Requirement | Notes |
|---|---|
| Lab 2 complete | Dashboard with ProfileCard working |
| `Application.ReadWrite.OwnedBy` | Required to deploy `appRoles` via Bicep |
| Enterprise Applications access | Required to assign the role to users/groups (T003) |

---

## Lab 3 Architecture

```
src/
├── roles.ts                         # NEW — AppRole const (single source of truth)
├── utils/
│   ├── securityUtils.ts             # NEW — hasRole() pure fn, default-deny
│   └── mask.ts                      # NEW — maskAccountNumber() PII masking
├── types/
│   ├── graph.ts                     # unchanged
│   └── financial.ts                 # NEW — FinancialRecord interface
├── services/
│   ├── graphService.ts              # unchanged
│   └── auditService.ts              # NEW — auditExportAttempt() pre-action telemetry
└── components/
    ├── FinancialExportCard.tsx      # NEW — invocation gate + masked display
    └── Dashboard.tsx               # MODIFIED — render gate + FinancialExportCard
```

**Dependency rules**:
- `hasRole()` has no MSAL imports — pure function, no side effects
- `FinancialExportCard` has no MSAL imports — receives `claims` as a prop
- `auditService` reads only from `import.meta.env` — no component dependencies
- The string `'Financial.Auditor'` exists in exactly one file: `src/roles.ts`

---

## Feature-Specific Controls (FSCs)

Defined in `specs/003-financial-export/spec.md`. These layer on top of all inherited GGS standards.

| Control | Rule | Implementation |
|---|---|---|
| FSC-EXPORT-001 | Step-up RBAC — `Financial.Auditor` role required | `hasRole()` double-gate: render gate in `Dashboard` + invocation gate in `FinancialExportCard` handler |
| FSC-EXPORT-002 | PII masking — account numbers masked before state | `maskAccountNumber()` applied before `setRecord()` — raw value never in DOM |
| FSC-EXPORT-003 | Audit trail — every attempt logged before action | `auditExportAttempt(upn, status)` called before data is fetched or returned |

---

## Step-by-Step Instructions

### Step 1: Start from Lab 2

```bash
git checkout master   # or git checkout lab3-complete to see the finished result
```

---

### Step 2: Evolve the Constitution (`/speckit.constitution`)

In Copilot chat, run `/speckit.constitution` to add the Layered Governance Model:

```
Add a Layered Governance Model section.

GGS (Global Governance Standards) — defined in constitution.md — apply to all features.
FSC (Feature-Specific Controls) — defined in individual spec.md files — apply to one feature only.

FSC rules:
- FSCs may only add constraints. They may never relax a GGS standard.
- Each FSC must be numbered (FSC-<FEATURE>-NNN).
- Every spec must declare which GGS standards it inherits.
- Violations of FSC controls are named and citeable, same as GGS violations.
```

This evolves `.specify/memory/constitution.md` to v3.0.0.

---

### Step 3: Write the Feature Spec (`/speckit.specify`)

In Copilot chat, run `/speckit.specify` with:

```
Feature: High-Sensitivity Financial Export

As a Financial Auditor, I need to export a masked summary of financial records.

FSC-EXPORT-001: Access gated by Financial.Auditor App Role (step-up RBAC on top of GGS-001).
FSC-EXPORT-002: All account numbers masked to last 4 digits before rendering.
FSC-EXPORT-003: Every export attempt (granted or denied) logged before action is taken.
```

This creates `specs/003-financial-export/spec.md` with the GGS inheritance table and FSC definitions.

---

### Step 4: Write the Implementation Plan (`/speckit.plan`)

In Copilot chat, run `/speckit.plan`. This creates `specs/003-financial-export/plan.md` with architecture decisions, GGS+FSC compliance mapping, and the developer/infra responsibility boundary.

---

### Step 5: Generate the Task List (`/speckit.tasks`)

In Copilot chat, run `/speckit.tasks`. This creates `specs/003-financial-export/tasks.md` with 36 tasks across 7 phases. Note: Phase 1 is explicitly split into developer tasks (T001) and infra/admin tasks (T002–T004) — a Spec-Kit-enforced responsibility boundary.

---

### Step 6: Update `main.bicep` and Deploy (T001–T004)

**T001 — Developer task:** Add `appRoles` to `main.bicep` (generate a UUID with `uuidgen`):

```bicep
appRoles: [
  {
    id: '<uuidgen output>'
    allowedMemberTypes: ['User']
    displayName: 'Financial Auditor'
    description: 'Can access and export financial data'
    value: 'Financial.Auditor'
    isEnabled: true
  }
]
```

**T002 — Deploy:**
```bash
az deployment group create \
  --resource-group <your-rg> \
  --template-file main.bicep
```

**T003 — Assign role:** Azure Portal → **Enterprise Applications** → your app → **Users and Groups** → **Add user/group** → assign **Financial Auditor**.

> **Enterprise pattern**: assign a **security group** to the role rather than individual users. Group members automatically receive `Financial.Auditor` in their `roles` claim.

**T004 — Verify:** Sign out and back in. The `roles: ["Financial.Auditor"]` claim should appear in the Lab 1 claims table.

---

### Step 7: Implement (`/speckit.implement`)

Work through phases using `/speckit.implement`. Key files:

**`src/roles.ts`** *(FSC-EXPORT-001)*
```typescript
export const AppRole = {
  FinancialAuditor: 'Financial.Auditor',
} as const
```

**`src/utils/securityUtils.ts`** *(FSC-EXPORT-001)*
```typescript
export function hasRole(claims: IdTokenClaims | undefined, role: string): boolean {
  if (!claims?.roles || !Array.isArray(claims.roles)) return false
  return claims.roles.includes(role)
}
```

**`src/utils/mask.ts`** *(FSC-EXPORT-002)*
```typescript
export function maskAccountNumber(value: string): string {
  const match = value.match(/(\d{4})$/)
  if (!match) return '****'
  return `****${match[1]}`
}
```

**Render gate in `Dashboard.tsx`** *(FSC-EXPORT-001)*
```tsx
{hasRole(account?.idTokenClaims, AppRole.FinancialAuditor) ? (
  <FinancialExportCard claims={account!.idTokenClaims!} />
) : (
  <p>Financial export is not available for your account.</p>
)}
```

---

### Step 8: Verify

```bash
npm run build   # must pass clean
npm run dev
```

**T031 — Role-positive:** Sign in as a user with `Financial.Auditor`. Export button appears. Data renders as `****5678`. *(FSC-EXPORT-001, FSC-EXPORT-002)*

**T032 — DOM masking audit** — run in DevTools Console after clicking Export:
```js
document.body.innerHTML.includes('00012345678')  // must return false
```

**T033 — Role-negative:** Sign in as a user without the role. Sees *"Financial export is not available for your account."* — button never rendered. *(FSC-EXPORT-001)*

**T034 — Audit fires before action:** DevTools Console shows `[auditService] VITE_APPINSIGHTS_CONNECTION_STRING is not set` on every export — confirming the audit fires before data is returned. *(FSC-EXPORT-003)*

**T036 — Grep audit:**
```bash
grep -rn "Financial.Auditor" src/ --include="*.ts" --include="*.tsx"
# Expected: 1 match — src/roles.ts only
```

---

## Security Audit Checklist

Before marking Lab 3 complete, verify each item:

- [ ] `'Financial.Auditor'` string exists only in `src/roles.ts` *(FSC-EXPORT-001)*
- [ ] `hasRole()` has no MSAL imports — pure function *(plan Key Decision #1)*
- [ ] Render gate in `Dashboard.tsx` — export panel not rendered for users without the role *(FSC-EXPORT-001)*
- [ ] Invocation gate in `FinancialExportCard` handler — role re-checked before data returned *(FSC-EXPORT-001)*
- [ ] `maskAccountNumber()` called before `setRecord()` — raw value never in component state *(FSC-EXPORT-002)*
- [ ] `auditExportAttempt()` called before export data is generated — not after *(FSC-EXPORT-003)*
- [ ] `console.warn` fallback fires when `VITE_APPINSIGHTS_CONNECTION_STRING` is absent *(GGS-002)*
- [ ] `npm run build` passes with no errors
- [ ] Unmasked account number not found in DOM via DevTools search *(FSC-EXPORT-002)*

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
