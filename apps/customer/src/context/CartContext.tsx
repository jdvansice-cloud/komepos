import { createContext, useContext, useState, ReactNode } from 'react'

interface SelectedOption {
  group_name: string
  option_name: string
}

interface SelectedAddon {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartItem {
  id: string
  product_id: string
  name: string
  price: number // Base price + addon prices per unit
  quantity: number
  image_url?: string
  options: SelectedOption[]
  addons: SelectedAddon[]
  specialInstructions?: string
}

interface AddItemParams {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  options?: SelectedOption[]
  addons?: SelectedAddon[]
  specialInstructions?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: AddItemParams) => void
  addSimpleItem: (product: { id: string; name: string; price: number; image_url?: string }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Helper to generate a unique key for cart item based on product + options + addons
  function getItemKey(item: AddItemParams): string {
    const optionsKey = (item.options || [])
      .map(o => `${o.group_name}:${o.option_name}`)
      .sort()
      .join('|')
    const addonsKey = (item.addons || [])
      .map(a => `${a.id}:${a.quantity}`)
      .sort()
      .join('|')
    return `${item.product_id}_${optionsKey}_${addonsKey}`
  }

  // Add item with options and addons (from product detail modal)
  function addItem(item: AddItemParams) {
    setItems(prev => {
      const itemKey = getItemKey(item)
      
      // Check if same product with same options/addons exists
      const existingIndex = prev.findIndex(existing => {
        const existingKey = getItemKey({
          product_id: existing.product_id,
          name: existing.name,
          price: existing.price,
          quantity: existing.quantity,
          options: existing.options,
          addons: existing.addons
        })
        return existingKey === itemKey
      })

      if (existingIndex >= 0) {
        // Update quantity of existing item
        return prev.map((existing, index) =>
          index === existingIndex
            ? { ...existing, quantity: existing.quantity + item.quantity }
            : existing
        )
      }

      // Add new item
      return [...prev, {
        id: crypto.randomUUID(),
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        options: item.options || [],
        addons: item.addons || [],
        specialInstructions: item.specialInstructions
      }]
    })
  }

  // Quick add for simple products without options
  function addSimpleItem(product: { id: string; name: string; price: number; image_url?: string }) {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      options: [],
      addons: []
    })
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, addSimpleItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
