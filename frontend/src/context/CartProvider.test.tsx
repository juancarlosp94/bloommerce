import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CartProvider from "./CartProvider";
import { useCart } from "../hooks/useCart";

import type { Product } from "../types/product";


const storage = new Map<string, string>();

const mockLocalStorage: Storage = {
  get length() {
    return storage.size;
  },

  clear() {
    storage.clear();
  },

  getItem(key: string) {
    return storage.get(key) ?? null;
  },

  setItem(key: string, value: string) {
    storage.set(key, String(value));
  },

  removeItem(key: string) {
    storage.delete(key);
  },

  key(index: number) {
    return Array.from(storage.keys())[index] ?? null;
  },
};

vi.stubGlobal("localStorage", mockLocalStorage);


const laptop: Product = {
  id: 1,
  productFamily: "ELECTRONICS",
  sku: "BM-LAP-001",
  name: "Gaming Laptop Pro",
  description: "Gaming laptop",
  model: "Pro",
  manufacturer: "BloomTech",
  category: "Laptops",
  price: 1299.99,
  stockQuantity: 10,
  active: true,
  powerConsumptionWatts: 180,
  warrantyMonths: 24,
  voltage: 120,
  fabric: null,
  size: null,
  color: null,
};

function CartConsumer() {
  const {
    items,
    itemCount,
    estimatedTotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <div>
      <p data-testid="count">{itemCount}</p>
      <p data-testid="total">{estimatedTotal.toFixed(2)}</p>
      <p data-testid="quantity">
        {items[0]?.quantity ?? 0}
      </p>

      <button onClick={() => addItem(laptop)}>
        Add
      </button>

      <button onClick={() => addItem(laptop, 3)}>
        Add three
      </button>

      <button onClick={() => updateQuantity(1, 5)}>
        Set quantity to five
      </button>

      <button onClick={() => updateQuantity(1, -1)}>
        Set invalid quantity
      </button>

      <button onClick={() => addItem(laptop, 20)}>
        Add beyond stock
      </button>

      <button onClick={() => removeItem(1)}>
        Remove
      </button>

      <button onClick={clearCart}>
        Clear
      </button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>,
  );
}

beforeEach(() => {
  mockLocalStorage.clear();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("CartProvider", () => {
  it("starts with an empty cart", () => {
    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("total")).toHaveTextContent("0.00");
  });

  it("adds a product and calculates the subtotal", async () => {
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText("Add"));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("1299.99");
  });

  it("combines quantities of the same product", async () => {
    const user = userEvent.setup();

    renderCart();

    await user.click(screen.getByText("Add"));
    await user.click(screen.getByText("Add three"));

    expect(screen.getByTestId("count")).toHaveTextContent("4");
    expect(screen.getByTestId("quantity")).toHaveTextContent("4");
  });

  it("updates quantities and rejects invalid values", async () => {
    const user = userEvent.setup();

    renderCart();

    await user.click(screen.getByText("Add"));
    await user.click(screen.getByText("Set quantity to five"));

    expect(screen.getByTestId("quantity")).toHaveTextContent("5");

    await user.click(screen.getByText("Set invalid quantity"));

    expect(screen.getByTestId("quantity")).toHaveTextContent("5");
  });

  it("does not exceed available stock", async () => {
    const user = userEvent.setup();

    renderCart();

    await user.click(screen.getByText("Add beyond stock"));

    expect(screen.getByTestId("quantity")).toHaveTextContent("10");
  });

  it("removes products from the cart", async () => {
    const user = userEvent.setup();

    renderCart();

    await user.click(screen.getByText("Add"));
    await user.click(screen.getByText("Remove"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("clears the shopping cart", async () => {
    const user = userEvent.setup();

    renderCart();

    await user.click(screen.getByText("Add"));
    await user.click(screen.getByText("Clear"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("persists products after remounting", async () => {
    const user = userEvent.setup();

    const view = renderCart();

    await user.click(screen.getByText("Add"));

    expect(
      JSON.parse(localStorage.getItem("bloommerce-cart") ?? "[]"),
    ).toHaveLength(1);

    view.unmount();

    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
