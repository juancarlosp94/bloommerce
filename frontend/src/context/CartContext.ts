
import { createContext } from "react";

import type { Product } from "../types/product";
import type { CartItem } from "../types/cart";

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  estimatedTotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

export const CartContext =
  createContext<CartContextValue | undefined>(undefined);
