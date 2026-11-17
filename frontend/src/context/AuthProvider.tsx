
import { useState, type ReactNode } from "react";

import { getCurrentUser, loginUser, registerUser } from "../api/auth";
import { AuthContext } from "./AuthContext";

import type { User, RegisterRequest } from "../types/auth";

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function login(email: string, password: string) {
    const result = await loginUser({ email, password });

    try {
      const profile = await getCurrentUser(result.accessToken);
      setUser(profile);
      setToken(result.accessToken);
    } catch (error) {
      setUser(null);
      setToken(null);
      throw error;
    }
  }

  async function register(data: RegisterRequest) {
    await registerUser(data);
    await login(data.email, data.password);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null && token !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
