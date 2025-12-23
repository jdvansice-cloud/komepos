import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { AppLayout } from '../components/AppLayout'
import { haptics } from '../lib/haptics'

export function AccountPage() {
  const { profile, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  async function handleSignOut() {
    haptics.tap()
    await signOut()
    navigate('/')
  }

  if (!profile) {
    return (
      <AppLayout>
        <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
          <Link to="/" className="text-xl font-bold btn-press">← Account</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">👤</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to your account</h2>
          <p className="text-gray-500 mb-6">Manage your profile and orders</p>
          <div className="space-y-3 w-full max-w-xs">
            <Link to="/login" className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold active:bg-red-700 transition text-center btn-press">
              Sign In
            </Link>
            <Link to="/register" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold active:bg-gray-200 transition text-center btn-press">
              Create Account
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
        <Link to="/" className="text-xl font-bold btn-press">← Account</Link>
      </header>

      <div className="flex-1 overflow-y-auto scroll-momentum p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            {profile.full_name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{profile.full_name}</h2>
          <p className="text-gray-500">{profile.email}</p>
          {profile.phone && <p className="text-gray-500">{profile.phone}</p>}
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Link to="/orders" className="flex items-center justify-between p-4 border-b active:bg-gray-50 btn-press">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium text-gray-800">Order History</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/cart" className="flex items-center justify-between p-4 border-b active:bg-gray-50 btn-press">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛒</span>
              <span className="font-medium text-gray-800">My Cart</span>
            </div>
            <span className="text-gray-400">{itemCount > 0 ? `${itemCount} items` : '→'}</span>
          </Link>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold active:bg-gray-200 transition btn-press"
        >
          Sign Out
        </button>
      </div>
    </AppLayout>
  )
}
