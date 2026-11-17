
import { Link, useNavigate } from "react-router";

import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CartPage() {
  const {
    items,
    itemCount,
    estimatedTotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function proceedToCheckout() {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login", {
        state: { from: "/checkout" },
      });
    }
  }

  if (items.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>

        <p className="mt-3 text-gray-600">
          Explore our products and find something you like.
        </p>

        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-violet-700 px-6 py-3 font-semibold text-white"
        >
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Shopping Cart
        </h1>
        <p className="mt-2 text-gray-600">
          {itemCount} item{itemCount === 1 ? "" : "s"} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <article
              key={item.productId}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <Link
                    to={`/products/${item.productId}`}
                    className="text-lg font-semibold hover:text-violet-700"
                  >
                    {item.name}
                  </Link>

                  <p className="mt-1 text-sm text-gray-500">
                    SKU: {item.sku}
                  </p>

                  <p className="mt-2 font-medium">
                    {currency.format(item.price)} each
                  </p>
                </div>

                <p className="font-bold">
                  {currency.format(item.price * item.quantity)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-sm">Quantity</span>
                  <select
                    aria-label={`Quantity for ${item.name}`}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(
                        item.productId,
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  >
                    {Array.from(
                      {
                        length: Math.min(item.stockQuantity, 99),
                      },
                      (_, index) => index + 1,
                    ).map((quantity) => (
                      <option key={quantity} value={quantity}>
                        {quantity}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}

          <div className="flex justify-between gap-4">
            <Link to="/products" className="text-violet-700 hover:underline">
              Continue shopping
            </Link>

            <button
              type="button"
              onClick={clearCart}
              className="text-sm text-red-600 hover:underline"
            >
              Clear cart
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold">Order summary</h2>

          <div className="mt-6 flex justify-between">
            <span>Estimated total</span>
            <strong>{currency.format(estimatedTotal)}</strong>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Prices and inventory will be validated during checkout.
          </p>

          <button
            type="button"
            onClick={proceedToCheckout}
            className="mt-6 w-full rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </section>
  );
}
