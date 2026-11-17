
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { getProducts } from "../api/products";

import ProductCard from "../components/products/ProductCard";
import ProductSearch from "../components/products/ProductSearch";
import ProductFilters from "../components/products/ProductFilters";
import Pagination from "../components/products/Pagination";

import type { FilterValues } from "../components/products/ProductFilters";
import type { PageResponse, Product } from "../types/product";

export default function ProductCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryKey = searchParams.toString();
  const name = searchParams.get("name") ?? "";
  const category = searchParams.get("category") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const requestedSort = searchParams.get("sort") ?? "name,asc";
  const allowedSorts = [
    "name,asc",
    "name,desc",
    "price,asc",
    "price,desc",
  ];
  const sort = allowedSorts.includes(requestedSort)
    ? requestedSort
    : "name,asc";

  const parsedPage = Number(searchParams.get("page") ?? "0");
  const page = Number.isInteger(parsedPage) && parsedPage >= 0
    ? parsedPage
    : 0;

  const [result, setResult] =
    useState<PageResponse<Product> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await getProducts(
          {
            name: name || undefined,
            category: category || undefined,
            minPrice: minPrice !== "" ? Number(minPrice) : undefined,
            maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
            sort,
            page,
            size: 12,
          },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResult(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load products.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [queryKey, name, category, minPrice, maxPrice, sort, page]);

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value.trim()) {
        next.set(key, value.trim());
      } else {
        next.delete(key);
      }
    });

    next.delete("page");
    setSearchParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  function applyFilters(values: FilterValues) {
    updateParams({
      category: values.category,
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      sort: values.sort,
    });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  return (
    <section className="space-y-8 py-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Bloommerce Collection
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Explore our products
        </h1>

        <p className="mt-3 text-gray-600">
          Browse electronics, clothing, and more.
        </p>
      </header>

      <ProductSearch
        key={`search-${name}`}
        initialValue={name}
        onSearch={(value) => updateParams({ name: value })}
      />

      <ProductFilters
        key={`filters-${category}-${minPrice}-${maxPrice}-${sort}`}
        initialValues={{ category, minPrice, maxPrice, sort }}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {loading && (
        <p role="status" className="py-12 text-center text-gray-500">
          Loading products...
        </p>
      )}

      {error && (
        <div role="alert"
          className="rounded-xl bg-red-50 p-5 text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && result?.empty && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            No products found
          </h2>
          <p className="mt-2 text-gray-500">
            Try changing your search or filters.
          </p>
        </div>
      )}

      {!loading && !error && result && !result.empty && (
        <>
          <p className="text-sm text-gray-600">
            {result.totalElements} products found
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && result && (
        <Pagination
          page={result.number}
          totalPages={result.totalPages}
          onPageChange={changePage}
        />
      )}
    </section>
  );
}
