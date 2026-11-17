import { Link, Outlet } from "react-router";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4">
        <nav className="mx-auto flex max-w-6xl justify-between">
          <Link to="/" className="text-xl font-bold">
            Bloommerce
          </Link>
          <span>Cart</span>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}