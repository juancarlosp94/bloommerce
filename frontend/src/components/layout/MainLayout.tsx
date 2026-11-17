
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-5">
          <Link to="/" className="text-2xl font-bold text-violet-700">
            Bloommerce
          </Link>

          <div className="flex flex-wrap items-center gap-5">
            <NavLink to="/" className="hover:text-violet-700">
              Home
            </NavLink>

            <NavLink to="/products" className="hover:text-violet-700">
              Products
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/account"
                  className="hover:text-violet-700"
                >
                  {user?.firstName ?? "Account"}
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hover:text-violet-700"
                >
                  Login
                </NavLink>

                <Link
                  to="/register"
                  className="rounded-lg bg-violet-700 px-4 py-2 text-white"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-6">
        <Outlet />
      </div>
    </div>
  );
}
