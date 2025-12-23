import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCompanyTimezone, formatDateShort } from '../lib/timezone'
import { AppLayout } from '../components/AppLayout'
import { PullToRefresh } from '../components/PullToRefresh'
import { OrdersSkeleton } from '../components/Skeletons'

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
  const [timezone, setTimezone] = useState('America/Panama')

  const fetchOrders = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }
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
  }, [profile])

  useEffect(() => {
    async function init() {
      const tz = await getCompanyTimezone()
      setTimezone(tz)
    }
    init()
    fetchOrders()
  }, [fetchOrders])

  async function handleRefresh() {
    await fetchOrders()
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    out_for_delivery: 'bg-purple-100 text-purple-700',
    delivered: 'bg-gray-100 text-gray-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'On the way',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  if (!profile) {
    return (
      <AppLayout>
        <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
          <Link to="/" className="text-xl font-bold btn-press">← Orders</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">📋</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to view orders</h2>
          <p className="text-gray-500 mb-6">Track your order history</p>
          <Link to="/login" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold active:bg-red-700 transition btn-press">
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
        <Link to="/" className="text-xl font-bold btn-press">← My Orders</Link>
      </header>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 mt-20">
            <span className="text-6xl mb-4">📋</span>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Your order history will appear here</p>
            <Link to="/" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold active:bg-red-700 transition btn-press">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {orders.map(order => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg shadow p-4 active:scale-[0.99] transition-transform gpu-accelerated"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{formatDateShort(order.created_at, timezone)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-500 capitalize">{order.order_type?.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-800">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PullToRefresh>
    </AppLayout>
  )
}
