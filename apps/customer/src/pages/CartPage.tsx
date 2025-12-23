import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const { profile } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    if (!profile) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-red-600 text-white p-4">
          <Link to="/" className="text-xl font-bold">← Cart</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">🛒</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious items!</p>
          <Link to="/" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">← Cart</Link>
          <button onClick={clearCart} className="text-sm opacity-80 hover:opacity-100">Clear All</button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Main item row */}
            <div className="p-4 flex gap-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                
                {/* Selected Options */}
                {item.options && item.options.length > 0 && (
                  <div className="mt-1">
                    {item.options.map((opt, i) => (
                      <p key={i} className="text-xs text-gray-500">
                        <span className="text-gray-400">{opt.group_name}:</span> {opt.option_name}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Selected Addons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-1">
                    {item.addons.map((addon, i) => (
                      <p key={i} className="text-xs text-green-600">
                        + {addon.quantity}x {addon.name} (+${(addon.price * addon.quantity).toFixed(2)})
                      </p>
                    ))}
                  </div>
                )}

                <p className="text-red-600 font-bold mt-2">${(item.price || 0).toFixed(2)} each</p>
              </div>
            </div>

            {/* Quantity controls row */}
            <div className="px-4 pb-4 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition text-gray-600 font-medium"
                >
                  −
                </button>
                <span className="font-semibold text-gray-800 w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition text-gray-600 font-medium"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-800">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
            <p className="text-lg font-bold text-gray-800">Subtotal: ${total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 transition"
          >
            {profile ? 'Checkout' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
