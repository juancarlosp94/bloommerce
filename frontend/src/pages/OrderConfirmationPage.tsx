import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import { getOrderById } from "../api/orders";
import { useAuth } from "../hooks/useAuth";

import type { Order } from "../types/order";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const location = useLocation();

  const initialOrder = (
    location.state as { order?: Order } | null
  )?.order;

  const orderId = Number(id);
  const validId =
    id !== undefined &&
    /^\d+$/.test(id) &&
    Number.isSafeInteger(orderId) &&
    orderId > 0;

  const [order, setOrder] = useState<Order | null>(
    validId && initialOrder?.id === orderId
      ? initialOrder
      : null,
  );

  const [loading, setLoading] = useState(
    !initialOrder || initialOrder.id !== orderId,
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !validId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getOrderById(orderId, token!);

        if (!cancelled) setOrder(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load order.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [orderId, token, validId]);

  if (!validId) {
    return <p role="alert" className="py-16">Invalid order ID.</p>;
  }

  if (loading && !order) {
    return (
      <p role="status" className="py-16">
        Loading order confirmation...
      </p>
    );
  }

  if (!order) {
    return (
      <section className="py-16">
        <h1 className="text-2xl font-bold">Order unavailable</h1>
        <p role="alert" className="mt-3 text-red-700">
          {error ?? "Order not found."}
        </p>
        <Link to="/orders" className="mt-4 inline-block text-violet-700">
          View order history
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 py-14">
      <header className="text-center">
        <div className="text-5xl" aria-hidden="true">✓</div>

        <h1 className="mt-4 text-3xl font-bold">
          Order confirmed!
        </h1>

        <p className="mt-2 text-gray-600">
          Your order #{order.id} has been created successfully.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Order number</p>
            <p className="font-bold">#{order.id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-semibold">{order.status}</p>
          </div>
        </div>

        <h2 className="mt-8 text-xl font-semibold">
          Purchased items
        </h2>

        <div className="mt-4 divide-y divide-gray-100">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × {currency.format(item.unitPrice)}
                </p>
              </div>

              <p className="font-semibold">
                {currency.format(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-between border-t pt-5">
          <span className="font-semibold">Confirmed total</span>
          <strong className="text-2xl text-violet-700">
            {currency.format(order.totalAmount)}
          </strong>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not refresh order details: {error}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to={`/orders/${order.id}`}
          className="rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white"
        >
          View order details
        </Link>

        <Link
          to="/orders"
          className="rounded-lg border border-gray-300 px-5 py-3"
        >
          Order history
        </Link>

        <Link
          to="/products"
          className="rounded-lg border border-gray-300 px-5 py-3"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
