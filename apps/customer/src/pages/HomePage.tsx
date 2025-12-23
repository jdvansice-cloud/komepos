import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ProductDetailModal } from '../components/ProductDetailModal'
import { AppLayout } from '../components/AppLayout'
import { PullToRefresh } from '../components/PullToRefresh'
import { MenuSkeleton } from '../components/Skeletons'
import { haptics } from '../lib/haptics'

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
  has_addons?: boolean
  sort_order: number
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem, addSimpleItem, itemCount } = useCart()
  const { profile } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes, addonsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('product_addons').select('product_id'),
      ])
      setCategories(catRes.data || [])
      
      // Mark products that have addons
      const productsWithAddons = new Set((addonsRes.data || []).map(pa => pa.product_id))
      const productsWithFlags = (prodRes.data || []).map(p => ({
        ...p,
        has_addons: productsWithAddons.has(p.id)
      }))
      setProducts(productsWithFlags)
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleRefresh() {
    await fetchData()
  }

  const groupedProducts = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id)
  }))

  function handleProductClick(product: Product) {
    haptics.tap()
    setSelectedProduct(product)
  }

  function handleQuickAdd(e: React.MouseEvent, product: Product) {
    e.stopPropagation()
    haptics.addToCart()
    
    if (product.has_options || product.has_addons) {
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

  return (
    <AppLayout>
      {/* Header */}
      <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">KomePOS</h1>
            {profile && <p className="text-sm opacity-90">Hi, {profile.full_name}!</p>}
          </div>
          <Link to="/cart" className="relative p-2 btn-press">
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
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-6 text-center flex-shrink-0">
        <h2 className="text-2xl font-bold">Order Online</h2>
        <p className="opacity-90">Fresh food delivered to your door</p>
      </div>

      {/* Category Quick Nav */}
      {categories.length > 3 && (
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm flex-shrink-0">
          <div className="flex overflow-x-auto scrollbar-hide gap-2 p-3">
            {categories.map(cat => (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 active:bg-red-100 active:text-red-700 transition btn-press"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {loading ? (
          <MenuSkeleton />
        ) : (
          <div className="p-4">
            {groupedProducts.map(category => (
              <div key={category.id} id={`category-${category.id}`} className="mb-8 scroll-mt-16">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {category.products.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => handleProductClick(product)}
                      className="bg-white rounded-lg shadow overflow-hidden flex cursor-pointer active:scale-[0.98] transition-transform gpu-accelerated"
                    >
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-24 h-24 object-cover flex-shrink-0" 
                          loading="lazy"
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
                            {(product.has_options || product.has_addons) && (
                              <span className="text-xs text-gray-400 ml-1">+options</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleQuickAdd(e, product)}
                            className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-medium active:bg-red-700 transition btn-press flex items-center gap-1"
                          >
                            {(product.has_options || product.has_addons) ? (
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
        )}
      </PullToRefresh>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(item) => {
            haptics.addToCart()
            addItem(item)
          }}
        />
      )}
    </AppLayout>
  )
}
