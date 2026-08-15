import api from "../api/axios";

export interface UserCreateRequest {
  full_name: string;
  username: string;
  email: string;
  role: string;
  password: string;
  is_active: boolean;
}

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  username?: string;
  email?: string;
  role?: string;
  password?: string;
  is_active?: boolean;
}

export async function createUser(
  user: UserCreateRequest
) {
  const response = await api.post("/users", user);
  return response.data as User;
}

export async function getUsers() {
  const response = await api.get("/users");
  return response.data as User[];
}

export async function updateUser(
  id: string,
  user: UserUpdateRequest
) {
  const response = await api.put(`/users/${id}`, user);
  return response.data as User;
}

export async function deleteUser(id: string) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}
