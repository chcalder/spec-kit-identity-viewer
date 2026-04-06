import { type IPublicClientApplication, type AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';
import { type GraphProfile } from '../types/graph';

const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

export async function fetchGraphProfile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal,
): Promise<GraphProfile> {
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
      // acquireTokenRedirect navigates away — execution does not continue here
      throw error;
    }
    throw error;
  }

  const response = await fetch(GRAPH_ME_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobTitle: data.jobTitle ?? null,
    officeLocation: data.officeLocation ?? null,
    preferredLanguage: data.preferredLanguage ?? null,
  };
}
