import { useEffect, useState } from 'react'
import { supabase } from '@komepos/supabase/client'

interface Order {
  id: string
  order_number: string
  status: string
  order_type: string
  subtotal: number
  tax_amount: number
  total: number
  created_at: string
  customer?: { full_name: string; phone: string }
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              statusFilter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No orders yet</p>
          <p className="text-gray-400">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">#{order.order_number}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                      {order.order_type?.replace('_', ' ')}
                    </span>
                  </div>
                  {order.customer && (
                    <p className="text-gray-600 mt-1">{order.customer.full_name} • {order.customer.phone}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">${order.total?.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Start Preparing</button>
                    <button onClick={() => updateStatus(order.id, 'cancelled')} className="text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50">Cancel</button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateStatus(order.id, 'ready')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Mark Ready</button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Mark Delivered</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
