import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export function AccountPage() {
  const { profile, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-red-600 text-white p-4">
          <Link to="/" className="text-xl font-bold">← Account</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">👤</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to your account</h2>
          <p className="text-gray-500 mb-6">Manage your profile and orders</p>
          <div className="space-y-3 w-full max-w-xs">
            <Link to="/login" className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition text-center">
              Sign In
            </Link>
            <Link to="/register" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <Link to="/" className="text-xl font-bold">← Account</Link>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            {profile.full_name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{profile.full_name}</h2>
          <p className="text-gray-500">{profile.email}</p>
          <p className="text-gray-500">{profile.phone}</p>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Link to="/orders" className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium text-gray-800">Order History</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/cart" className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
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
          className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Menu</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">📋</span>
          <span className="text-xs">Orders</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center text-gray-500 hover:text-red-600 relative">
          <span className="text-xl">🛒</span>
          <span className="text-xs">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 right-2 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
          )}
        </Link>
        <Link to="/account" className="flex flex-col items-center text-red-600">
          <span className="text-xl">👤</span>
          <span className="text-xs">Account</span>
        </Link>
      </nav>
    </div>
  )
}
