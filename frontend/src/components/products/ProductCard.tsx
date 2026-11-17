
import { Link } from "react-router";

import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const inStock = product.stockQuantity > 0;

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        to={`/products/${product.id}`}
        className="group block h-full focus-visible:outline-2 focus-visible:outline-violet-600"
      >
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100">
          <span className="text-5xl" aria-hidden="true">
            {product.productFamily === "ELECTRONICS"
              ? "💻"
              : "👕"}
          </span>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            {product.category}
          </p>

          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700">
            {product.name}
          </h2>

          {product.productFamily === "CLOTHING" && (
            <p className="text-sm text-gray-500">
              {[product.size, product.color]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {product.productFamily === "ELECTRONICS" &&
            product.manufacturer && (
              <p className="text-sm text-gray-500">
                {product.manufacturer}
              </p>
            )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-bold text-gray-900">
              {price}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                inStock
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {inStock ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
