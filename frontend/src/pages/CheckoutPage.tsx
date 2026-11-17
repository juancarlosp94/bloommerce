import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { getProductById } from "../api/products";
import { createOrder } from "../api/orders";
import { ApiError } from "../api/http";

import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CheckoutPage() {
  const { items, estimatedTotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  async function handleCheckout() {
    if (submitting.current || items.length === 0 || !token) {
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      // Refresh product availability before sending the order.
      const latestProducts = await Promise.all(
        items.map((item) => getProductById(item.productId)),
      );

      for (const item of items) {
        const latest = latestProducts.find(
          (product) => product.id === item.productId,
        );

        if (
          !latest ||
          !latest.active ||
          latest.stockQuantity < item.quantity
        ) {
          throw new Error(
            `${item.name} is unavailable or has insufficient stock. ` +
            "Please review your cart.",
          );
        }
      }

      // Never send client-side prices or totals.
      const order = await createOrder(
        {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
        token,
      );

      clearCart();

      navigate(`/order-confirmation/${order.id}`, {
        replace: true,
        state: { order },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(
            "Your session has expired. Please log in again.",
          );
        } else if (err.status === 400 || err.status === 409) {
          setError(
            "Checkout could not be completed. " +
            "Please review product availability and quantities. " +
            err.message,
          );
        } else {
          setError(err.message);
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong during checkout.",
        );
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-bold">
          No items to checkout
        </h1>

        <p className="mt-3 text-gray-600">
          Add some products to your cart first.
        </p>

        <Link
          to="/products"
          className="mt-6 inline-block text-violet-700 underline"
        >
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>
        <p className="mt-2 text-gray-600">
          Review your order before confirming your purchase.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Order items
        </h2>

        <div className="mt-5 divide-y divide-gray-100">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between gap-4 py-4"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>

              <p className="font-medium">
                {currency.format(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-between border-t pt-5">
          <span className="font-medium">Estimated total</span>
          <strong className="text-xl">
            {currency.format(estimatedTotal)}
          </strong>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Final prices and availability are confirmed by the server.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
          <Link
            to="/cart"
            className="mt-2 block font-semibold underline"
          >
            Review cart
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/cart"
          className="font-medium text-violet-700 hover:underline"
        >
          Back to cart
        </Link>

        <button
          type="button"
          onClick={() => void handleCheckout()}
          disabled={loading || !token}
          className="rounded-lg bg-violet-700 px-8 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing order..." : "Place order"}
        </button>
      </div>
    </section>
  );
}
