import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/orders', icon: '📋', label: 'Orders' },
  { path: '/products', icon: '🍔', label: 'Products' },
  { path: '/categories', icon: '📁', label: 'Categories' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/locations', icon: '📍', label: 'Locations' },
  { path: '/users', icon: '👤', label: 'Users', roles: ['admin'] },
  { path: '/promos', icon: '🎉', label: 'Promotions' },
  { path: '/reports', icon: '📈', label: 'Reports', roles: ['admin', 'supervisor'] },
  { path: '/settings', icon: '⚙️', label: 'Settings', roles: ['admin'] },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const filteredMenu = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role || '')
  })

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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenu.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
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
    </div>
  )
}
