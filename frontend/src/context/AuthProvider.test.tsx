
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthProvider from "./AuthProvider";
import { useAuth } from "../hooks/useAuth";
import { loginUser, getCurrentUser, registerUser } from "../api/auth";

vi.mock("../api/auth", () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  registerUser: vi.fn(),
}));

const mockedLogin = vi.mocked(loginUser);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedRegister = vi.mocked(registerUser);

const customer = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  role: "CUSTOMER" as const,
};

function AuthTestConsumer() {
  const { user, token, isAuthenticated, login, register, logout } =
    useAuth();

  return (
    <div>
      <p>{isAuthenticated ? "Authenticated" : "Anonymous"}</p>
      <p>{user?.email ?? "No user"}</p>
      <p>{token ?? "No token"}</p>

      <button
        onClick={() => void login("jane@example.com", "Password123!")}
      >
        Login
      </button>

      <button
        onClick={() => void register({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          password: "Password123!",
        })}
      >
        Register
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockedLogin.mockResolvedValue({
    accessToken: "test-jwt-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    userId: 1,
    email: customer.email,
    role: "CUSTOMER",
  });

  mockedGetCurrentUser.mockResolvedValue(customer);
  mockedRegister.mockResolvedValue(customer);
});

describe("AuthProvider", () => {
  it("starts unauthenticated", () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("No token")).toBeInTheDocument();
  });

  it("authenticates a user after login", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Authenticated")).toBeInTheDocument();
    });

    expect(screen.getByText(customer.email)).toBeInTheDocument();
    expect(screen.getByText("test-jwt-token")).toBeInTheDocument();
    expect(mockedGetCurrentUser).toHaveBeenCalledWith("test-jwt-token");
  });

  it("clears authentication state on logout", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await screen.findByText("Authenticated");

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("No token")).toBeInTheDocument();
  });

  it("registers and automatically logs in a customer", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(screen.getByText("Authenticated")).toBeInTheDocument();
    });

    expect(mockedRegister).toHaveBeenCalledOnce();
    expect(mockedLogin).toHaveBeenCalledOnce();
  });
});
