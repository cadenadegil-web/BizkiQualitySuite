import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login,
  type LoginRequest,
} from "../services/auth.service";

interface AuthContextData {
  token: string | null;
  role: string | null;
  username: string | null;
  authenticated: boolean;
  loading: boolean;

  signIn(
    credentials: LoginRequest
  ): Promise<boolean>;

  logout(): void;
}

export const AuthContext =
  createContext({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {

  const [token, setToken] =
    useState<string | null>(null);

  const [role, setRole] =
    useState<string | null>(null);

  const [username, setUsername] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const storedToken =
      localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);

      try {
        const payload = JSON.parse(
          atob(storedToken.split(".")[1])
        );
        setRole(payload.role ?? null);
        setUsername(payload.sub ?? null);
      } catch {
        setRole(null);
        setUsername(null);
      }
    }

    setLoading(false);
  }, []);

  async function signIn(
    credentials: LoginRequest
  ): Promise<boolean> {
    try {
      const response = await login(credentials);

      localStorage.setItem("token", response.access_token);
      setToken(response.access_token);

      try {
        const payload = JSON.parse(
          atob(response.access_token.split(".")[1])
        );
        setRole(payload.role ?? null);
        setUsername(payload.sub ?? null);
      } catch {
        setRole(null);
        setUsername(null);
      }

      return true;
    } catch (error: any) {
      console.error("ERROR DE LOGIN", error);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem("token");

    setToken(null);
    setRole(null);
    setUsername(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        username,
        authenticated: token !== null,
        loading,
        signIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}