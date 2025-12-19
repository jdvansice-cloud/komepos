import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Order {
  id: string
  order_number: string
  status: string
  order_type: string
  total: number
  created_at: string
}

export function OrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchOrders()
    else setLoading(false)
  }, [profile])

  async function fetchOrders() {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-red-600 text-white p-4">
          <Link to="/" className="text-xl font-bold">← Orders</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">📋</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to view orders</h2>
          <p className="text-gray-500 mb-6">Track your order history</p>
          <Link to="/login" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <Link to="/" className="text-xl font-bold">← My Orders</Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 mt-20">
          <span className="text-6xl mb-4">📋</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Your order history will appear here</p>
          <Link to="/" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-800">{order.order_number}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || 'bg-gray-100'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-500 capitalize">{order.order_type}</span>
                <span className="font-bold text-gray-800">${order.total?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Menu</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center text-red-600">
          <span className="text-xl">📋</span>
          <span className="text-xs">Orders</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">🛒</span>
          <span className="text-xs">Cart</span>
        </Link>
        <Link to="/account" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">👤</span>
          <span className="text-xs">Account</span>
        </Link>
      </nav>
    </div>
  )
}
