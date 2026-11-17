
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CartContext } from "./CartContext";

import type { Product } from "../types/product";
import type { CartItem } from "../types/cart";

const STORAGE_KEY = "bloommerce-cart";

function validStoredItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;

  return (
    Number.isSafeInteger(item.productId) &&
    Number(item.productId) > 0 &&
    typeof item.name === "string" &&
    typeof item.sku === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isSafeInteger(item.quantity) &&
    Number(item.quantity) > 0 &&
    Number.isSafeInteger(item.stockQuantity) &&
    Number(item.stockQuantity) >= 0 &&
    typeof item.active === "boolean"
  );
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    const seen = new Set<number>();

    return parsed
      .filter(validStoredItem)
      .filter((item) => {
        if (seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
      })
      .map((item) => ({
        ...item,
        quantity: Math.min(
          item.quantity,
          item.stockQuantity,
        ),
      }))
      .filter((item) => item.quantity > 0);
  } catch {
    return [];
  }
}

export default function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Cart remains usable if browser storage is unavailable.
    }
  }, [items]);

  function addItem(product: Product, quantity = 1) {
    if (
      !product.active ||
      product.stockQuantity <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    setItems((previous) => {
      const existing = previous.find(
        (item) => item.productId === product.id,
      );

      const nextQuantity = Math.min(
        (existing?.quantity ?? 0) + quantity,
        product.stockQuantity,
      );

      const updated: CartItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: nextQuantity,
        stockQuantity: product.stockQuantity,
        active: product.active,
      };

      if (existing) {
        return previous.map((item) =>
          item.productId === product.id ? updated : item,
        );
      }

      return [...previous, updated];
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(quantity, item.stockQuantity),
            }
          : item,
      ),
    );
  }

  function removeItem(productId: number) {
    setItems((previous) =>
      previous.filter((item) => item.productId !== productId),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      estimatedTotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    // Cart functions are recreated each render but are not state dependencies.
    [items],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
