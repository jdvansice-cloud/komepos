import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getTodayInTimezone } from '../lib/timezone'

interface Category { id: string; name: string; sort_order: number }
interface Product { id: string; name: string; description: string; base_price: number; image_url: string; category_id: string; is_taxable: boolean }
interface CartItem { product: Product; quantity: number; notes: string; promoDiscount?: number; promoName?: string }
interface Customer { id: string; full_name: string; phone: string; email: string }
interface DeliveryZone { id: string; name: string; delivery_fee: number }
interface ItemPromo { id: string; name: string; discount_type: 'item_percentage' | 'item_fixed'; discount_value: number; product_ids: string[] }
interface PaymentMethod { id: string; name: string; code: string; icon: string; is_active: boolean; requires_change: boolean }
interface RefundOrder { id: string; order_number: string; payment_method: string; total: number; customer_id: string | null; customer_name: string }

export function POSPage() {
  const { profile, activeLocation } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Refund mode
  const [isRefundMode, setIsRefundMode] = useState(false)
  const [refundOrder, setRefundOrder] = useState<RefundOrder | null>(null)
  
  // Customer selection
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<{ type: 'walk-in' | 'named'; customer: Customer | null } | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  
  // Order type
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'phone' | 'delivery'>('dine_in')
  
  // Delivery
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [showZoneModal, setShowZoneModal] = useState(false)
  
  // Discount
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [showDiscountSection, setShowDiscountSection] = useState(false)
  
  // Order notes
  const [orderNotes, setOrderNotes] = useState('')
  const [showNotesSection, setShowNotesSection] = useState(false)
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; customerName: string; total: number; paymentMethod: string; change: number; isRefund?: boolean } | null>(null)
  
  // Tax rate
  const [taxRate, setTaxRate] = useState(0.07)
  
  // Active item promos
  const [itemPromos, setItemPromos] = useState<ItemPromo[]>([])

  useEffect(() => { fetchData() }, [activeLocation])
  
  // Check for refund order in URL params
  useEffect(() => {
    const refundOrderId = searchParams.get('refund')
    if (refundOrderId) {
      loadRefundOrder(refundOrderId)
    }
  }, [searchParams])
  
  async function loadRefundOrder(orderId: string) {
    try {
      // Fetch order with items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, customer:customers(id, full_name, phone, email)')
        .eq('id', orderId)
        .single()
      
      if (orderError) throw orderError
      
      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
      
      if (itemsError) throw itemsError
      
      // Set refund mode
      setIsRefundMode(true)
      setRefundOrder({
        id: order.id,
        order_number: order.order_number,
        payment_method: order.payment_method,
        total: order.total,
        customer_id: order.customer_id,
        customer_name: order.customer?.full_name || 'Walk-in'
      })
      
      // Set customer
      if (order.customer) {
        setSelectedCustomer({ type: 'named', customer: order.customer })
      } else {
        setSelectedCustomer({ type: 'walk-in', customer: null })
      }
      
      // Load items into cart
      const cartItems: CartItem[] = items.map((item: any) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
          description: '',
          base_price: item.unit_price,
          image_url: '',
          category_id: '',
          is_taxable: item.is_taxable
        },
        quantity: item.quantity,
        notes: item.item_notes || ''
      }))
      setCart(cartItems)
      
      // Set order notes if any
      if (order.customer_notes) {
        setOrderNotes(`REFUND: ${order.customer_notes}`)
        setShowNotesSection(true)
      } else {
        setOrderNotes(`REFUND for order #${order.order_number}`)
        setShowNotesSection(true)
      }
      
    } catch (error) {
      console.error('Error loading refund order:', error)
      alert('Error loading order for refund')
      // Clear refund param
      setSearchParams({})
    }
  }
  
  function cancelRefundMode() {
    setIsRefundMode(false)
    setRefundOrder(null)
    setCart([])
    setSelectedCustomer(null)
    setOrderNotes('')
    setShowNotesSection(false)
    setSearchParams({})
  }

  async function fetchData() {
    try {
      const [categoriesRes, productsRes, companyRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('companies').select('itbms_rate').single(),
      ])
      setCategories(categoriesRes.data || [])
      setProducts(productsRes.data || [])
      if (companyRes.data?.itbms_rate) setTaxRate(companyRes.data.itbms_rate)
      
      // Fetch active item promos using company timezone
      const todayStr = await getTodayInTimezone()
      
      // Get all item promos first
      const { data: allItemPromos } = await supabase
        .from('promos')
        .select('id, name, discount_type, discount_value')
        .eq('is_active', true)
        .in('discount_type', ['item_percentage', 'item_fixed'])
        .lte('start_date', todayStr + 'T23:59:59')
        .or(`end_date.is.null,end_date.gte.${todayStr}`)
      
      let promos = allItemPromos || []
      
      // Filter by location if applicable
      if (activeLocation?.id && promos.length > 0) {
        const { data: allPromoLocs, error: locsError } = await supabase
          .from('promo_locations')
          .select('promo_id, location_id')
        
        if (!locsError && allPromoLocs) {
          // Filter promos: show if NO location restrictions OR current location is included
          promos = promos.filter(promo => {
            const promoLocationEntries = allPromoLocs.filter(pl => pl.promo_id === promo.id)
            // If promo has no location restrictions, show it everywhere
            if (promoLocationEntries.length === 0) return true
            // If promo has location restrictions, check if current location is included
            return promoLocationEntries.some(pl => pl.location_id === activeLocation.id)
          })
        }
      }
      
      if (promos.length > 0) {
        // Get products for each promo
        const promoIds = promos.map(p => p.id)
        const { data: promoProducts } = await supabase
          .from('promo_products')
          .select('promo_id, product_id')
          .in('promo_id', promoIds)
        
        const itemPromosData: ItemPromo[] = promos.map(p => ({
          id: p.id,
          name: p.name,
          discount_type: p.discount_type as 'item_percentage' | 'item_fixed',
          discount_value: p.discount_value,
          product_ids: promoProducts?.filter(pp => pp.promo_id === p.id).map(pp => pp.product_id) || []
        }))
        setItemPromos(itemPromosData)
      } else {
        setItemPromos([])
      }
      
      // Fetch delivery zones for current location
      if (activeLocation?.id) {
        const { data: zoneLinks } = await supabase
          .from('delivery_zone_locations')
          .select('zone:delivery_zones(id, name, delivery_fee)')
          .eq('location_id', activeLocation.id)
        
        const zones = zoneLinks
          ?.map((zl: any) => zl.zone)
          .filter((z: any) => z && z.is_active !== false) || []
        setDeliveryZones(zones)
      } else {
        // Admin - fetch all zones
        const { data: allZones } = await supabase
          .from('delivery_zones')
          .select('id, name, delivery_fee')
          .eq('is_active', true)
          .order('name')
        setDeliveryZones(allZones || [])
      }
      
      // Fetch payment methods
      const { data: paymentMethodsData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (paymentMethodsData && paymentMethodsData.length > 0) {
        setPaymentMethods(paymentMethodsData)
        setSelectedPaymentMethod(paymentMethodsData[0]) // Default to first method
      } else {
        // Fallback to default methods if none configured
        const defaultMethods: PaymentMethod[] = [
          { id: 'default-cash', name: 'Cash', code: 'cash', icon: '💵', is_active: true, requires_change: true },
          { id: 'default-card', name: 'Card', code: 'card', icon: '💳', is_active: true, requires_change: false },
        ]
        setPaymentMethods(defaultMethods)
        setSelectedPaymentMethod(defaultMethods[0])
      }
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  async function searchCustomers(query: string) {
    if (query.length < 2) { setCustomers([]); return }
    const { data } = await supabase
      .from('customers')
      .select('id, full_name, phone, email')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10)
    setCustomers(data || [])
  }

  // Find if a product has an active promo
  function getProductPromo(productId: string): { discount: number; promoName: string } | null {
    for (const promo of itemPromos) {
      if (promo.product_ids.includes(productId)) {
        return {
          promoName: promo.name,
          discount: promo.discount_value
        }
      }
    }
    return null
  }
  
  // Calculate promo discount for a product
  function calculatePromoDiscount(product: Product): { discount: number; promoName: string } | null {
    for (const promo of itemPromos) {
      if (promo.product_ids.includes(product.id)) {
        const discount = promo.discount_type === 'item_percentage'
          ? product.base_price * (promo.discount_value / 100)
          : Math.min(promo.discount_value, product.base_price) // Fixed discount can't exceed price
        return { discount, promoName: promo.name }
      }
    }
    return null
  }

  function addToCart(product: Product) {
    const promoInfo = calculatePromoDiscount(product)
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        notes: '',
        promoDiscount: promoInfo?.discount,
        promoName: promoInfo?.promoName
      }]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev => prev
      .map(item => item.product.id === productId 
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
      )
      .filter(item => item.quantity > 0)
    )
  }

  function updateNotes(productId: string, notes: string) {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, notes } : item
    ))
  }

  // Calculations
  // Items subtotal (full prices before any discounts)
  const itemsSubtotalFull = cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0)
  
  // Promo discounts (automatic item discounts)
  const promoDiscountTotal = cart.reduce((sum, item) => 
    sum + ((item.promoDiscount || 0) * item.quantity), 0
  )
  
  // Items subtotal after promo discounts
  const itemsSubtotal = itemsSubtotalFull - promoDiscountTotal
  
  // Manual discount calculation
  const parsedDiscount = parseFloat(discountValue) || 0
  const manualDiscountAmount = discountValue 
    ? (discountType === 'percent' 
        ? itemsSubtotal * (parsedDiscount / 100) 
        : parsedDiscount)
    : 0
  
  // Total discount (promo + manual)
  const discountAmount = promoDiscountTotal + manualDiscountAmount
  
  // Subtotal after all discounts
  const subtotalAfterDiscount = Math.max(0, itemsSubtotalFull - discountAmount)
  
  // Delivery charge
  const deliveryCharge = (orderType === 'delivery' && selectedZone) ? selectedZone.delivery_fee : 0
  
  // Subtotal (items after discount + delivery)
  const subtotal = subtotalAfterDiscount + deliveryCharge
  
  // Tax calculation (taxable items + delivery)
  const taxableItemsAmount = cart.reduce((sum, item) => 
    item.product.is_taxable ? sum + (item.product.base_price * item.quantity) : sum, 0
  )
  // Proportional discount on taxable items
  const discountRatio = itemsSubtotalFull > 0 ? discountAmount / itemsSubtotalFull : 0
  const taxableAfterDiscount = taxableItemsAmount * (1 - discountRatio)
  const taxableAmount = taxableAfterDiscount + deliveryCharge // Delivery is taxable
  const tax = taxableAmount * taxRate
  
  // Total
  const total = subtotal + tax
  const change = cashReceived ? parseFloat(cashReceived) - total : 0

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function processPayment() {
    if (cart.length === 0 || !selectedCustomer) return
    if (!isRefundMode && orderType === 'delivery' && !selectedZone) {
      alert('Please select a delivery zone')
      return
    }
    
    // Ensure we have a location
    if (!activeLocation?.id) {
      alert('Please select a location first')
      return
    }
    
    // Ensure payment method is selected
    if (!selectedPaymentMethod) {
      alert('Please select a payment method')
      return
    }
    
    setProcessing(true)
    
    try {
      if (isRefundMode && refundOrder) {
        // Process refund
        const refundNumber = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        
        // Create refund order with negative amounts
        const { data: refund, error: refundError } = await supabase
          .from('orders')
          .insert({
            order_number: refundNumber,
            location_id: activeLocation.id,
            customer_id: selectedCustomer.type === 'named' ? selectedCustomer.customer?.id : null,
            user_id: profile?.id,
            order_type: 'takeout', // Refunds are always takeout type
            status: 'completed',
            subtotal: -itemsSubtotal,
            discount_amount: 0,
            delivery_fee: 0,
            tax_amount: -tax,
            total: -total,
            payment_method: selectedPaymentMethod.code,
            payment_status: 'refunded',
            internal_notes: `REFUND for order #${refundOrder.order_number} (ID: ${refundOrder.id})`,
            customer_notes: orderNotes || null,
          })
          .select()
          .single()

        if (refundError) throw refundError

        // Create refund items (negative quantities shown as regular for clarity)
        const refundItems = cart.map(item => ({
          order_id: refund.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: -item.product.base_price, // Negative price for refund
          line_total: -(item.product.base_price * item.quantity),
          item_notes: `Refund: ${item.notes || ''}`.trim(),
          is_taxable: item.product.is_taxable,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(refundItems)

        if (itemsError) throw itemsError
        
        // Update original order status to refunded
        await supabase
          .from('orders')
          .update({ payment_status: 'refunded' })
          .eq('id', refundOrder.id)

        // Success
        const customerName = selectedCustomer.type === 'walk-in' ? 'Walk-in' : selectedCustomer.customer?.full_name || 'Customer'
        setLastOrder({
          orderNumber: refund.order_number,
          customerName,
          total,
          paymentMethod: selectedPaymentMethod.name,
          change: 0,
          isRefund: true
        })
        setShowSuccessModal(true)
        
        // Reset everything including refund mode
        setCart([])
        setSelectedCustomer(null)
        setSelectedZone(null)
        setDiscountValue('')
        setOrderNotes('')
        setShowDiscountSection(false)
        setShowNotesSection(false)
        setShowPaymentModal(false)
        setCashReceived('')
        setIsRefundMode(false)
        setRefundOrder(null)
        setSearchParams({})
        
      } else {
        // Normal order processing
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        
        // Build notes
        const notes = [
          selectedCustomer.type === 'walk-in' ? 'Walk-in customer' : null,
          discountAmount > 0 ? `Discount: ${discountType === 'percent' ? discountValue + '%' : '$' + discountValue}` : null,
          orderType === 'delivery' && selectedZone ? `Delivery Zone: ${selectedZone.name}` : null,
        ].filter(Boolean).join(' | ')

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            location_id: activeLocation.id,
            customer_id: selectedCustomer.type === 'named' ? selectedCustomer.customer?.id : null,
            user_id: profile?.id,
            order_type: orderType,
            status: orderType === 'delivery' ? 'pending' : 'completed',
            subtotal: itemsSubtotal,
            discount_amount: discountAmount,
            delivery_fee: deliveryCharge,
            tax_amount: tax,
            total,
            payment_method: selectedPaymentMethod.code,
            payment_status: 'paid',
            internal_notes: notes || null,
            customer_notes: orderNotes || null,
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = cart.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.base_price,
          line_total: item.product.base_price * item.quantity,
          item_notes: item.notes || null,
          is_taxable: item.product.is_taxable,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // Success - store order info and show modal
        const customerName = selectedCustomer.type === 'walk-in' ? 'Walk-in' : selectedCustomer.customer?.full_name || 'Customer'
        setLastOrder({
          orderNumber: order.order_number,
          customerName,
          total,
          paymentMethod: selectedPaymentMethod.name,
          change: selectedPaymentMethod.requires_change ? change : 0
        })
        setShowSuccessModal(true)
        
        // Reset cart and payment
        setCart([])
        setSelectedCustomer(null)
        setSelectedZone(null)
        setDiscountValue('')
        setOrderNotes('')
        setShowDiscountSection(false)
        setShowNotesSection(false)
        setShowPaymentModal(false)
        setCashReceived('')
      }
      
    } catch (error: any) {
      console.error('Order error details:', error)
      alert(`Error processing order: ${error?.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Refund Mode Banner */}
        {isRefundMode && refundOrder && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">↩️</span>
              <div>
                <p className="font-bold">REFUND MODE</p>
                <p className="text-sm opacity-90">Processing refund for Order #{refundOrder.order_number}</p>
              </div>
            </div>
            <button
              onClick={cancelRefundMode}
              className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50"
            >
              Cancel Refund
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">
              {isRefundMode ? '↩️ Process Refund' : 'Point of Sale'}
            </h1>
            {!isRefundMode && (
              <>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  {(['dine_in', 'takeout', 'phone', 'delivery'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setOrderType(type)
                        if (type !== 'delivery') setSelectedZone(null)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        orderType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'dine_in' ? '🍽️ Dine In' : type === 'takeout' ? '🥡 Takeout' : type === 'phone' ? '📞 Phone' : '🚚 Delivery'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Categories - hide in refund mode */}
        {!isRefundMode && (
          <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid - hide in refund mode */}
        {!isRefundMode ? (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => {
                const promoInfo = calculatePromoDiscount(product)
                const hasPromo = promoInfo !== null
                const discountedPrice = hasPromo 
                  ? product.base_price - promoInfo.discount 
                  : product.base_price
                
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`rounded-lg shadow hover:shadow-md transition p-3 text-left relative ${hasPromo ? 'bg-green-50 border-2 border-green-300' : 'bg-white'}`}
                  >
                    {hasPromo && (
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                        🏷️ Sale
                      </div>
                    )}
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-3xl">🍔</div>
                    )}
                    <h3 className="font-medium text-gray-800 text-sm truncate">{product.name}</h3>
                    {hasPromo ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through text-sm">${product.base_price.toFixed(2)}</span>
                        <span className="text-green-600 font-bold">${discountedPrice.toFixed(2)}</span>
                      </div>
                    ) : (
                      <p className="text-blue-600 font-bold">${product.base_price.toFixed(2)}</p>
                    )}
                  </button>
                )
            })}
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-500 py-8">No products found</p>
          )}
        </div>
        ) : (
          /* Refund Mode Info Panel */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">↩️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Refund</h2>
              <p className="text-gray-600 mb-4">
                Refund for Order <span className="font-mono font-bold">#{refundOrder?.order_number}</span>
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-500 mb-1">Original Payment Method</p>
                <p className="font-medium text-gray-800 capitalize">{refundOrder?.payment_method}</p>
                <p className="text-sm text-gray-500 mt-3 mb-1">Customer</p>
                <p className="font-medium text-gray-800">{refundOrder?.customer_name}</p>
                <p className="text-sm text-gray-500 mt-3 mb-1">Original Total</p>
                <p className="font-medium text-gray-800">${refundOrder?.total.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Review the items in the cart and process the refund using the original payment method.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Customer */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Customer</span>
            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          {selectedCustomer ? (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              {selectedCustomer.type === 'walk-in' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚶</span>
                  <p className="font-medium text-gray-800">Walk-in Customer</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-800">{selectedCustomer.customer?.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer.customer?.phone}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedCustomer({ type: 'walk-in', customer: null })}
                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
              >
                🚶 Walk-in
              </button>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition"
              >
                👤 Search
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p>Cart is empty</p>
              <p className="text-sm">Tap products to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => {
                const hasPromo = item.promoDiscount && item.promoDiscount > 0
                const originalTotal = item.product.base_price * item.quantity
                const discountedTotal = hasPromo 
                  ? originalTotal - (item.promoDiscount! * item.quantity)
                  : originalTotal
                
                return (
                  <div key={item.product.id} className={`rounded-lg p-3 ${hasPromo ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                          {hasPromo && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                              🏷️ {item.promoName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPromo ? (
                            <>
                              <span className="text-sm text-gray-400 line-through">${item.product.base_price.toFixed(2)}</span>
                              <span className="text-sm text-green-600 font-medium">
                                ${(item.product.base_price - item.promoDiscount!).toFixed(2)} each
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">${item.product.base_price.toFixed(2)} each</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {hasPromo && (
                            <p className="text-xs text-gray-400 line-through">${originalTotal.toFixed(2)}</p>
                          )}
                          <p className={`font-bold ${hasPromo ? 'text-green-600' : 'text-gray-800'}`}>
                            ${discountedTotal.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white rounded-lg border">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                        >
                          +
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Notes..."
                        value={item.notes}
                        onChange={(e) => updateNotes(item.product.id, e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Collapsible Options */}
        {cart.length > 0 && (
          <div className="border-t">
            {/* Delivery Zone Selector */}
            {orderType === 'delivery' && (
              <div className="p-3 border-b">
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Zone</label>
                {selectedZone ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-gray-800">{selectedZone.name}</p>
                      <p className="text-sm text-green-600">${selectedZone.delivery_fee.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setShowZoneModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowZoneModal(true)}
                    className="w-full py-2 px-3 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 transition"
                  >
                    🚚 Select Delivery Zone
                  </button>
                )}
              </div>
            )}
            
            {/* Collapsible Discount Section */}
            <div className="border-b">
              <button
                onClick={() => setShowDiscountSection(!showDiscountSection)}
                className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Add Discount</span>
                  {discountValue && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
                      {discountType === 'percent' ? `${discountValue}%` : `$${discountValue}`}
                    </span>
                  )}
                </span>
                <span className={`transition-transform ${showDiscountSection ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showDiscountSection && (
                <div className="px-3 pb-3">
                  <div className="flex gap-2">
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setDiscountType('percent')}
                        className={`px-3 py-2 text-sm font-medium ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`px-3 py-2 text-sm font-medium ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        $
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={discountType === 'percent' ? '100' : itemsSubtotal.toString()}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percent' ? '0%' : '$0.00'}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    {discountValue && (
                      <button
                        onClick={() => { setDiscountValue(''); setShowDiscountSection(false) }}
                        className="px-2 text-gray-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Collapsible Notes Section */}
            <div className="border-b">
              <button
                onClick={() => setShowNotesSection(!showNotesSection)}
                className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-2">
                  <span>📝</span>
                  <span>Add Notes</span>
                  {orderNotes && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium truncate max-w-[120px]">
                      {orderNotes}
                    </span>
                  )}
                </span>
                <span className={`transition-transform ${showNotesSection ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showNotesSection && (
                <div className="px-3 pb-3">
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions, delivery notes..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                  {orderNotes && (
                    <button
                      onClick={() => { setOrderNotes(''); setShowNotesSection(false) }}
                      className="mt-1 text-xs text-gray-400 hover:text-red-600"
                    >
                      Clear notes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Totals & Actions */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items</span>
              <span className="text-gray-800">${itemsSubtotalFull.toFixed(2)}</span>
            </div>
            {promoDiscountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>🏷️ Promo Discounts</span>
                <span>-${promoDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            {manualDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Manual Discount ({discountType === 'percent' ? discountValue + '%' : '$' + discountValue})</span>
                <span>-${manualDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery ({selectedZone?.name})</span>
                <span className="text-gray-800">${deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ITBMS ({(taxRate * 100).toFixed(0)}%)</span>
              <span className="text-gray-800">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
          {!selectedCustomer && cart.length > 0 && (
            <p className="text-sm text-amber-600 mb-3 text-center">⚠️ Add a customer to checkout</p>
          )}
          {!isRefundMode && orderType === 'delivery' && !selectedZone && cart.length > 0 && (
            <p className="text-sm text-amber-600 mb-3 text-center">⚠️ Select a delivery zone</p>
          )}
          <button
            onClick={() => { 
              if (isRefundMode && refundOrder) {
                // Pre-select the original payment method
                const originalMethod = paymentMethods.find(m => m.code === refundOrder.payment_method)
                setSelectedPaymentMethod(originalMethod || null)
              } else {
                setSelectedPaymentMethod(null)
              }
              setCashReceived('')
              setShowPaymentModal(true) 
            }}
            disabled={cart.length === 0 || !selectedCustomer || (!isRefundMode && orderType === 'delivery' && !selectedZone)}
            className={`w-full px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isRefundMode 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRefundMode ? `↩️ Refund $${total.toFixed(2)}` : `Charge $${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Select Customer</h2>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value) }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              autoFocus
            />
            <div className="max-h-64 overflow-auto space-y-2">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => { setSelectedCustomer({ type: 'named', customer }); setShowCustomerModal(false); setCustomerSearch(''); setCustomers([]) }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition"
                >
                  <p className="font-medium text-gray-800">{customer.full_name}</p>
                  <p className="text-sm text-gray-500">{customer.phone} • {customer.email}</p>
                </button>
              ))}
              {customerSearch.length >= 2 && customers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No customers found</p>
              )}
              {customerSearch.length < 2 && (
                <p className="text-center text-gray-400 py-4">Type at least 2 characters to search</p>
              )}
            </div>
            <button
              onClick={() => { setShowCustomerModal(false); setCustomerSearch(''); setCustomers([]) }}
              className="mt-4 w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal - Clean Modal Style */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isRefundMode ? 'bg-red-50' : ''}`}>
              <h2 className={`text-xl font-bold ${isRefundMode ? 'text-red-700' : 'text-gray-800'}`}>
                {isRefundMode ? '↩️ Process Refund' : 'Payment'}
              </h2>
              <button
                onClick={() => { setShowPaymentModal(false); setCashReceived('') }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Refund Info Banner */}
              {isRefundMode && refundOrder && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-600 font-medium mb-1">Refunding Order</p>
                  <p className="font-mono font-bold text-red-800">#{refundOrder.order_number}</p>
                  <p className="text-sm text-red-600 mt-2">Original payment: <span className="font-medium capitalize">{refundOrder.payment_method}</span></p>
                </div>
              )}
              
              {/* Total Amount */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">{isRefundMode ? 'Refund Amount' : 'Total to Pay'}</p>
                <p className={`text-5xl font-bold ${isRefundMode ? 'text-red-600' : 'text-gray-800'}`}>
                  {isRefundMode ? '-' : ''}${total.toFixed(2)}
                </p>
              </div>
              
              {/* Payment Methods - Show only original method in refund mode */}
              {isRefundMode && refundOrder ? (
                <>
                  <p className="text-sm font-medium text-gray-600 mb-3">Refund Payment Method</p>
                  <div className="mb-4">
                    {(() => {
                      const originalMethod = paymentMethods.find(m => m.code === refundOrder.payment_method)
                      if (originalMethod) {
                        return (
                          <div className="p-4 rounded-xl border-2 border-red-500 bg-red-50 flex items-center gap-3">
                            <span className="text-3xl">{originalMethod.icon}</span>
                            <div>
                              <span className="font-medium text-red-700">{originalMethod.name}</span>
                              <p className="text-xs text-red-600">Same as original order</p>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className="p-4 rounded-xl border-2 border-gray-300 bg-gray-50 flex items-center gap-3">
                            <span className="text-3xl">💳</span>
                            <div>
                              <span className="font-medium text-gray-700 capitalize">{refundOrder.payment_method}</span>
                              <p className="text-xs text-gray-500">Original payment method</p>
                            </div>
                          </div>
                        )
                      }
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600 mb-3">Select Payment Method</p>
                  {(() => {
                    const primaryMethods = paymentMethods.filter(m => m.code === 'cash' || m.code === 'card')
                    const secondaryMethods = paymentMethods.filter(m => m.code !== 'cash' && m.code !== 'card')
                    
                    return (
                      <>
                        {/* Primary Payment Methods (Cash & Card) */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {primaryMethods.map(method => (
                            <button
                              key={method.id}
                              onClick={() => { setSelectedPaymentMethod(method); if (!method.requires_change) setCashReceived('') }}
                              className={`p-6 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                                selectedPaymentMethod?.id === method.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <span className="text-3xl">{method.icon}</span>
                              <span className="font-medium">{method.name}</span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Secondary Payment Methods */}
                        {secondaryMethods.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {secondaryMethods.map(method => (
                              <button
                                key={method.id}
                                onClick={() => { setSelectedPaymentMethod(method); if (!method.requires_change) setCashReceived('') }}
                                className={`py-3 px-4 rounded-xl border transition text-sm font-medium ${
                                  selectedPaymentMethod?.id === method.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                              >
                                {method.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
              
              {/* Change Calculator - Only for cash/requires_change methods (not in refund mode) */}
              {!isRefundMode && selectedPaymentMethod?.requires_change && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-gray-600 mb-3">Change Calculator</p>
                  
                  {/* Quick Denomination Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1, 2, 5, 10, 20, 50].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(prev => (parseFloat(prev || '0') + amount).toString())}
                        className="py-3 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  
                  {/* Amount Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Amount to pay</span>
                      <span className="font-medium text-gray-800">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Customer cash</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-right font-medium"
                        />
                        {cashReceived && (
                          <button
                            onClick={() => setCashReceived('')}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium text-gray-700">Change</span>
                      <span className={`text-2xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.max(0, change).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Process Button */}
              <button
                onClick={processPayment}
                disabled={processing || (!isRefundMode && !selectedPaymentMethod) || (!isRefundMode && selectedPaymentMethod?.requires_change && parseFloat(cashReceived || '0') < total)}
                className={`w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${!isRefundMode && !selectedPaymentMethod?.requires_change ? 'mt-4' : ''} ${
                  processing || (!isRefundMode && !selectedPaymentMethod) || (!isRefundMode && selectedPaymentMethod?.requires_change && parseFloat(cashReceived || '0') < total)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isRefundMode 
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isRefundMode ? 'Processing Refund...' : 'Processing...'}
                  </>
                ) : isRefundMode ? (
                  <>
                    <span>↩️</span>
                    <span>Process Refund</span>
                  </>
                ) : !selectedPaymentMethod ? (
                  <span>Select a payment method</span>
                ) : selectedPaymentMethod?.requires_change && parseFloat(cashReceived || '0') < total ? (
                  <span>Enter cash amount</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Process</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Select Delivery Zone</h2>
            <p className="text-sm text-gray-500 mb-4">Choose the delivery zone for this order</p>
            
            {deliveryZones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No delivery zones available</p>
                <p className="text-sm text-gray-400">Add zones in Settings → Delivery Zones</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {deliveryZones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => { setSelectedZone(zone); setShowZoneModal(false) }}
                    className={`w-full p-4 border rounded-lg text-left flex items-center justify-between transition ${
                      selectedZone?.id === zone.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{zone.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${zone.delivery_fee.toFixed(2)}</p>
                      {selectedZone?.id === zone.id && <span className="text-green-600 text-sm">✓ Selected</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              {selectedZone && (
                <button
                  onClick={() => { setSelectedZone(null); setShowZoneModal(false) }}
                  className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove Zone
                </button>
              )}
              <button
                onClick={() => setShowZoneModal(false)}
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {showSuccessModal && lastOrder && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${lastOrder.isRefund ? 'bg-red-600' : 'bg-green-600'}`}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${lastOrder.isRefund ? 'bg-red-100' : 'bg-green-100'}`}>
              {lastOrder.isRefund ? (
                <span className="text-4xl">↩️</span>
              ) : (
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {lastOrder.isRefund ? 'Refund Complete!' : 'Order Complete!'}
            </h2>
            
            <div className={`rounded-xl p-6 my-6 ${lastOrder.isRefund ? 'bg-red-50' : 'bg-gray-100'}`}>
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                {lastOrder.isRefund ? 'Refund Number' : 'Order Number'}
              </p>
              <p className={`text-3xl font-bold font-mono ${lastOrder.isRefund ? 'text-red-700' : 'text-gray-800'}`}>
                {lastOrder.orderNumber}
              </p>
              <p className="text-gray-600 mt-2">{lastOrder.customerName}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-500">{lastOrder.isRefund ? 'Refund Amount' : 'Total'}</span>
                <span className={`font-bold ${lastOrder.isRefund ? 'text-red-600' : 'text-gray-800'}`}>
                  {lastOrder.isRefund ? '-' : ''}${lastOrder.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-800">{lastOrder.paymentMethod}</span>
              </div>
              {lastOrder.change > 0 && !lastOrder.isRefund && (
                <div className="flex justify-between items-center text-xl pt-3 border-t-2 border-dashed">
                  <span className="text-gray-700 font-medium">Change Due</span>
                  <span className="font-bold text-green-600 text-2xl">${lastOrder.change.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => { setShowSuccessModal(false); setLastOrder(null) }}
              className={`w-full py-4 text-white rounded-xl font-bold text-lg transition ${
                lastOrder.isRefund 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {lastOrder.isRefund ? 'Done' : 'Start New Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
