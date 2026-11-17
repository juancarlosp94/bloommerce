
import { apiRequest } from "./http";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

export function registerUser(
  data: RegisterRequest,
): Promise<User> {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: data,
  });
}

export function loginUser(
  data: LoginRequest,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  });
}

export function getCurrentUser(
  token: string,
): Promise<User> {
  return apiRequest<User>("/auth/me", { token });
}
