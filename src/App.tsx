import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import SignInPage from './components/SignInPage'
import Dashboard from './components/Dashboard'

export default function App() {
  const { inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Signing in...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPage />
  }

  return <Dashboard />
}
