
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import ProductDetailPage from "./ProductDetailPage";
import { getProductById } from "../api/products";
import { ApiError } from "../api/http";

import type { Product } from "../types/product";

vi.mock("../api/products", () => ({
  getProductById: vi.fn(),
}));

const mockedGetProductById = vi.mocked(getProductById);

const electronics: Product = {
  id: 1,
  productFamily: "ELECTRONICS",
  sku: "ELEC-001",
  name: "Gaming Laptop",
  description: "High-performance gaming laptop",
  model: "GX100",
  manufacturer: "Test Brand",
  category: "Electronics",
  price: 1200,
  stockQuantity: 5,
  active: true,
  powerConsumptionWatts: 150,
  warrantyMonths: 24,
  voltage: 110,
  fabric: null,
  size: null,
  color: null,
};

const clothing: Product = {
  ...electronics,
  id: 2,
  productFamily: "CLOTHING",
  sku: "CLOTH-001",
  name: "Cotton T-Shirt",
  description: "Comfortable cotton shirt",
  category: "Clothing",
  price: 35,
  stockQuantity: 10,
  powerConsumptionWatts: null,
  warrantyMonths: null,
  voltage: null,
  fabric: "Cotton",
  size: "M",
  color: "Black",
};

function renderDetail(initialUrl = "/products/1") {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route
          path="/products/:id"
          element={<ProductDetailPage />}
        />
        <Route
          path="/products"
          element={<div>Back at catalog</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductDetailPage", () => {
  it("renders electronics specifications", async () => {
    mockedGetProductById.mockResolvedValue(electronics);

    renderDetail();

    expect(
      await screen.findByRole("heading", {
        name: "Gaming Laptop",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("ELEC-001")).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
    expect(screen.getByText("24 months")).toBeInTheDocument();
    expect(screen.getByText("110 V")).toBeInTheDocument();
    expect(screen.getByText("150 W")).toBeInTheDocument();
    expect(
      screen.getByText("High-performance gaming laptop"),
    ).toBeInTheDocument();
  });

  it("renders clothing specifications", async () => {
    mockedGetProductById.mockResolvedValue(clothing);

    renderDetail("/products/2");

    expect(
      await screen.findByRole("heading", {
        name: "Cotton T-Shirt",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Cotton")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();

    expect(
      screen.queryByText("Power consumption"),
    ).not.toBeInTheDocument();

    expect(
      mockedGetProductById,
    ).toHaveBeenCalledWith(
      2,
      expect.any(AbortSignal),
    );
  });

  it("shows a loading state", () => {
    mockedGetProductById.mockImplementation(
      () => new Promise(() => {}),
    );

    renderDetail();

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Loading product details");
  });

  it("handles nonexistent products", async () => {
    mockedGetProductById.mockRejectedValue(
      new ApiError(404, "Resource not found."),
    );

    renderDetail("/products/99999");

    expect(
      await screen.findByText(
        "Product not found or no longer available.",
      ),
    ).toBeInTheDocument();
  });

  it("rejects invalid product IDs", () => {
    renderDetail("/products/abc");

    expect(
      screen.getByRole("heading", {
        name: "Invalid product",
      }),
    ).toBeInTheDocument();

    expect(
      mockedGetProductById,
    ).not.toHaveBeenCalled();
  });

  it("identifies out-of-stock products", async () => {
    mockedGetProductById.mockResolvedValue({
      ...electronics,
      stockQuantity: 0,
    });

    renderDetail();

    expect(
      await screen.findByText("Out of stock"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Out of Stock",
      }),
    ).toBeDisabled();
  });

  it("navigates back to the catalog", async () => {
    const user = userEvent.setup();

    mockedGetProductById.mockRejectedValue(
      new ApiError(404, "Resource not found."),
    );

    renderDetail();

    const backLink = await screen.findByRole("link", {
      name: "Back to catalog",
    });

    await user.click(backLink);

    expect(
      screen.getByText("Back at catalog"),
    ).toBeInTheDocument();
  });
});
