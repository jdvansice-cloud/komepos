import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { haptics } from '../lib/haptics'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    haptics.tap()

    const { error } = await signIn(email, password)
    
    if (error) {
      haptics.error()
      setError(error.message)
      setLoading(false)
    } else {
      haptics.success()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area-inset">
      <header className="bg-red-600 text-white p-4 header-safe">
        <Link to="/" className="text-xl font-bold btn-press">← KomePOS</Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoComplete="email"
                autoCapitalize="off"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold active:bg-red-700 transition disabled:opacity-50 btn-press"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-semibold">
              Sign Up
            </Link>
          </p>

          <p className="mt-4 text-center">
            <Link to="/" className="text-gray-500 text-sm">
              Continue as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
