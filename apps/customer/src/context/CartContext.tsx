import { createContext, useContext, useState, ReactNode } from 'react'

interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: { id: string; name: string; price: number; image_url?: string }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(product: { id: string; name: string; price: number; image_url?: string }) {
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
      }]
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
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
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
