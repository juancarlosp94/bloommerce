
import { Link } from "react-router";

export default function ForbiddenPage() {
  return (
    <main className="py-20 text-center">
      <h1 className="text-3xl font-bold">403 — Access denied</h1>

      <p className="mt-3 text-gray-600">
        You don't have permission to access this page.
      </p>

      <Link
        to="/products"
        className="mt-6 inline-block font-medium text-violet-700"
      >
        Back to products
      </Link>
    </main>
  );
}
