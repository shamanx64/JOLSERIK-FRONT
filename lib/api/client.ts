import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ApiError, LoginResponse, TokenPairResponse } from "./types";

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  auth?: boolean;
  headers?: Record<string, string>;
  retryOnAuthFailure?: boolean;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

let authFailureHandler: (() => void) | null = null;
const memoryStorage = new Map<string, string>();
let canUseNativeStorage = true;

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function setAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler;
}

function readBrowserStorage(key: string) {
  const browserStorage = (globalThis as { localStorage?: BrowserStorage }).localStorage;

  if (!browserStorage) {
    return null;
  }

  try {
    return browserStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeBrowserStorage(key: string, value: string) {
  const browserStorage = (globalThis as { localStorage?: BrowserStorage }).localStorage;

  if (!browserStorage) {
    return;
  }

  try {
    browserStorage.setItem(key, value);
  } catch {
    // Fall back to memory only.
  }
}

function removeBrowserStorage(key: string) {
  const browserStorage = (globalThis as { localStorage?: BrowserStorage }).localStorage;

  if (!browserStorage) {
    return;
  }

  try {
    browserStorage.removeItem(key);
  } catch {
    // Fall back to memory only.
  }
}

async function safeGetItem(key: string) {
  if (canUseNativeStorage) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      canUseNativeStorage = false;
    }
  }

  return memoryStorage.get(key) ?? readBrowserStorage(key);
}

async function safeSetItem(key: string, value: string) {
  if (canUseNativeStorage) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      canUseNativeStorage = false;
    }
  }

  memoryStorage.set(key, value);
  writeBrowserStorage(key, value);
}

async function safeRemoveItem(key: string) {
  if (canUseNativeStorage) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      canUseNativeStorage = false;
    }
  }

  memoryStorage.delete(key);
  removeBrowserStorage(key);
}

export async function getStoredAccessToken() {
  return safeGetItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return safeGetItem(REFRESH_TOKEN_KEY);
}

export async function storeTokens(tokens: TokenPairResponse) {
  await safeSetItem(ACCESS_TOKEN_KEY, tokens.access_token);
  await safeSetItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export async function clearStoredTokens() {
  await safeRemoveItem(ACCESS_TOKEN_KEY);
  await safeRemoveItem(REFRESH_TOKEN_KEY);
}

function normalizeError(status: number, payload: unknown): ApiError {
  const fallbackMessage =
    status === 0
      ? "Unable to reach the server. Check the API URL and your network connection."
      : "Request failed.";

  if (payload && typeof payload === "object") {
    const candidate = payload as Partial<ApiError>;

    return {
      status,
      code: typeof candidate.code === "string" ? candidate.code : status === 0 ? "network_error" : "request_failed",
      message: typeof candidate.message === "string" ? candidate.message : fallbackMessage,
      details: "details" in candidate ? candidate.details ?? null : payload,
    };
  }

  if (typeof payload === "string" && payload.trim()) {
    return {
      status,
      code: status === 0 ? "network_error" : "request_failed",
      message: payload,
      details: null,
    };
  }

  return {
    status,
    code: status === 0 ? "network_error" : "request_failed",
    message: fallbackMessage,
    details: null,
  };
}

function asApiError(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    return error as ApiError;
  }

  return normalizeError(0, null);
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function performRequest<T>(path: string, options: ApiFetchOptions, accessToken?: string | null) {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw normalizeError(0, null);
  }

  if (!response.ok) {
    throw normalizeError(response.status, await parseResponseBody(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseResponseBody(response)) as T;
}

async function refreshAccessToken() {
  const refreshToken = await getStoredRefreshToken();

  if (!refreshToken) {
    await clearStoredTokens();
    return null;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/api/v1/public/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    throw normalizeError(0, null);
  }

  if (!response.ok) {
    await clearStoredTokens();
    return null;
  }

  const payload = (await parseResponseBody(response)) as LoginResponse | null;

  if (!payload?.tokens) {
    await clearStoredTokens();
    return null;
  }

  await storeTokens(payload.tokens);
  return payload.tokens.access_token;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const { auth = false, retryOnAuthFailure = true, ...requestOptions } = options;
  const accessToken = auth ? await getStoredAccessToken() : null;

  try {
    return await performRequest<T>(path, requestOptions, accessToken);
  } catch (error) {
    const apiError = asApiError(error);

    if (!auth || !retryOnAuthFailure || apiError.status !== 401) {
      throw apiError;
    }

    const nextAccessToken = await refreshAccessToken();

    if (!nextAccessToken) {
      authFailureHandler?.();
      throw apiError;
    }

    return performRequest<T>(path, requestOptions, nextAccessToken);
  }
}
