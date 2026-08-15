import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";

import { BrowserRouter } from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import App from "./App";
import theme from "./theme/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <AuthProvider>
            <App />
          </AuthProvider>

        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);