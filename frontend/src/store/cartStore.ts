import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  // Stock del producto al agregarlo: limita la cantidad en pantalla; el backend vuelve a validarlo
  stock: number
}

interface CartState {
  items: ItemCarrito[]
  agregar: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
}

const limitar = (cantidad: number, stock: number) => Math.max(1, Math.min(cantidad, stock))

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (item, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === item.producto_id)
          // Si el producto ya está en el carrito se suma la cantidad en el mismo ítem (no se repite)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id
                  ? { ...i, ...item, cantidad: limitar(i.cantidad + cantidad, item.stock) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, cantidad: limitar(cantidad, item.stock) }] }
        }),

      quitar: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad: limitar(cantidad, i.stock) } : i,
          ),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0),
    }),
    { name: 'foodstore-carrito' },
  ),
)
