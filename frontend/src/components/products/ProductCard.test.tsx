
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";

const laptop: Product = {
  id: 1,
  productFamily: "ELECTRONICS",
  sku: "LAPTOP-001",
  name: "Gaming Laptop",
  description: "Powerful gaming laptop",
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

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );
}

describe("ProductCard", () => {
  it("renders product information", () => {
    renderCard(laptop);

    expect(
      screen.getByText("Gaming Laptop"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("$1,200.00"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("In stock"),
    ).toBeInTheDocument();
  });

  it("links to the correct product details", () => {
    renderCard(laptop);

    expect(
      screen.getByRole("link"),
    ).toHaveAttribute("href", "/products/1");
  });

  it("shows out-of-stock status", () => {
    renderCard({
      ...laptop,
      stockQuantity: 0,
    });

    expect(
      screen.getByText("Out of stock"),
    ).toBeInTheDocument();
  });

  it("renders clothing attributes", () => {
    renderCard({
      ...laptop,
      productFamily: "CLOTHING",
      name: "Cotton T-Shirt",
      category: "Clothing",
      size: "M",
      color: "Black",
      fabric: "Cotton",
    });

    expect(
      screen.getByText("Cotton T-Shirt"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("M · Black"),
    ).toBeInTheDocument();
  });
});

