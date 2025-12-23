import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { ProductDetailModal } from '../components/ProductDetailModal'
import { AppLayout } from '../components/AppLayout'
import { PullToRefresh } from '../components/PullToRefresh'
import { MenuSkeleton } from '../components/Skeletons'
import { haptics } from '../lib/haptics'

interface Company {
  id: string
  name: string
  logo_url: string | null
  phone: string | null
}

interface Category { id: string; name: string; image_url: string | null; sort_order: number }
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
  const [company, setCompany] = useState<Company | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem, addSimpleItem, itemCount } = useCart()

  const fetchData = useCallback(async () => {
    try {
      const [companyRes, catRes, prodRes, addonsRes] = await Promise.all([
        supabase.from('companies').select('id, name, logo_url, phone').limit(1).single(),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('product_addons').select('product_id'),
      ])
      
      setCompany(companyRes.data)
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
      {/* Header with Company Logo */}
      <header className="bg-red-600 text-white p-4 flex-shrink-0 header-safe">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="w-10 h-10 rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                🍽️
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">{company?.name || 'KomePOS'}</h1>
              {company?.phone && (
                <a href={`tel:${company.phone}`} className="text-xs opacity-90 hover:opacity-100">
                  📞 {company.phone}
                </a>
              )}
            </div>
          </div>
          <Link to="/cart" className="relative p-2 btn-press">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Banner with Company Logo */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-6 text-center flex-shrink-0">
        {company?.logo_url && (
          <img 
            src={company.logo_url} 
            alt={company.name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white/30 shadow-lg"
          />
        )}
        <h2 className="text-2xl font-bold">Order Online</h2>
        <p className="opacity-90">Fresh food delivered to your door</p>
      </div>

      {/* Category Quick Nav with Images */}
      {categories.length > 3 && (
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm flex-shrink-0">
          <div className="flex overflow-x-auto scrollbar-hide gap-2 p-3">
            {categories.map(cat => (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 active:bg-red-100 active:text-red-700 transition btn-press"
              >
                {cat.image_url && (
                  <img 
                    src={cat.image_url} 
                    alt={cat.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
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
                {/* Category Header with Image */}
                <div className="flex items-center gap-3 mb-4">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-12 h-12 rounded-lg object-cover shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
                </div>
                
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
