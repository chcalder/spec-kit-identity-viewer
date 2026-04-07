import { useState, useEffect, useRef } from 'react'
import { useMsal, useAccount } from '@azure/msal-react'
import { type GraphProfile } from '../types/graph'
import { fetchGraphProfile } from '../services/graphService'
import { AppRole } from '../roles'
import { hasRole } from '../utils/securityUtils'
import ClaimsTable from './ClaimsTable'
import ProfileCard from './ProfileCard'
import FinancialExportCard from './FinancialExportCard'

export default function Dashboard() {
  const { instance, accounts } = useMsal()
  const account = useAccount(accounts[0] ?? {})

  const displayName = account?.name ?? account?.username ?? 'User'
  const claims = (account?.idTokenClaims ?? {}) as Record<string, unknown>

  const [profile, setProfile] = useState<GraphProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadProfile = async () => {
    if (!account) return
    abortControllerRef.current = new AbortController()
    setIsLoadingProfile(true)
    setProfileError(null)
    try {
      const data = await fetchGraphProfile(instance, account, abortControllerRef.current.signal)
      setProfile(data)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      setProfileError('Unable to load your corporate profile. Please try again.')
    } finally {
      setIsLoadingProfile(false)
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    loadProfile()
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [account?.localAccountId])

  const handleRetry = () => {
    setIsRetrying(true)
    loadProfile()
  }

  const handleLogout = () => {
    instance.logoutRedirect()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white">Identity Claims Viewer</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="px-8 py-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Welcome, {displayName}</h2>

        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Corporate Profile
        </h3>
        <div className="mb-8">
          {isLoadingProfile ? (
            <p className="text-sm text-gray-400 italic">Fetching Profile...</p>
          ) : profileError ? (
            <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-red-300">{profileError}</p>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="ml-4 px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          ) : profile ? (
            <ProfileCard profile={profile} />
          ) : null}
        </div>

        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Financial Export
        </h3>
        <div className="mb-8">
          {hasRole(account?.idTokenClaims, AppRole.FinancialAuditor) ? (
            <FinancialExportCard claims={account!.idTokenClaims!} />
          ) : (
            <p className="text-sm text-gray-400 italic">
              Financial export is not available for your account.
            </p>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          ID Token Claims
        </h3>
        <ClaimsTable claims={claims} />
      </main>
    </div>
  )
}
