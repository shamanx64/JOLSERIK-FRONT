import { apiFetch } from "./client";
import type { UserResponse } from "./types";

export async function getProfile() {
  return apiFetch<UserResponse>("/api/v1/user/profile", {
    auth: true,
  });
}

export async function updateProfile(full_name: string) {
  return apiFetch<UserResponse>("/api/v1/user/profile", {
    method: "PATCH",
    body: JSON.stringify({ full_name }),
    auth: true,
  });
}
