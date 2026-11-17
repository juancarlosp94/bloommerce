
import { Link, NavLink, Outlet } from "react-router";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-violet-700"
          >
            Bloommerce
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "text-violet-700"
                  : "text-gray-600 hover:text-violet-700"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive
                  ? "text-violet-700"
                  : "text-gray-600 hover:text-violet-700"
              }
            >
              Products
            </NavLink>

            <span className="text-gray-400">
              Cart
            </span>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <Outlet />
      </main>
    </div>
  );
}
