
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getProductById } from "../api/products";
import { ApiError } from "../api/http";

import type { Product } from "../types/product";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface AttributeProps {
  label: string;
  value: string | number | null;
  suffix?: string;
}

function Attribute({ label, value, suffix = "" }: AttributeProps) {
  if (value === null || value === "") {
    return null;
  }

  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">
        {value}{suffix}
      </dd>
    </div>
  );
}

function ProductAttributes({ product }: { product: Product }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Product specifications
      </h2>

      <dl>
        <Attribute label="SKU" value={product.sku} />
        <Attribute label="Category" value={product.category} />
        <Attribute label="Brand" value={product.manufacturer} />
        <Attribute label="Model" value={product.model} />

        {product.productFamily === "ELECTRONICS" && (
          <>
            <Attribute
              label="Warranty"
              value={product.warrantyMonths}
              suffix=" months"
            />

            <Attribute
              label="Voltage"
              value={product.voltage}
              suffix=" V"
            />

            <Attribute
              label="Power consumption"
              value={product.powerConsumptionWatts}
              suffix=" W"
            />
          </>
        )}

        {product.productFamily === "CLOTHING" && (
          <>
            <Attribute label="Size" value={product.size} />
            <Attribute label="Color" value={product.color} />
            <Attribute label="Fabric" value={product.fabric} />
          </>
        )}
      </dl>
    </section>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = Number(id);
  const validId =
    id !== undefined &&
    /^\d+$/.test(id) &&
    Number.isSafeInteger(productId) &&
    productId > 0;

  useEffect(() => {
    if (!validId) {
      return;
    }

    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setProduct(null);
      setError(null);

      try {
        const result = await getProductById(
          productId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setProduct(result.active ? result : null);

          if (!result.active) {
            setError("This product is no longer available.");
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          if (err instanceof ApiError && err.status === 404) {
            setError("Product not found or no longer available.");
          } else {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to load product details.",
            );
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => controller.abort();
  }, [productId, validId]);

  if (!validId) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Invalid product
        </h1>
        <p className="mt-3 text-gray-600">
          The requested product ID is invalid.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block font-medium text-violet-700 hover:underline"
        >
          Back to catalog
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <div role="status" className="py-20 text-center text-gray-500">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <section role="alert" className="py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Product unavailable
        </h1>

        <p className="mt-3 text-gray-600">
          {error ?? "Product not found."}
        </p>

        <Link
          to="/products"
          className="mt-6 inline-block font-medium text-violet-700 hover:underline"
        >
          Back to catalog
        </Link>
      </section>
    );
  }

  const inStock = product.stockQuantity > 0;

  return (
    <div className="space-y-8 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <Link to="/" className="hover:text-violet-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-violet-700">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-gray-900">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-slate-100">
          <span className="text-8xl" aria-hidden="true">
            {product.productFamily === "ELECTRONICS"
              ? "💻"
              : "👕"}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
            {product.category}
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            {product.name}
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            SKU: {product.sku}
          </p>

          <p className="mt-6 text-4xl font-bold text-gray-900">
            {currencyFormatter.format(product.price)}
          </p>

          <div className="mt-5">
            {inStock ? (
              <p className="font-medium text-green-700">
                In stock — {product.stockQuantity} available
              </p>
            ) : (
              <p className="font-medium text-red-700">
                Out of stock
              </p>
            )}
          </div>

          {product.description && (
            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>
          )}

          <button
            type="button"
            disabled
            title="Shopping cart functionality is coming in Issue #16"
            className="mt-8 w-full cursor-not-allowed rounded-xl bg-violet-700 px-6 py-4 font-semibold text-white opacity-60 sm:w-auto"
          >
            {inStock ? "Add to Cart — Coming Soon" : "Out of Stock"}
          </button>

          <p className="mt-2 text-xs text-gray-500">
            Shopping cart functionality will be available in a later update.
          </p>
        </div>
      </div>

      <ProductAttributes product={product} />
    </div>
  );
}
