
import { apiGet } from "./http";

import type {
  PageResponse,
  Product,
  ProductFilters,
} from "../types/product";

export function getProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal,
): Promise<PageResponse<Product>> {
  const params = new URLSearchParams();

  if (filters.name?.trim()) {
    params.set("name", filters.name.trim());
  }

  if (filters.category?.trim()) {
    params.set("category", filters.category.trim());
  }

  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  params.set("page", String(filters.page ?? 0));
  params.set("size", String(filters.size ?? 12));
  params.set("sort", filters.sort ?? "name,asc");

  return apiGet<PageResponse<Product>>(
    `/products?${params.toString()}`,
    signal,
  );
}

export function getProductById(
  id: number,
  signal?: AbortSignal,
): Promise<Product> {
  return apiGet<Product>(
    `/products/${id}`,
    signal,
  );
}
