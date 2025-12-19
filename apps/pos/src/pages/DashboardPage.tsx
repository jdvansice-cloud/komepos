import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@komepos/supabase/client'
import { useAuth } from '../context/AuthContext'

interface DashboardStats {
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  todayRevenue: number
  totalProducts: number
  totalCustomers: number
}

export function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      setStats({
        todayOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        totalProducts: productCount || 0,
        totalCustomers: customerCount || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: '📋' },
    { label: 'Pending', value: stats.pendingOrders, icon: '⏳' },
    { label: 'Completed', value: stats.completedOrders, icon: '✅' },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: '💰' },
    { label: 'Total Products', value: stats.totalProducts, icon: '🍔' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: '👥' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.full_name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex items-center gap-4"
        >
          <div className="bg-blue-100 p-3 rounded-lg text-2xl">📋</div>
          <div>
            <h3 className="font-semibold text-gray-800">View Orders</h3>
            <p className="text-sm text-gray-500">Manage incoming orders</p>
          </div>
        </Link>
        <Link
          to="/products"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex items-center gap-4"
        >
          <div className="bg-green-100 p-3 rounded-lg text-2xl">🍔</div>
          <div>
            <h3 className="font-semibold text-gray-800">Manage Products</h3>
            <p className="text-sm text-gray-500">Add or edit menu items</p>
          </div>
        </Link>
        <Link
          to="/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex items-center gap-4"
        >
          <div className="bg-purple-100 p-3 rounded-lg text-2xl">📈</div>
          <div>
            <h3 className="font-semibold text-gray-800">View Reports</h3>
            <p className="text-sm text-gray-500">Sales and performance</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
