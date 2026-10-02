import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // A cart line is unique per product + size (same shirt in 12 and 16 = two lines).
  const keyOf = (item) => item.key || `${item.id}__${item.size || ''}`

  const addToCart = (product, size = '', qty = 1) => {
    const key = `${product.id}__${size}`
    setCart((prev) => {
      const existing = prev.find((item) => keyOf(item) === key)
      if (existing) {
        return prev.map((item) =>
          keyOf(item) === key ? { ...item, quantity: item.quantity + qty } : item
        )
      }
      const { images, ...rest } = product
      return [...prev, { ...rest, key, size, quantity: qty, image: images?.[0] }]
    })
  }

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => keyOf(item) !== key))
  }

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) return
    setCart((prev) =>
      prev.map((item) => (keyOf(item) === key ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart: cart.map((i) => ({ ...i, key: keyOf(i) })), addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}