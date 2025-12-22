import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCompanyTimezone, formatDateTime } from '../lib/timezone'

interface Order {
  id: string
  order_number: string
  status: string
  order_type: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  delivery_fee: number
  total: number
  payment_method: string
  payment_status: string
  customer_notes: string
  internal_notes: string
  created_at: string
  customer?: { full_name: string; phone: string; email: string }
  location?: { name: string }
  user?: { full_name: string }
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  item_notes: string
  is_taxable: boolean
  options_json: any
  addons_json: any
}

interface OrderDetail extends Order {
  items: OrderItem[]
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timezone, setTimezone] = useState('America/Panama')
  
  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    async function init() {
      const tz = await getCompanyTimezone()
      setTimezone(tz)
    }
    init()
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(full_name, phone, email), location:locations(name), user:users(full_name)')
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

  async function fetchOrderDetails(orderId: string) {
    setLoadingDetail(true)
    try {
      // Fetch order with all details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, customer:customers(full_name, phone, email), location:locations(name), user:users(full_name)')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at')

      if (itemsError) throw itemsError

      setSelectedOrder({ ...order, items: items || [] })
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('Error loading order details')
    } finally {
      setLoadingDetail(false)
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
      // Update selected order if it's open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-indigo-100 text-indigo-700',
    ready: 'bg-green-100 text-green-700',
    out_for_delivery: 'bg-purple-100 text-purple-700',
    delivered: 'bg-gray-100 text-gray-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const orderTypeLabels: Record<string, string> = {
    dine_in: '🍽️ Dine In',
    takeout: '🥡 Takeout',
    delivery: '🚚 Delivery',
    phone: '📞 Phone',
    whatsapp: '💬 WhatsApp',
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'].map(status => (
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
                      {order.status?.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      {orderTypeLabels[order.order_type] || order.order_type}
                    </span>
                  </div>
                  {order.customer && (
                    <p className="text-gray-600 mt-1">{order.customer.full_name} • {order.customer.phone}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">{formatDateTime(order.created_at, timezone)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">${order.total?.toFixed(2)}</p>
                  <button
                    onClick={() => fetchOrderDetails(order.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                  >
                    View Details →
                  </button>
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
                {order.status === 'ready' && order.order_type === 'delivery' && (
                  <button onClick={() => updateStatus(order.id, 'out_for_delivery')} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Out for Delivery</button>
                )}
                {order.status === 'ready' && order.order_type !== 'delivery' && (
                  <button onClick={() => updateStatus(order.id, 'completed')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Complete</button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Mark Delivered</button>
                )}
                {/* Refund button for completed orders that haven't been refunded */}
                {(order.status === 'completed' || order.status === 'delivered') && order.payment_status !== 'refunded' && (
                  <button
                    onClick={() => navigate(`/pos?refund=${order.id}`)}
                    className="text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
                  >
                    ↩️ Refund
                  </button>
                )}
                {order.payment_status === 'refunded' && (
                  <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                    Refunded
                  </span>
                )}
                <button
                  onClick={() => fetchOrderDetails(order.id)}
                  className="ml-auto text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  📋 Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {(selectedOrder || loadingDetail) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading order details...</p>
              </div>
            ) : selectedOrder && (
              <>
                {/* Header */}
                <div className="p-6 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Order #{selectedOrder.order_number}</h2>
                      <p className="text-gray-500">{formatDateTime(selectedOrder.created_at, timezone)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[selectedOrder.status] || 'bg-gray-100'}`}>
                      {selectedOrder.status?.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700">
                      {orderTypeLabels[selectedOrder.order_type] || selectedOrder.order_type}
                    </span>
                    {selectedOrder.payment_method && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 capitalize">
                        💳 {selectedOrder.payment_method}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer & Location Info */}
                <div className="p-6 border-b">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                      {selectedOrder.customer ? (
                        <div>
                          <p className="font-medium text-gray-800">{selectedOrder.customer.full_name}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                          {selectedOrder.customer.email && (
                            <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Walk-in customer</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                      <p className="font-medium text-gray-800">{selectedOrder.location?.name || 'N/A'}</p>
                      {selectedOrder.user && (
                        <p className="text-sm text-gray-600">Cashier: {selectedOrder.user.full_name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 border-b">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Order Items</p>
                  <div className="space-y-3">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{item.quantity}x</span>
                            <span className="text-gray-800">{item.product_name}</span>
                            {item.is_taxable && (
                              <span className="text-xs text-gray-400">(taxable)</span>
                            )}
                          </div>
                          {item.item_notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">"{item.item_notes}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">${item.line_total?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">${item.unit_price?.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {(selectedOrder.customer_notes || selectedOrder.internal_notes) && (
                  <div className="p-6 border-b">
                    {selectedOrder.customer_notes && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Notes</p>
                        <p className="text-gray-700 bg-yellow-50 rounded-lg p-3">{selectedOrder.customer_notes}</p>
                      </div>
                    )}
                    {selectedOrder.internal_notes && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Internal Notes</p>
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedOrder.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800">${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Discount</span>
                        <span>-${selectedOrder.discount_amount?.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span className="text-gray-800">${selectedOrder.delivery_fee?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax (ITBMS)</span>
                      <span className="text-gray-800">${selectedOrder.tax_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">${selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 flex gap-3">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, 'preparing')} 
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Start Preparing
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')} 
                        className="text-red-600 border border-red-600 px-4 py-3 rounded-lg hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'ready')} 
                      className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && selectedOrder.order_type === 'delivery' && (
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'out_for_delivery')} 
                      className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && selectedOrder.order_type !== 'delivery' && (
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'completed')} 
                      className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Complete Order
                    </button>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'delivered')} 
                      className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Mark Delivered
                    </button>
                  )}
                  {/* Refund button for completed orders that haven't been refunded */}
                  {(selectedOrder.status === 'completed' || selectedOrder.status === 'delivered') && selectedOrder.payment_status !== 'refunded' && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(null)
                        navigate(`/pos?refund=${selectedOrder.id}`)
                      }} 
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium"
                    >
                      ↩️ Process Refund
                    </button>
                  )}
                  {selectedOrder.payment_status === 'refunded' && (
                    <div className="flex-1 bg-red-100 text-red-700 px-4 py-3 rounded-lg font-medium text-center">
                      ✓ Refunded
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
