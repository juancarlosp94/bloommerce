import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getOrderById } from "../api/orders";
import { ApiError } from "../api/http";
import { useAuth } from "../hooks/useAuth";

import type { Order } from "../types/order";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const orderId = Number(id);
  const validId =
    id !== undefined &&
    /^\d+$/.test(id) &&
    Number.isSafeInteger(orderId) &&
    orderId > 0;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !validId) return;

    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      setError(null);
      setOrder(null);

      try {
        const result = await getOrderById(orderId, token!);

        if (!cancelled) {
          setOrder(result);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError("Order not found.");
          } else if (
            err instanceof ApiError &&
            err.status === 403
          ) {
            setError("You don't have access to this order.");
          } else {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to load order details.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, token, validId]);

  if (!validId) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-2xl font-bold">Invalid order ID</h1>
        <Link to="/orders" className="mt-4 inline-block text-violet-700">
          Back to orders
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <p role="status" className="py-16 text-center">
        Loading order details...
      </p>
    );
  }

  if (error || !order) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-2xl font-bold">Order unavailable</h1>

        <p role="alert" className="mt-3 text-red-700">
          {error ?? "Order not found."}
        </p>

        <Link
          to="/orders"
          className="mt-5 inline-block text-violet-700"
        >
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8 py-12">
      <Link
        to="/orders"
        className="text-sm font-medium text-violet-700 hover:underline"
      >
        ← Back to order history
      </Link>

      <header>
        <h1 className="text-3xl font-bold">
          Order #{order.id}
        </h1>

        <p className="mt-2 text-gray-600">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>

        <p className="mt-2 text-sm">
          Status:{" "}
          <span className="font-semibold text-violet-700">
            {order.status}
          </span>
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold">
            Purchased items
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <article
              key={item.productId}
              className="flex flex-wrap justify-between gap-5 p-6"
            >
              <div>
                <h3 className="font-semibold">
                  {item.productName}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  SKU: {item.sku}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Historical unit price:{" "}
                  {currency.format(item.unitPrice)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Subtotal
                </p>

                <p className="mt-1 font-bold">
                  {currency.format(item.subtotal)}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-between border-t border-gray-200 bg-gray-50 p-6">
          <span className="font-semibold">
            Confirmed order total
          </span>

          <strong className="text-2xl text-violet-700">
            {currency.format(order.totalAmount)}
          </strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          to="/products"
          className="rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white"
        >
          Continue shopping
        </Link>

        <Link
          to="/orders"
          className="rounded-lg border border-gray-300 px-5 py-3"
        >
          Order history
        </Link>
      </div>
    </section>
  );
}
