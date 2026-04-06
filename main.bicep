extension microsoftGraphV1

param appDisplayName string = 'spec-kit-identity-viewer'

resource app 'Microsoft.Graph/applications@v1.0' = {
  displayName: appDisplayName
  uniqueName: appDisplayName

  // SPA platform — enables Authorization Code Flow with PKCE
  spa: {
    redirectUris: [
      'http://localhost:3000'
      'http://localhost:3001' // fallback when port 3000 is in use (Vite auto-increments)
    ]
  }

  // Explicitly disable implicit flow
  web: {
    implicitGrantSettings: {
      enableAccessTokenIssuance: false
      enableIdTokenIssuance: false
    }
  }

  // Delegated permissions against Microsoft Graph
  requiredResourceAccess: [
    {
      resourceAppId: '00000003-0000-0000-c000-000000000000' // Microsoft Graph
      resourceAccess: [
        {
          id: 'e1fe6dd8-ba31-4d61-89e7-88639da4683d' // User.Read
          type: 'Scope'
        }
        {
          id: '37f7f235-527c-4136-accd-4a02d197296e' // openid
          type: 'Scope'
        }
        {
          id: '14dad69e-099b-42c9-810b-d002981feec1' // profile
          type: 'Scope'
        }
        {
          id: '64a6cdd6-aab1-4aff-b8bf-fe6a18a40799' // email
          type: 'Scope'
        }
      ]
    }
  ]
}

output clientId string = app.appId
output tenantId string = tenant().tenantId
