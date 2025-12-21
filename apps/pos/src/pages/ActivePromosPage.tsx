import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getTodayInTimezone, getPromoStatus } from '../lib/timezone'

type PromoDiscountType = 'item_percentage' | 'item_fixed' | 'order_percentage' | 'order_fixed' | 'free_delivery'

interface Promo {
  id: string
  name: string
  description: string
  discount_type: PromoDiscountType
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  code: string | null
  min_order_amount: number
  applies_to: 'all' | 'categories' | 'products'
}

export function ActivePromosPage() {
  const { activeLocation } = useAuth()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [todayStr, setTodayStr] = useState('')

  useEffect(() => {
    fetchActivePromos()
  }, [activeLocation])

  async function fetchActivePromos() {
    setLoading(true)
    try {
      // Get today's date in company timezone
      const today = await getTodayInTimezone()
      setTodayStr(today)
      
      // Fetch all active promos first
      const { data: allPromos, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today + 'T23:59:59')
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: false })
      
      if (promosError) {
        console.error('Error fetching promos:', promosError)
        setPromos([])
        setLoading(false)
        return
      }
      
      if (!allPromos || allPromos.length === 0) {
        setPromos([])
        setLoading(false)
        return
      }
      
      // If no location selected (admin view), show all promos
      if (!activeLocation?.id) {
        setPromos(allPromos)
        setLoading(false)
        return
      }
      
      // Get all promo_locations entries
      const { data: allPromoLocs, error: locsError } = await supabase
        .from('promo_locations')
        .select('promo_id, location_id')
      
      // If table doesn't exist or error, show all promos
      if (locsError) {
        console.log('promo_locations query failed:', locsError)
        setPromos(allPromos)
        setLoading(false)
        return
      }
      
      // Filter promos: show if NO location restrictions OR current location is in the list
      const filteredPromos = allPromos.filter(promo => {
        const promoLocationEntries = allPromoLocs?.filter(pl => pl.promo_id === promo.id) || []
        
        // If promo has no location restrictions, show it everywhere
        if (promoLocationEntries.length === 0) {
          return true
        }
        
        // If promo has location restrictions, check if current location is included
        return promoLocationEntries.some(pl => pl.location_id === activeLocation.id)
      })
      
      setPromos(filteredPromos)
      
    } catch (error) {
      console.error('Error fetching promos:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDiscountDisplay(promo: Promo) {
    switch (promo.discount_type) {
      case 'item_percentage':
        return { text: `${promo.discount_value}% OFF`, subtext: 'on selected items', color: 'bg-green-500', icon: '🏷️' }
      case 'item_fixed':
        return { text: `$${promo.discount_value} OFF`, subtext: 'on selected items', color: 'bg-green-500', icon: '🏷️' }
      case 'order_percentage':
        return { text: `${promo.discount_value}% OFF`, subtext: 'total order', color: 'bg-blue-500', icon: '🛒' }
      case 'order_fixed':
        return { text: `$${promo.discount_value} OFF`, subtext: 'total order', color: 'bg-blue-500', icon: '🛒' }
      case 'free_delivery':
        return { text: 'FREE DELIVERY', subtext: 'no delivery fee', color: 'bg-purple-500', icon: '🚚' }
      default:
        return { text: 'SPECIAL', subtext: '', color: 'bg-gray-500', icon: '🎉' }
    }
  }

  function getPromoCategory(type: PromoDiscountType) {
    if (type === 'item_percentage' || type === 'item_fixed') return 'Item Discount'
    if (type === 'order_percentage' || type === 'order_fixed') return 'Order Discount'
    if (type === 'free_delivery') return 'Delivery'
    return 'Other'
  }

  function getDaysRemaining(endDate: string | null) {
    if (!endDate || !todayStr) return null
    const endDateOnly = endDate.split('T')[0]
    const todayDate = new Date(todayStr + 'T00:00:00')
    const endDateObj = new Date(endDateOnly + 'T00:00:00')
    const diff = Math.ceil((endDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Active Promotions</h1>
        <p className="text-gray-600">
          {activeLocation ? (
            <>Promotions available at <span className="font-medium text-blue-600">{activeLocation.name}</span></>
          ) : (
            'All active promotions across locations'
          )}
        </p>
      </div>

      {promos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-500 text-lg">No active promotions {activeLocation ? `at ${activeLocation.name}` : ''}</p>
          <p className="text-gray-400 text-sm mt-2">Check back later or ask your manager about upcoming offers</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {promos.map(promo => {
            const discount = getDiscountDisplay(promo)
            const daysRemaining = getDaysRemaining(promo.end_date)
            const category = getPromoCategory(promo.discount_type)
            
            return (
              <div key={promo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header with discount badge */}
                <div className={`${discount.color} text-white p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{discount.icon}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{category}</span>
                  </div>
                  <div className="text-2xl font-bold">{discount.text}</div>
                  {discount.subtext && <div className="text-sm opacity-90">{discount.subtext}</div>}
                  {promo.code && (
                    <div className="mt-2 bg-white/20 rounded px-2 py-1 inline-block">
                      <span className="text-sm">Code: </span>
                      <span className="font-mono font-bold">{promo.code}</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{promo.name}</h3>
                  
                  {promo.description && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">📋 How to apply: </span>
                        {promo.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {promo.min_order_amount > 0 && (
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        <span>Minimum order: <strong>${promo.min_order_amount.toFixed(2)}</strong></span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span>Applies to: <strong>{promo.applies_to === 'all' ? 'All items' : promo.applies_to === 'categories' ? 'Selected categories' : 'Selected products'}</strong></span>
                    </div>
                    
                    {promo.end_date && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          Ends: <strong>{new Date(promo.end_date).toLocaleDateString()}</strong>
                          {daysRemaining !== null && daysRemaining <= 7 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${daysRemaining <= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              {daysRemaining === 0 ? 'Ends today!' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {!promo.end_date && (
                      <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-green-600 font-medium">Ongoing promotion</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Helpful tips for operators */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Tips for Operators</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mention active promotions to customers when taking orders</li>
          <li>• If a promo has a code, customers must provide it at checkout</li>
          <li>• Check the "How to apply" section for specific instructions</li>
          <li>• Contact your manager if a promotion isn't working correctly</li>
        </ul>
      </div>
    </div>
  )
}
