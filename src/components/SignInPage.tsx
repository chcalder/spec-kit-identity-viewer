import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../authConfig'

export default function SignInPage() {
  const { instance } = useMsal()

  const handleSignIn = () => {
    instance.loginRedirect(loginRequest)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-white">Identity Claims Viewer</h1>
      <p className="text-gray-400 text-sm">Sign in to view your Entra ID token claims</p>
      <button
        onClick={handleSignIn}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
      >
        Sign in with Microsoft
      </button>
    </div>
  )
}
