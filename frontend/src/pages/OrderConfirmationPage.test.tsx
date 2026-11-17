import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import OrderConfirmationPage from "./OrderConfirmationPage";
import { AuthContext } from "../context/AuthContext";
import { getOrderById } from "../api/orders";
import { ApiError } from "../api/http";

import type { AuthContextValue } from "../context/AuthContext";
import type { Order } from "../types/order";

vi.mock("../api/orders", () => ({
  getOrderById: vi.fn(),
}));

const mockedGetOrderById = vi.mocked(getOrderById);

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

const confirmedOrder: Order = {
  id: 101,
  status: "CREATED",
  totalAmount: 2599.98,
  createdAt: "2026-11-17T18:00:00Z",
  items: [
    {
      productId: 1,
      productName: "Gaming Laptop Pro",
      sku: "BM-LAP-001",
      quantity: 2,
      unitPrice: 1299.99,
      subtotal: 2599.98,
    },
  ],
};

function renderConfirmation(
  path = "/order-confirmation/101",
  initialOrder?: Order,
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: path,
            state: initialOrder
              ? { order: initialOrder }
              : null,
          },
        ]}
      >
        <Routes>
          <Route
            path="/order-confirmation/:id"
            element={<OrderConfirmationPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetOrderById.mockResolvedValue(confirmedOrder);
});

describe("OrderConfirmationPage", () => {
  it("displays the confirmed order and total", async () => {
    renderConfirmation(
      "/order-confirmation/101",
      confirmedOrder,
    );

    expect(
      await screen.findByText("Order confirmed!"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Your order #101 has been created/),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Gaming Laptop Pro"),
    ).toBeInTheDocument();

    expect(
        screen.getAllByText("$2,599.98"),
    ).toHaveLength(2);

    expect(
      screen.getByRole("link", {
        name: "View order details",
      }),
    ).toHaveAttribute("href", "/orders/101");
  });

  it("fetches the order when opened directly", async () => {
    renderConfirmation();

    expect(
      await screen.findByText("Order confirmed!"),
    ).toBeInTheDocument();

    expect(mockedGetOrderById).toHaveBeenCalledWith(
      101,
      "test-jwt",
    );

    expect(
      screen.getByText("Gaming Laptop Pro"),
    ).toBeInTheDocument();
  });

  it("rejects invalid order IDs", () => {
    renderConfirmation("/order-confirmation/invalid");

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Invalid order ID");

    expect(mockedGetOrderById).not.toHaveBeenCalled();
  });

  it("displays an error when the order is inaccessible", async () => {
    mockedGetOrderById.mockRejectedValue(
      new ApiError(404, "Order not found"),
    );

    renderConfirmation();

    expect(
      await screen.findByText("Order unavailable"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Order not found");
  });
});
