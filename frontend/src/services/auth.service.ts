import api from "../api/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    credentials
  );

  return response.data;
}