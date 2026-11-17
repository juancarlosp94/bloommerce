import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import OrderDetailPage from "./OrderDetailPage";
import { AuthContext } from "../context/AuthContext";
import { getOrderById } from "../api/orders";
import { ApiError } from "../api/http";

import type { AuthContextValue } from "../context/AuthContext";

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

function renderDetails(path = "/orders/101") {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/orders/:id"
            element={<OrderDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrderDetailPage", () => {
  it("displays order details and historical prices", async () => {
    mockedGetOrderById.mockResolvedValue({
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
    });

    renderDetails();

    expect(
      await screen.findByText("Order #101"),
    ).toBeInTheDocument();

    expect(screen.getByText("Gaming Laptop Pro")).toBeInTheDocument();
    expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
    expect(
        screen.getByText(/Historical unit price:.*\$1,299\.99/),
        ).toBeInTheDocument();
    expect(screen.getAllByText("$2,599.98")).toHaveLength(2);

    expect(mockedGetOrderById).toHaveBeenCalledWith(
      101,
      "test-jwt",
    );
  });

  it("handles nonexistent orders", async () => {
    mockedGetOrderById.mockRejectedValue(
      new ApiError(404, "Order not found"),
    );

    renderDetails();

    expect(
      await screen.findByText("Order unavailable"),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Order not found",
    );
  });

  it("rejects invalid order IDs", () => {
    renderDetails("/orders/invalid");

    expect(
      screen.getByText("Invalid order ID"),
    ).toBeInTheDocument();

    expect(mockedGetOrderById).not.toHaveBeenCalled();
  });

  it("handles unauthorized order access", async () => {
    mockedGetOrderById.mockRejectedValue(
      new ApiError(403, "Forbidden"),
    );

    renderDetails();

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "You don't have access to this order.",
    );
  });
});
