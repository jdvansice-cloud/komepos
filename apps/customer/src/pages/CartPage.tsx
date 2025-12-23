import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { SwipeableRow } from '../components/SwipeableRow'
import { haptics } from '../lib/haptics'

export function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const { profile } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    haptics.tap()
    if (!profile) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  function handleRemoveItem(id: string) {
    haptics.delete()
    removeItem(id)
  }

  function handleUpdateQuantity(id: string, qty: number) {
    haptics.tap()
    updateQuantity(id, qty)
  }

  if (items.length === 0) {
    return (
      <AppLayout>
        <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
          <Link to="/" className="text-xl font-bold btn-press">← Cart</Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">🛒</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious items!</p>
          <Link to="/" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold active:bg-red-700 transition btn-press">
            Browse Menu
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold btn-press">← Cart</Link>
          <button 
            onClick={() => { haptics.delete(); clearCart() }} 
            className="text-sm opacity-80 active:opacity-100 btn-press"
          >
            Clear All
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-momentum">
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400 mb-2">← Swipe left to remove</p>
          {items.map(item => (
            <SwipeableRow 
              key={item.id} 
              onDelete={() => handleRemoveItem(item.id)}
              className="rounded-lg shadow"
            >
              <div className="bg-white rounded-lg overflow-hidden">
                {/* Main item row */}
                <div className="p-3 flex gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                    
                    {/* Selected Options */}
                    {item.options && item.options.length > 0 && (
                      <div className="mt-0.5">
                        {item.options.map((opt, i) => (
                          <p key={i} className="text-xs text-gray-500">
                            {opt.group_name}: {opt.option_name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Selected Addons */}
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-0.5">
                        {item.addons.map((addon, i) => (
                          <p key={i} className="text-xs text-green-600">
                            + {addon.quantity}x {addon.name}
                          </p>
                        ))}
                      </div>
                    )}

                    <p className="text-red-600 font-bold text-sm mt-1">${(item.price || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Quantity controls row */}
                <div className="px-3 pb-3 flex items-center justify-between border-t pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition text-gray-600 font-medium btn-press"
                    >
                      −
                    </button>
                    <span className="font-semibold text-gray-800 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition text-gray-600 font-medium btn-press"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-gray-800">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </SwipeableRow>
          ))}
        </div>
        
        {/* Spacer for footer */}
        <div className="h-28"></div>
      </div>

      {/* Checkout Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg bottom-nav">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
            <p className="text-lg font-bold text-gray-800">${total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-base active:bg-red-700 transition btn-press"
          >
            {profile ? 'Checkout' : 'Sign in'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
