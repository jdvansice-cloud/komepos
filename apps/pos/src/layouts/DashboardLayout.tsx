import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/pos', icon: '💳', label: 'POS', highlight: true },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/orders', icon: '📋', label: 'Orders' },
  { path: '/products', icon: '🍔', label: 'Products' },
  { path: '/categories', icon: '📁', label: 'Categories' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/promos', icon: '🎉', label: 'Promotions' },
  { path: '/reports', icon: '📈', label: 'Reports', roles: ['admin', 'supervisor'] },
  { path: '/settings', icon: '⚙️', label: 'Settings', roles: ['admin'] },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const { profile, locations, activeLocation, setActiveLocation, signOut } = useAuth()
  const location = useLocation()

  const filteredMenu = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role || '')
  })

  const canSwitchLocation = locations.length > 1 && profile?.role !== 'admin'
  const locationDisplay = profile?.role === 'admin' 
    ? 'All Locations' 
    : activeLocation?.name || 'No Location'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">KomePOS</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 transition"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Active Location */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-400 uppercase mb-1">Location</p>
            {canSwitchLocation ? (
              <button
                onClick={() => setShowLocationPicker(true)}
                className="w-full text-left text-sm bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 flex items-center justify-between transition"
              >
                <span className="truncate">{locationDisplay}</span>
                <span>🔄</span>
              </button>
            ) : (
              <p className="text-sm text-gray-300 truncate">{locationDisplay}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenu.map(item => {
            const isActive = location.pathname === item.path
            const isHighlight = 'highlight' in item && item.highlight
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isHighlight
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="truncate">
                <p className="font-medium truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
              </div>
            )}
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Switch Location</h2>
            <div className="space-y-2">
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setActiveLocation(loc); setShowLocationPicker(false) }}
                  className={`w-full p-3 border rounded-lg text-left flex items-center gap-3 transition ${
                    activeLocation?.id === loc.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>🏪</span>
                  <span className="font-medium">{loc.name}</span>
                  {activeLocation?.id === loc.id && <span className="ml-auto text-blue-600">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLocationPicker(false)}
              className="mt-4 w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
