import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import {
  Box,
  CircularProgress,
} from "@mui/material";

import { useAuth } from "../hooks/useAuth";
import MainLayout from "../layouts/MainLayout";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    authenticated,
    loading,
    role,
  } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.some(
      (allowedRole) =>
        role?.toLowerCase() === allowedRole.toLowerCase()
    )
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}
