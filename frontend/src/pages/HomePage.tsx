
import { Link } from "react-router";

export default function HomePage() {
  return (
    <section className="py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
        Welcome to Bloommerce
      </p>

      <h1 className="mt-4 text-5xl font-bold text-gray-900">
        Discover something great.
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
        Explore our collection of electronics, clothing,
        and everyday essentials.
      </p>

      <Link
        to="/products"
        className="mt-8 inline-block rounded-xl bg-violet-700 px-8 py-4 font-semibold text-white transition hover:bg-violet-800"
      >
        Explore Products
      </Link>
    </section>
  );
}
