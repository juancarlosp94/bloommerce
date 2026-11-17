import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import OrderHistoryPage from "./OrderHistoryPage";
import { AuthContext } from "../context/AuthContext";
import { getOrders } from "../api/orders";


import type { AuthContextValue } from "../context/AuthContext";

vi.mock("../api/orders", () => ({
  getOrders: vi.fn(),
}));

const mockedGetOrders = vi.mocked(getOrders);

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

function renderHistory() {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <OrderHistoryPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrderHistoryPage", () => {
  it("displays the empty order history state", async () => {
    mockedGetOrders.mockResolvedValue({
      content: [],
      number: 0,
      totalPages: 0,
      totalElements: 0,
      empty: true,
    });

    renderHistory();

    expect(
      await screen.findByText("No orders yet"),
    ).toBeInTheDocument();
  });

  it("displays customer orders", async () => {
    mockedGetOrders.mockResolvedValue({
      content: [
        {
          id: 101,
          status: "CREATED",
          totalAmount: 2599.98,
          createdAt: "2026-11-17T18:00:00Z",
        },
      ],
      number: 0,
      totalPages: 1,
      totalElements: 1,
      empty: false,
    });

    renderHistory();

    expect(
      await screen.findByText("Order #101"),
    ).toBeInTheDocument();

    expect(screen.getByText("$2,599.98")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "View details" }),
    ).toHaveAttribute("href", "/orders/101");

    expect(mockedGetOrders).toHaveBeenCalledWith(
      "test-jwt",
      0,
    );
  });

  it("displays an API error", async () => {
    mockedGetOrders.mockRejectedValue(
      new Error("Unable to load orders"),
    );

    renderHistory();

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Unable to load orders");
  });


    it("loads the next page of orders", async () => {
    const user = userEvent.setup();

    mockedGetOrders
        .mockResolvedValueOnce({
        content: [
            {
            id: 101,
            status: "CREATED",
            totalAmount: 1299.99,
            createdAt: "2026-11-17T18:00:00Z",
            },
        ],
        number: 0,
        totalPages: 2,
        totalElements: 15,
        empty: false,
        })
        .mockResolvedValueOnce({
        content: [
            {
            id: 102,
            status: "CREATED",
            totalAmount: 149.99,
            createdAt: "2026-11-17T19:00:00Z",
            },
        ],
        number: 1,
        totalPages: 2,
        totalElements: 15,
        empty: false,
        });

    renderHistory();

    expect(
        await screen.findByText("Order #101"),
    ).toBeInTheDocument();

    await user.click(
        screen.getByRole("button", { name: "Next" }),
    );

    expect(
        await screen.findByText("Order #102"),
    ).toBeInTheDocument();

    expect(mockedGetOrders).toHaveBeenCalledWith(
        "test-jwt",
        1,
    );
    });

    it("loads the next page of orders", async () => {
    const user = userEvent.setup();

    mockedGetOrders
        .mockResolvedValueOnce({
        content: [
            {
            id: 101,
            status: "CREATED",
            totalAmount: 1299.99,
            createdAt: "2026-11-17T18:00:00Z",
            },
        ],
        number: 0,
        totalPages: 2,
        totalElements: 15,
        empty: false,
        })
        .mockResolvedValueOnce({
        content: [
            {
            id: 102,
            status: "CREATED",
            totalAmount: 149.99,
            createdAt: "2026-11-17T19:00:00Z",
            },
        ],
        number: 1,
        totalPages: 2,
        totalElements: 15,
        empty: false,
        });

    renderHistory();

    expect(
        await screen.findByText("Order #101"),
    ).toBeInTheDocument();

    await user.click(
        screen.getByRole("button", { name: "Next" }),
    );

    expect(
        await screen.findByText("Order #102"),
    ).toBeInTheDocument();

    expect(mockedGetOrders).toHaveBeenCalledWith(
        "test-jwt",
        1,
    );

    expect(
        screen.getByText("Page 2 of 2"),
    ).toBeInTheDocument();
    });

});
