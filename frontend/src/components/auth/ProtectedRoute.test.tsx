
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";

import type { AuthContextValue } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

function renderRoute(
  authenticated: boolean,
  role: UserRole = "CUSTOMER",
  allowedRoles?: UserRole[],
) {
  const context: AuthContextValue = {
    user: authenticated
      ? {
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          role,
        }
      : null,
    token: authenticated ? "test-token" : null,
    isAuthenticated: authenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/forbidden" element={<p>Access denied</p>} />

          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/account" element={<p>Account page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    renderRoute(false);

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Account page")).not.toBeInTheDocument();
  });

  it("allows authenticated customers", () => {
    renderRoute(true);

    expect(screen.getByText("Account page")).toBeInTheDocument();
  });

  it("denies customers access to admin-only routes", () => {
    renderRoute(true, "CUSTOMER", ["ADMIN"]);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("Account page")).not.toBeInTheDocument();
  });

  it("allows admins to access admin-only routes", () => {
    renderRoute(true, "ADMIN", ["ADMIN"]);

    expect(screen.getByText("Account page")).toBeInTheDocument();
  });

  it("allows both roles when explicitly permitted", () => {
    renderRoute(true, "CUSTOMER", ["CUSTOMER", "ADMIN"]);

    expect(screen.getByText("Account page")).toBeInTheDocument();
  });
});
