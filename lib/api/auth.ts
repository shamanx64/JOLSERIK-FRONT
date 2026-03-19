import { apiFetch, clearStoredTokens, getStoredRefreshToken, storeTokens } from "./client";
import type { LoginResponse, MessageResponse, SessionListResponse, UserResponse } from "./types";

export async function register(full_name: string, email: string, password: string) {
  return apiFetch<UserResponse>("/api/v1/public/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password }),
  });
}

export async function login(email: string, password: string) {
  const payload = await apiFetch<LoginResponse>("/api/v1/public/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await storeTokens(payload.tokens);
  return payload;
}

export async function refreshTokens() {
  const refresh_token = await getStoredRefreshToken();

  if (!refresh_token) {
    await clearStoredTokens();
    throw new Error("No refresh token available.");
  }

  const payload = await apiFetch<LoginResponse>("/api/v1/public/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });

  await storeTokens(payload.tokens);
  return payload;
}

export async function getMe() {
  return apiFetch<UserResponse>("/api/v1/user/auth/me", { auth: true });
}

export async function logout() {
  const refresh_token = await getStoredRefreshToken();

  try {
    if (refresh_token) {
      await apiFetch<MessageResponse>("/api/v1/user/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token }),
        auth: true,
      });
    }
  } finally {
    await clearStoredTokens();
  }
}

export async function logoutAll() {
  try {
    await apiFetch<MessageResponse>("/api/v1/user/auth/logout-all", {
      method: "POST",
      auth: true,
    });
  } finally {
    await clearStoredTokens();
  }
}

export async function listSessions() {
  return apiFetch<SessionListResponse>("/api/v1/user/auth/sessions", {
    auth: true,
  });
}
