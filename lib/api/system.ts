import { apiFetch } from "./client";
import type { HealthResponse } from "./types";

export async function getHealth() {
  return apiFetch<HealthResponse>("/health");
}
