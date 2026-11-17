
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import ProductCatalogPage from "./ProductCatalogPage";
import { getProducts } from "../api/products";

import type { Product, PageResponse } from "../types/product";

vi.mock("../api/products", () => ({
  getProducts: vi.fn(),
}));

const mockedGetProducts = vi.mocked(getProducts);

const laptop: Product = {
  id: 1,
  productFamily: "ELECTRONICS",
  sku: "LAPTOP-001",
  name: "Gaming Laptop",
  description: "High-performance laptop",
  model: "GX100",
  manufacturer: "Test Brand",
  category: "Electronics",
  price: 1200,
  stockQuantity: 10,
  active: true,
  powerConsumptionWatts: 150,
  warrantyMonths: 24,
  voltage: 110,
  fabric: null,
  size: null,
  color: null,
};

const shirt: Product = {
  ...laptop,
  id: 2,
  productFamily: "CLOTHING",
  sku: "SHIRT-001",
  name: "Cotton T-Shirt",
  description: "Comfortable cotton shirt",
  category: "Clothing",
  price: 35,
  stockQuantity: 0,
  powerConsumptionWatts: null,
  warrantyMonths: null,
  voltage: null,
  fabric: "Cotton",
  size: "M",
  color: "Black",
};

function productPage(
  products: Product[],
  page = 0,
  totalPages = 1,
): PageResponse<Product> {
  return {
    content: products,
    totalElements: products.length,
    totalPages,
    number: page,
    size: 12,
    first: page === 0,
    last: page === totalPages - 1,
    empty: products.length === 0,
  };
}

function renderCatalog(initialUrl = "/products") {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route
          path="/products"
          element={<ProductCatalogPage />}
        />
        <Route
          path="/products/:id"
          element={<div>Product detail destination</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductCatalogPage", () => {
  it("renders products returned by the API", async () => {
    mockedGetProducts.mockResolvedValue(
      productPage([laptop, shirt]),
    );

    renderCatalog();

    expect(
      await screen.findByText("Gaming Laptop"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cotton T-Shirt"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Out of stock"),
    ).toBeInTheDocument();

    expect(mockedGetProducts).toHaveBeenCalled();
  });

  it("shows the loading state", () => {
    mockedGetProducts.mockImplementation(
      () => new Promise(() => {}),
    );

    renderCatalog();

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Loading products");
  });

  it("shows the empty state", async () => {
    mockedGetProducts.mockResolvedValue(
      productPage([]),
    );

    renderCatalog();

    expect(
      await screen.findByText("No products found"),
    ).toBeInTheDocument();
  });

  it("shows API errors", async () => {
    mockedGetProducts.mockRejectedValue(
      new Error("Backend unavailable"),
    );

    renderCatalog();

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Backend unavailable");
  });

  it("submits product search to the backend", async () => {
    const user = userEvent.setup();

    mockedGetProducts.mockResolvedValue(
      productPage([laptop]),
    );

    renderCatalog();

    await screen.findByText("Gaming Laptop");

    const input = screen.getByRole("searchbox");

    await user.type(input, "Laptop");
    await user.click(
      screen.getByRole("button", { name: "Search" }),
    );

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: "Laptop",
          page: 0,
        }),
        expect.any(AbortSignal),
      );
    });
  });

  it("combines category and price filters", async () => {
    const user = userEvent.setup();

    mockedGetProducts.mockResolvedValue(
      productPage([laptop]),
    );

    renderCatalog();

    await screen.findByText("Gaming Laptop");

    await user.type(
      screen.getByRole("textbox", { name: "Category" }),
      "Electronics",
    );

    await user.type(
      screen.getByRole("spinbutton", {
        name: "Minimum price",
      }),
      "500",
    );

    await user.type(
      screen.getByRole("spinbutton", {
        name: "Maximum price",
      }),
      "2000",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort by" }),
      "price,asc",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Apply filters",
      }),
    );

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: "Electronics",
          minPrice: 500,
          maxPrice: 2000,
          sort: "price,asc",
          page: 0,
        }),
        expect.any(AbortSignal),
      );
    });
  });

  it("requests the next page", async () => {
    const user = userEvent.setup();

    mockedGetProducts.mockImplementation(
    async (filters) =>
        productPage(
        [laptop],
        filters?.page ?? 0,
        3,
        ),
    );

    renderCatalog();

    await screen.findByText("Page 1 of 3");

    await user.click(
      screen.getByRole("button", {
        name: "Next",
      }),
    );

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
        }),
        expect.any(AbortSignal),
      );
    });

    expect(
      await screen.findByText("Page 2 of 3"),
    ).toBeInTheDocument();
  });

  it("navigates to product details without a reload", async () => {
    const user = userEvent.setup();

    mockedGetProducts.mockResolvedValue(
      productPage([laptop]),
    );

    renderCatalog();

    const link = await screen.findByRole("link", {
      name: /Gaming Laptop/i,
    });

    await user.click(link);

    expect(
      screen.getByText("Product detail destination"),
    ).toBeInTheDocument();
  });
});
