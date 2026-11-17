import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import CheckoutPage from "./CheckoutPage";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { createOrder } from "../api/orders";
import { getProductById } from "../api/products";

import type { AuthContextValue } from "../context/AuthContext";
import type { CartContextValue } from "../context/CartContext";
import type { Product } from "../types/product";

vi.mock("../api/orders", () => ({
  createOrder: vi.fn(),
}));

vi.mock("../api/products", () => ({
  getProductById: vi.fn(),
}));

const mockedCreateOrder = vi.mocked(createOrder);
const mockedGetProduct = vi.mocked(getProductById);

const product: Product = {
  id: 1,
  productFamily: "ELECTRONICS",
  sku: "BM-LAP-001",
  name: "Gaming Laptop Pro",
  description: null,
  model: null,
  manufacturer: "BloomTech",
  category: "Laptops",
  price: 1299.99,
  stockQuantity: 10,
  active: true,
  powerConsumptionWatts: null,
  warrantyMonths: null,
  voltage: null,
  fabric: null,
  size: null,
  color: null,
};

const clearCart = vi.fn();

function renderCheckout() {
  const auth: AuthContextValue = {
    user: {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      role: "CUSTOMER",
    },
    token: "test-jwt",
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  const cart: CartContextValue = {
    items: [
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: 2,
        stockQuantity: product.stockQuantity,
        active: true,
      },
    ],
    itemCount: 2,
    estimatedTotal: 2599.98,
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart,
  };

  return render(
    <AuthContext.Provider value={auth}>
      <CartContext.Provider value={cart}>
        <MemoryRouter initialEntries={["/checkout"]}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-confirmation/:id"
              element={<p>Order confirmation</p>}
            />
            <Route path="/cart" element={<p>Cart page</p>} />
          </Routes>
        </MemoryRouter>
      </CartContext.Provider>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetProduct.mockResolvedValue(product);
});

describe("CheckoutPage", () => {
  it("submits only product IDs and quantities", async () => {
    const user = userEvent.setup();

    mockedCreateOrder.mockResolvedValue({
      id: 101,
      status: "CREATED",
      totalAmount: 2599.98,
      createdAt: "2026-11-17T18:00:00Z",
      items: [],
    });

    renderCheckout();

    await user.click(
      screen.getByRole("button", { name: "Place order" }),
    );

    await waitFor(() => {
      expect(mockedCreateOrder).toHaveBeenCalledWith(
        {
          items: [{ productId: 1, quantity: 2 }],
        },
        "test-jwt",
      );
    });

    expect(
      await screen.findByText("Order confirmation"),
    ).toBeInTheDocument();

    expect(clearCart).toHaveBeenCalledOnce();
  });

  it("preserves the cart when checkout fails", async () => {
    const user = userEvent.setup();

    mockedCreateOrder.mockRejectedValue(
      new Error("Insufficient stock"),
    );

    renderCheckout();

    await user.click(
      screen.getByRole("button", { name: "Place order" }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Insufficient stock");

    expect(clearCart).not.toHaveBeenCalled();
  });

  it("rejects checkout when stock is insufficient", async () => {
    const user = userEvent.setup();

    mockedGetProduct.mockResolvedValue({
      ...product,
      stockQuantity: 1,
    });

    renderCheckout();

    await user.click(
      screen.getByRole("button", { name: "Place order" }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("insufficient stock");

    expect(mockedCreateOrder).not.toHaveBeenCalled();
    expect(clearCart).not.toHaveBeenCalled();
  });


    it("prevents checkout when a product becomes inactive", async () => {
    const user = userEvent.setup();

    mockedGetProduct.mockResolvedValue({
        ...product,
        active: false,
        stockQuantity: 0,
    });

    renderCheckout();

    await user.click(
        screen.getByRole("button", { name: "Place order" }),
    );

    expect(
        await screen.findByRole("alert"),
    ).toHaveTextContent("unavailable");

    expect(mockedCreateOrder).not.toHaveBeenCalled();
    expect(clearCart).not.toHaveBeenCalled();
    });

});
