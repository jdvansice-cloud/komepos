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
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">← Cart</Link>
          <button onClick={clearCart} className="text-sm opacity-80 hover:opacity-100">Clear All</button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">🍽️</div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <p className="text-red-600 font-bold">${(item.price || 0).toFixed(2)}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-auto text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleCheckout}
          className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
        >
          {profile ? 'Proceed to Checkout' : 'Sign in to Checkout'}
        </button>
      </div>
    </div>
  )
}
