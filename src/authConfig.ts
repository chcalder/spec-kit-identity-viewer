import { type Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: '<YOUR_CLIENT_ID>',         // Replace with clientId from Bicep deployment output
    authority: 'https://login.microsoftonline.com/<YOUR_TENANT_ID>', // Replace with tenantId from Bicep deployment output
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
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
