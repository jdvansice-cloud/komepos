import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [orderType, setOrderType] = useState<'delivery' | 'takeout'>('delivery')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [taxRate, setTaxRate] = useState(0.07)

  useEffect(() => {
    fetchTaxRate()
  }, [])

  async function fetchTaxRate() {
    const { data } = await supabase.from('companies').select('itbms_rate').single()
    if (data) setTaxRate(data.itbms_rate)
  }

  const subtotal = total
  const tax = subtotal * taxRate
  const deliveryFee = orderType === 'delivery' ? 3.00 : 0
  const grandTotal = subtotal + tax + deliveryFee

  async function handlePlaceOrder() {
    if (!profile) return
    if (orderType === 'delivery' && !address) {
      alert('Please enter your delivery address')
      return
    }

    setLoading(true)
    try {
      const { data: location } = await supabase.from('locations').select('id').limit(1).single()
      
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
      
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        location_id: location?.id,
        customer_id: profile.id,
        status: 'pending',
        order_type: orderType,
        subtotal: subtotal,
        tax_amount: tax,
        delivery_fee: deliveryFee,
        discount_amount: 0,
        total: grandTotal,
        customer_notes: notes || null,
        delivery_notes: orderType === 'delivery' ? address : null,
        payment_status: 'pending',
      }).select().single()

      if (orderError) throw orderError

      // Insert order items with options and addons
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.price * item.quantity,
        is_taxable: true,
        options_json: item.options && item.options.length > 0 ? item.options : null,
        addons_json: item.addons && item.addons.length > 0 ? item.addons : null,
        item_notes: item.specialInstructions || null,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      clearCart()
      navigate('/order-success', { state: { orderNumber } })
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <Link to="/cart" className="text-xl font-bold">← Checkout</Link>
      </header>

      <div className="p-4 space-y-6">
        {/* Order Type */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Order Type</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                orderType === 'delivery' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              🚗 Delivery
            </button>
            <button
              onClick={() => setOrderType('takeout')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                orderType === 'takeout' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              🏪 Pickup
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Delivery Address</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Special Instructions</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests? (optional)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={2}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="pb-3 border-b last:border-b-0 last:pb-0">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">{item.quantity}x {item.name}</span>
                  <span className="font-medium text-gray-800">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
                {/* Options */}
                {item.options && item.options.length > 0 && (
                  <div className="mt-1 pl-4">
                    {item.options.map((opt, i) => (
                      <p key={i} className="text-xs text-gray-500">{opt.group_name}: {opt.option_name}</p>
                    ))}
                  </div>
                )}
                {/* Addons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-1 pl-4">
                    {item.addons.map((addon, i) => (
                      <p key={i} className="text-xs text-green-600">+ {addon.quantity}x {addon.name}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ITBMS ({(taxRate * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <span>Place Order</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">${grandTotal.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
