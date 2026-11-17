
import { createContext } from "react";
import type { User, RegisterRequest } from "../types/auth";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);
