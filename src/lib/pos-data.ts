// Types
export interface Product {
  id: string | number
  name: string
  price: number
  category: string
  code?: string
  stock: number
  image?: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Category {
  id: string | number
  name: string
  icon?: string
}

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "yape"

export interface Sale {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  change: number
  timestamp: Date
  cashierId: string
}
