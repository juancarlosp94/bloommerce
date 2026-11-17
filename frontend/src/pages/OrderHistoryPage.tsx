import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getOrders } from "../api/orders";
import { useAuth } from "../hooks/useAuth";

import type { OrderPage } from "../types/order";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function OrderHistoryPage() {
  const { token } = useAuth();

  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
useEffect(() => {
  if (!token) return;

  let cancelled = false;

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      const result = await getOrders(token!, page);

      if (!cancelled) {
        setOrders(result);
      }
    } catch (err) {
      if (!cancelled) {
        setOrders(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your orders.",
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadOrders();

  return () => {
    cancelled = true;
  };
}, [token, page]);


  return (
    <section className="mx-auto max-w-4xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          My Orders
        </h1>

        <p className="mt-2 text-gray-600">
          Review your purchase history.
        </p>
      </header>

      {loading && (
        <p role="status" className="py-12 text-center text-gray-500">
          Loading orders...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && orders?.empty && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold">
            No orders yet
          </h2>

          <p className="mt-2 text-gray-600">
            Your orders will appear here after checkout.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            Start shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders && !orders.empty && (
        <>
          <p className="text-sm text-gray-500">
            {orders.totalElements} orders found
          </p>

          <div className="space-y-4">
            {orders.content.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      Order #{order.id}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>

                    <p className="mt-2 text-sm">
                      Status:{" "}
                      <span className="font-semibold">
                        {order.status}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {currency.format(order.totalAmount)}
                    </p>

                    <Link
                      to={`/orders/${order.id}`}
                      className="mt-2 inline-block font-medium text-violet-700 hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {orders.totalPages > 1 && (
            <nav
              aria-label="Order history pagination"
              className="flex items-center justify-center gap-5"
            >
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page + 1} of {orders.totalPages}
              </span>

              <button
                type="button"
                disabled={page + 1 >= orders.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
