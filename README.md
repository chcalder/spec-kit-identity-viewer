# Lab 1: React SPA Identity Claims Viewer

## Overview

This lab guides you through building a **React Single-Page Application** that authenticates users via **Microsoft Entra ID** and displays all decoded JWT claims from the ID token. The app is built from scratch — from infrastructure provisioning through to a working sign-in flow — using a structured, AI-assisted development workflow powered by **SpecKit**.

The lab demonstrates how SpecKit transforms the way you work with AI coding assistants, turning free-form prompts into a governed, traceable development process.

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

### SpecKit Workflow
- How to use the **SpecKit slash commands** (`/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) as a structured AI development workflow
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
| SpecKit | 0.5.1+ | Installed in your project |

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
│       └── constitution.md     # SpecKit project constitution
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

> ⚠️ **Important**: Always complete SpecKit setup **before** scaffolding any tooling. Never run `npm create vite` with `--overwrite` into an existing project directory — it will delete `.specify/` and `specs/`.

---

### Step 1: Create the Project Folder

Create a **new empty folder** for this lab:

```bash
mkdir spec-kit-identity-viewer
cd spec-kit-identity-viewer
```

Initialise SpecKit inside it:

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
| `.specify/` folder missing after scaffold | Used `--overwrite` when running `npm create vite` | Never use `--overwrite` in an existing SpecKit project — scaffold into an empty folder first |

---

## SpecKit Commands Reference

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
| Lab 2 | `lab2-complete` *(pending)* | Microsoft Graph `/me` profile integration |
| Lab 3 | — | Role-based UI from Entra ID app roles |
| Lab 4 | — | Deploy to Azure Static Web Apps |

Each lab also introduces a deeper layer of SpecKit governance — from basic authentication principles (Lab 1) to a full project-wide security policy via Global Governance Standards (Lab 2 onwards).

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
