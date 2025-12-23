import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { haptics } from '../lib/haptics'

interface Option {
  id: string
  name: string
  is_default: boolean
  is_available: boolean
  sort_order: number
}

interface OptionGroup {
  id: string
  name: string
  selection_type: 'single' | 'multiple'
  min_selections: number
  max_selections: number
  is_required: boolean
  sort_order: number
  options: Option[]
}

interface Addon {
  id: string
  name: string
  price: number
  is_available: boolean
  sort_order: number
}

interface AddonCategory {
  id: string
  name: string
  description: string | null
  sort_order: number
  addons: Addon[]
}

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  image_url: string | null
  has_options: boolean
}

interface ProductDetailModalProps {
  product: Product
  onClose: () => void
  onAddToCart: (item: {
    product_id: string
    name: string
    price: number
    quantity: number
    image_url?: string
    options: { group_name: string; option_name: string }[]
    addons: { id: string; name: string; price: number; quantity: number }[]
  }) => void
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({})
  const [expandedAddonId, setExpandedAddonId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track scroll to collapse image
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrolled(scrollTop > 80)
  }

  useEffect(() => {
    fetchProductDetails()
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [product.id])

  async function fetchProductDetails() {
    try {
      // Fetch option groups with their options
      const { data: optionGroupsData } = await supabase
        .from('option_groups')
        .select(`
          id, name, selection_type, min_selections, max_selections, is_required, sort_order,
          options (id, name, is_default, is_available, sort_order)
        `)
        .eq('product_id', product.id)
        .order('sort_order')

      // Fetch addon categories linked to this product
      const { data: productAddonsData } = await supabase
        .from('product_addons')
        .select(`
          addon_category_id,
          addon_categories (
            id, name, description, sort_order,
            addons (id, name, price, is_available, sort_order)
          )
        `)
        .eq('product_id', product.id)

      const groups = (optionGroupsData || []).map(g => ({
        ...g,
        options: (g.options || []).sort((a: Option, b: Option) => a.sort_order - b.sort_order)
      })).sort((a, b) => a.sort_order - b.sort_order)

      const categories = (productAddonsData || [])
        .map(pa => pa.addon_categories)
        .filter(Boolean)
        .map((ac: any) => ({
          ...ac,
          addons: (ac.addons || [])
            .filter((a: Addon) => a.is_available)
            .sort((a: Addon, b: Addon) => a.sort_order - b.sort_order)
        }))
        .sort((a: AddonCategory, b: AddonCategory) => a.sort_order - b.sort_order)

      setOptionGroups(groups)
      setAddonCategories(categories)

      // Set default selections for option groups
      const defaults: Record<string, string[]> = {}
      groups.forEach(group => {
        const defaultOptions = group.options
          .filter((o: Option) => o.is_default && o.is_available)
          .map((o: Option) => o.id)
        if (defaultOptions.length > 0) {
          defaults[group.id] = defaultOptions
        } else if (group.is_required && group.selection_type === 'single') {
          // Auto-select first available option for required single-select
          const firstAvailable = group.options.find((o: Option) => o.is_available)
          if (firstAvailable) {
            defaults[group.id] = [firstAvailable.id]
          }
        }
      })
      setSelectedOptions(defaults)
    } catch (error) {
      console.error('Error fetching product details:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleOptionChange(groupId: string, optionId: string, selectionType: 'single' | 'multiple') {
    haptics.tap()
    setSelectedOptions(prev => {
      if (selectionType === 'single') {
        return { ...prev, [groupId]: [optionId] }
      } else {
        const current = prev[groupId] || []
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) }
        } else {
          return { ...prev, [groupId]: [...current, optionId] }
        }
      }
    })
    setErrors([])
  }

  function handleAddonChange(addonId: string, delta: number) {
    haptics.tap()
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0
      const newValue = Math.max(0, current + delta)
      if (newValue === 0) {
        const { [addonId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [addonId]: newValue }
    })
  }

  function toggleAddonCategory(categoryId: string) {
    haptics.tap()
    setExpandedAddonId(prev => prev === categoryId ? null : categoryId)
  }

  // Helper to count selected addons in a category
  function getSelectedAddonsCount(category: AddonCategory): number {
    return category.addons.reduce((sum, addon) => sum + (selectedAddons[addon.id] || 0), 0)
  }

  function validateSelections(): boolean {
    const newErrors: string[] = []
    
    optionGroups.forEach(group => {
      const selected = selectedOptions[group.id] || []
      if (group.is_required && selected.length < group.min_selections) {
        newErrors.push(`Please select ${group.min_selections === 1 ? 'an option' : `at least ${group.min_selections} options`} for "${group.name}"`)
      }
      if (selected.length > group.max_selections) {
        newErrors.push(`You can only select up to ${group.max_selections} options for "${group.name}"`)
      }
    })
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  function calculateTotal(): number {
    let total = product.base_price

    // Add addon prices
    addonCategories.forEach(category => {
      category.addons.forEach(addon => {
        const qty = selectedAddons[addon.id] || 0
        total += addon.price * qty
      })
    })

    return total * quantity
  }

  function handleAddToCart() {
    if (!validateSelections()) return

    // Build options array
    const options = optionGroups.flatMap(group => {
      const selected = selectedOptions[group.id] || []
      return selected.map(optionId => {
        const option = group.options.find(o => o.id === optionId)
        return {
          group_name: group.name,
          option_name: option?.name || ''
        }
      })
    })

    // Build addons array
    const addons = addonCategories.flatMap(category =>
      category.addons
        .filter(addon => (selectedAddons[addon.id] || 0) > 0)
        .map(addon => ({
          id: addon.id,
          name: addon.name,
          price: addon.price,
          quantity: selectedAddons[addon.id]
        }))
    )

    // Calculate unit price (base + addons)
    let unitPrice = product.base_price
    addons.forEach(addon => {
      unitPrice += addon.price * addon.quantity
    })

    onAddToCart({
      product_id: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      image_url: product.image_url || undefined,
      options,
      addons
    })

    onClose()
  }

  const total = calculateTotal()

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Sticky Header - shows when scrolled */}
      <div className={`sticky top-0 z-20 bg-white border-b transition-all duration-200 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 py-2">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-600"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 truncate">{product.name}</h2>
          </div>
          <span className="text-red-600 font-bold">${product.base_price.toFixed(2)}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto bg-white overscroll-none" 
        onScroll={handleScroll}
        style={{ overscrollBehavior: 'none' }}
      >
        {/* Product Image - smaller, collapses on scroll */}
        <div className={`relative transition-all duration-200 bg-white ${scrolled ? 'h-0 overflow-hidden' : 'h-[25vh]'}`}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <span className="text-5xl">🍽️</span>
            </div>
          )}
          {/* Back button - only visible when not scrolled */}
          <button
            onClick={onClose}
            className={`absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-opacity ${scrolled ? 'opacity-0' : 'opacity-100'}`}
          >
            <span className="text-gray-600 text-lg">←</span>
          </button>
          {/* Zoom button */}
          {product.image_url && (
            <button
              onClick={() => setShowImageZoom(true)}
              className={`absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-opacity ${scrolled ? 'opacity-0' : 'opacity-100'}`}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          )}
        </div>

        {/* Product Info - visible when not scrolled */}
        <div className={`px-4 py-2 border-b bg-white ${scrolled ? 'hidden' : ''}`}>
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-lg font-bold text-gray-800 flex-1">{product.name}</h2>
            <span className="text-red-600 font-bold text-lg">${product.base_price.toFixed(2)}</span>
          </div>
          {product.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                {errors.map((error, i) => (
                  <p key={i} className="text-red-600 text-xs">{error}</p>
                ))}
              </div>
            )}

            {/* Option Groups - compact */}
            {optionGroups.map(group => (
              <div key={group.id} className="px-3 py-2 border-b">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="font-semibold text-gray-800 text-sm">{group.name}</h3>
                  <span className="text-xs text-gray-500">
                    {group.selection_type === 'single' ? 'Choose 1' : `${group.min_selections}-${group.max_selections}`}
                    {group.is_required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.options.filter(o => o.is_available).map(option => {
                    const isSelected = (selectedOptions[group.id] || []).includes(option.id)
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionChange(group.id, option.id, group.selection_type)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                          isSelected 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 active:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${isSelected ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                          {option.name}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Addon Categories - Collapsible */}
            {addonCategories.map(category => {
              const isExpanded = expandedAddonId === category.id
              const selectedCount = getSelectedAddonsCount(category)
              
              return (
                <div key={category.id} className="border-b">
                  <button
                    onClick={() => toggleAddonCategory(category.id)}
                    className="w-full px-3 py-2 flex items-center justify-between active:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{category.name}</h3>
                      {selectedCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1">
                      {category.addons.map(addon => {
                        const qty = selectedAddons[addon.id] || 0
                        return (
                          <div
                            key={addon.id}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${
                              qty > 0 ? 'border-red-500 bg-red-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className={`text-sm ${qty > 0 ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                                {addon.name}
                              </span>
                              <span className="text-red-600 text-xs ml-1">+${addon.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => handleAddonChange(addon.id, -1)}
                                    className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center active:bg-red-200"
                                  >−</button>
                                  <span className="w-4 text-center font-semibold text-sm">{qty}</span>
                                  <button
                                    onClick={() => handleAddonChange(addon.id, 1)}
                                    className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center active:bg-red-700"
                                  >+</button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleAddonChange(addon.id, 1)}
                                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200"
                                >+</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Special Instructions - collapsible */}
            <details className="border-b">
              <summary className="px-3 py-2 font-semibold text-gray-800 text-sm cursor-pointer">
                Special Instructions <span className="text-gray-400 text-xs">(optional)</span>
              </summary>
              <div className="px-3 pb-2">
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Allergies, preferences..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={2}
                />
              </div>
            </details>

            {/* Spacer for footer */}
            <div className="h-4"></div>
          </>
        )}
      </div>

      {/* Footer - Quantity & Add to Order */}
      <div className="flex-shrink-0 border-t bg-white px-3 py-2 safe-area-bottom">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-full">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg"
            >−</button>
            <span className="w-6 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg"
            >+</button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm active:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Add to Order
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">${total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && product.image_url && (
        <div 
          className="fixed inset-0 z-60 bg-black flex items-center justify-center"
          onClick={() => setShowImageZoom(false)}
        >
          <button
            onClick={() => setShowImageZoom(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-2xl">×</span>
          </button>
          <img 
            src={product.image_url} 
            alt={product.name}
            className="max-w-full max-h-full object-contain p-4"
          />
        </div>
      )}
    </div>
  )
}
