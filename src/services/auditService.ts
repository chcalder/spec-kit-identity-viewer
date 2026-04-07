import { ApplicationInsights } from '@microsoft/applicationinsights-web'

// auditExportAttempt — fires BEFORE the action is taken (FSC-EXPORT-003)
// Falls back to console.warn if VITE_APPINSIGHTS_CONNECTION_STRING is absent (GGS-002)
export async function auditExportAttempt(
  upn: string,
  status: 'granted' | 'denied',
): Promise<void> {
  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING as string | undefined

  if (!connectionString) {
    console.warn('[auditService] VITE_APPINSIGHTS_CONNECTION_STRING is not set — skipping telemetry', {
      upn,
      status,
      featureId: 'financial-export',
      timestamp: new Date().toISOString(),
    })
    return
  }

  try {
    const appInsights = new ApplicationInsights({
      config: { connectionString },
    })
    appInsights.loadAppInsights()
    appInsights.trackEvent({
      name: 'FinancialExportAttempt',
      properties: {
        userPrincipalName: upn,
        status,
        featureId: 'financial-export',
        timestamp: new Date().toISOString(),
      },
    })
    appInsights.flush()
  } catch (error) {
    console.warn('[auditService] Audit telemetry failed:', error)
  }
}
