import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 120000, // 120 segundos (2 min) para permitir el despertar (cold start) de Render gratis
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:expired"));
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.toLowerCase().includes("timeout")
    ) {
      error.message =
        "El servidor tardó en responder (arranque en frío o modo reposo). Por favor, intenta de nuevo.";
    } else if (!error.response && error.message === "Network Error") {
      error.message =
        "No se pudo conectar con el backend. Verifica tu conexión o el estado del servicio.";
    }
    return Promise.reject(error);
  }
);

export default api;
