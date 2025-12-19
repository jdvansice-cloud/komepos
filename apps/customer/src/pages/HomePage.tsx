import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

interface Category { id: string; name: string; image_url: string }
interface Product { id: string; name: string; description: string; price: number; image_url: string; category_id: string; is_active: boolean }

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, itemCount } = useCart()
  const { profile } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
      ])
      setCategories(catRes.data || [])
      setProducts(prodRes.data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  const groupedProducts = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id)
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-red-600 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">KomePOS</h1>
            {profile && <p className="text-sm opacity-90">Hi, {profile.full_name}!</p>}
          </div>
          <Link to="/cart" className="relative p-2">
            <span className="text-2xl">🛒</span>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-6 text-center">
        <h2 className="text-2xl font-bold">Order Online</h2>
        <p className="opacity-90">Fresh food delivered to your door</p>
      </div>

      {/* Menu */}
      <div className="p-4">
        {groupedProducts.map(category => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {category.products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden flex">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-24 h-24 object-cover" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-2xl">🍽️</div>
                  )}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-red-600">${product.price.toFixed(2)}</span>
                      <button
                        onClick={() => addItem(product)}
                        className="bg-red-600 text-white px-4 py-1 rounded-full text-sm hover:bg-red-700 transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        <Link to="/" className="flex flex-col items-center text-red-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Menu</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">📋</span>
          <span className="text-xs">Orders</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center text-gray-500 hover:text-red-600 relative">
          <span className="text-xl">🛒</span>
          <span className="text-xs">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 right-2 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
          )}
        </Link>
        <Link to="/account" className="flex flex-col items-center text-gray-500 hover:text-red-600">
          <span className="text-xl">👤</span>
          <span className="text-xs">Account</span>
        </Link>
      </nav>
    </div>
  )
}
