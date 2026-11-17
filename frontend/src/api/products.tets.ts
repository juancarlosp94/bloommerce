
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getProducts, getProductById } from "./products";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Product API", () => {
  it("retrieves paginated products", async () => {
    const response = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 12,
      first: true,
      last: true,
      empty: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getProducts();

    expect(result).toEqual(response);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends combined filters to the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await getProducts({
      name: "Laptop",
      category: "Electronics",
      minPrice: 100,
      maxPrice: 2000,
      sort: "price,asc",
      page: 1,
      size: 12,
    });

    const requestedUrl = String(
      fetchMock.mock.calls[0][0],
    );

    const url = new URL(requestedUrl);

    expect(url.searchParams.get("name")).toBe("Laptop");
    expect(url.searchParams.get("category")).toBe("Electronics");
    expect(url.searchParams.get("minPrice")).toBe("100");
    expect(url.searchParams.get("maxPrice")).toBe("2000");
    expect(url.searchParams.get("sort")).toBe("price,asc");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("retrieves an individual product", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        name: "Gaming Laptop",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const product = await getProductById(42);

    expect(product.id).toBe(42);
    expect(product.name).toBe("Gaming Laptop");

    expect(
      String(fetchMock.mock.calls[0][0]),
    ).toContain("/products/42");
  });

  it("handles product not found errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(
      getProductById(99999),
    ).rejects.toThrow("Resource not found.");
  });

  it("handles network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error("Network connection failed"),
      ),
    );

    await expect(
      getProducts(),
    ).rejects.toThrow("Unable to connect to the server");
  });
});
