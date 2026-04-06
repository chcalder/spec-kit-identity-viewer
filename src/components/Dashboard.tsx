import { useMsal, useAccount } from '@azure/msal-react'
import ClaimsTable from './ClaimsTable'

export default function Dashboard() {
  const { instance, accounts } = useMsal()
  const account = useAccount(accounts[0] ?? {})

  const displayName = account?.name ?? account?.username ?? 'User'
  const claims = (account?.idTokenClaims ?? {}) as Record<string, unknown>

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
          ID Token Claims
        </h3>
        <ClaimsTable claims={claims} />
      </main>
    </div>
  )
}
