// Types
export interface Product {
  id: string
  name: string
  price: number
  category: string
  code: string
  stock: number
  image: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Category {
  id: string
  name: string
  icon: string
}

// Sample data
export const categories: Category[] = [
  { id: "all", name: "Todos", icon: "grid" },
  { id: "bebidas", name: "Bebidas", icon: "cup-soda" },
  { id: "snacks", name: "Snacks", icon: "cookie" },
  { id: "lacteos", name: "Lácteos", icon: "milk" },
  { id: "panaderia", name: "Panadería", icon: "croissant" },
  { id: "limpieza", name: "Limpieza", icon: "spray-can" },
]

export const products: Product[] = [
  // Bebidas
  { id: "1", name: "Coca Cola 500ml", price: 3.50, category: "bebidas", code: "7750885001234", stock: 48, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop" },
  { id: "2", name: "Inca Kola 500ml", price: 3.50, category: "bebidas", code: "7750885001235", stock: 36, image: "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=100&h=100&fit=crop" },
  { id: "3", name: "Agua San Luis 625ml", price: 2.00, category: "bebidas", code: "7750885001236", stock: 60, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop" },
  { id: "4", name: "Sprite 500ml", price: 3.50, category: "bebidas", code: "7750885001237", stock: 24, image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=100&h=100&fit=crop" },
  { id: "5", name: "Gatorade 500ml", price: 4.50, category: "bebidas", code: "7750885001238", stock: 18, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&h=100&fit=crop" },
  { id: "6", name: "Frugos 235ml", price: 2.50, category: "bebidas", code: "7750885001239", stock: 30, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100&h=100&fit=crop" },
  
  // Snacks
  { id: "7", name: "Papitas Lays 85g", price: 4.00, category: "snacks", code: "7750885002001", stock: 25, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100&h=100&fit=crop" },
  { id: "8", name: "Doritos 84g", price: 4.50, category: "snacks", code: "7750885002002", stock: 20, image: "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=100&h=100&fit=crop" },
  { id: "9", name: "Cheetos 75g", price: 3.50, category: "snacks", code: "7750885002003", stock: 28, image: "https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=100&h=100&fit=crop" },
  { id: "10", name: "Galleta Oreo", price: 2.50, category: "snacks", code: "7750885002004", stock: 40, image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100&h=100&fit=crop" },
  { id: "11", name: "Chocman", price: 1.50, category: "snacks", code: "7750885002005", stock: 50, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop" },
  { id: "12", name: "Sublime 30g", price: 2.00, category: "snacks", code: "7750885002006", stock: 45, image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=100&h=100&fit=crop" },
  
  // Lácteos
  { id: "13", name: "Leche Gloria 1L", price: 5.50, category: "lacteos", code: "7750885003001", stock: 24, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop" },
  { id: "14", name: "Yogurt Gloria 1L", price: 6.00, category: "lacteos", code: "7750885003002", stock: 15, image: "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=100&h=100&fit=crop" },
  { id: "15", name: "Queso Laive 200g", price: 8.50, category: "lacteos", code: "7750885003003", stock: 12, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100&h=100&fit=crop" },
  { id: "16", name: "Mantequilla 200g", price: 7.00, category: "lacteos", code: "7750885003004", stock: 18, image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100&h=100&fit=crop" },
  
  // Panadería
  { id: "17", name: "Pan Francés (6 und)", price: 3.00, category: "panaderia", code: "7750885004001", stock: 30, image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=100&h=100&fit=crop" },
  { id: "18", name: "Pan de Molde", price: 5.50, category: "panaderia", code: "7750885004002", stock: 20, image: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=100&h=100&fit=crop" },
  { id: "19", name: "Croissant", price: 2.50, category: "panaderia", code: "7750885004003", stock: 15, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop" },
  { id: "20", name: "Empanada", price: 3.50, category: "panaderia", code: "7750885004004", stock: 25, image: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=100&h=100&fit=crop" },
  
  // Limpieza
  { id: "21", name: "Detergente Ace 1kg", price: 12.00, category: "limpieza", code: "7750885005001", stock: 20, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop" },
  { id: "22", name: "Lejía Clorox 1L", price: 6.50, category: "limpieza", code: "7750885005002", stock: 18, image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=100&h=100&fit=crop" },
  { id: "23", name: "Jabón Bolívar", price: 4.00, category: "limpieza", code: "7750885005003", stock: 30, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=100&h=100&fit=crop" },
  { id: "24", name: "Papel Higiénico (4 und)", price: 8.00, category: "limpieza", code: "7750885005004", stock: 25, image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=100&h=100&fit=crop" },
]

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
