import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ProductDetailModal } from '../components/ProductDetailModal'

interface Category { id: string; name: string; image_url: string; sort_order: number }
interface Product { 
  id: string
  name: string
  description: string
  base_price: number
  image_url: string
  category_id: string
  is_active: boolean
  has_options: boolean
  sort_order: number
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem, addSimpleItem, itemCount } = useCart()
  const { profile } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
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

  function handleProductClick(product: Product) {
    // Always open modal - it handles both simple and complex products
    setSelectedProduct(product)
  }

  function handleQuickAdd(e: React.MouseEvent, product: Product) {
    e.stopPropagation()
    if (product.has_options) {
      setSelectedProduct(product)
    } else {
      addSimpleItem({ 
        id: product.id, 
        name: product.name, 
        price: product.base_price, 
        image_url: product.image_url 
      })
    }
  }

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

      {/* Category Quick Nav */}
      {categories.length > 3 && (
        <div className="sticky top-[72px] z-10 bg-white border-b shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide gap-2 p-3">
            {categories.map(cat => (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-red-100 hover:text-red-700 transition"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="p-4">
        {groupedProducts.map(category => (
          <div key={category.id} id={`category-${category.id}`} className="mb-8 scroll-mt-32">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {category.products.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow overflow-hidden flex cursor-pointer hover:shadow-md transition group"
                >
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-24 h-24 object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <span className="font-bold text-red-600">${(product.base_price || 0).toFixed(2)}</span>
                        {product.has_options && (
                          <span className="text-xs text-gray-400 ml-1">+options</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-red-700 transition flex items-center gap-1"
                      >
                        {product.has_options ? (
                          <>
                            <span>Select</span>
                            <span className="text-xs">▼</span>
                          </>
                        ) : (
                          '+ Add'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🍽️</span>
            <p className="text-gray-500">No menu items available</p>
          </div>
        )}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addItem}
        />
      )}
    </div>
  )
}
