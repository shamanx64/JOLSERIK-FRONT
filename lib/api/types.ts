export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  tokens: TokenPairResponse;
  user: UserResponse;
}

export interface MessageResponse {
  message: string;
}

export interface SessionResponse {
  id: string;
  jti: string;
  is_revoked: boolean;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

export interface SessionListResponse {
  items: SessionResponse[];
}

export interface HealthResponse {
  status: string;
  db: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: unknown;
}
