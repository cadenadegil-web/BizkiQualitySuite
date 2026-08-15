import { Routes, Route } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";

import DashboardPage from "../pages/Dashboard/DashboardPage";

import FindingsPage from "../pages/Findings/FindingsPage";
import FindingViewPage from "../pages/Findings/FindingViewPage";
import FindingEditPage from "../pages/Findings/FindingEditPage";
import EvidencesPage from "../pages/Evidences/EvidencesPage";
import CapasPage from "../pages/Capas/CapasPage";
import NewCapaPage from "../pages/Capas/NewCapaPage";
import UsersPage from "../pages/Users/UsersPage";
import CatalogsPage from "../pages/Catalogs/CatalogsPage";

import ProtectedRoute from "./ProtectedRoute";

import AuditsPage from '../pages/Audits/AuditsPage';
import AuditFormPage from '../pages/Audits/AuditFormPage';
import AuditDetailPage from '../pages/Audits/AuditDetailPage';
export default function AppRoutes() {

  return (

    <Routes>

      <Route
        path="/"
        element={<LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/findings"
        element={
          <ProtectedRoute>
            <FindingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/findings/:id"
        element={
          <ProtectedRoute>
            <FindingViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/findings/edit/:id"
        element={
          <ProtectedRoute>
            <FindingEditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/evidences"
        element={
          <ProtectedRoute>
            <EvidencesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/capas"
        element={
          <ProtectedRoute>
            <CapasPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/capas/new"
        element={
          <ProtectedRoute>
            <NewCapaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/capas/new/:findingId"
        element={
          <ProtectedRoute>
            <NewCapaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "administrador"]}
          >
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalogs"
        element={
          <ProtectedRoute>
            <CatalogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audits"
        element={
          <ProtectedRoute>
            <AuditsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audits/new"
        element={
          <ProtectedRoute>
            <AuditFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audits/:id"
        element={
          <ProtectedRoute>
            <AuditDetailPage />
          </ProtectedRoute>
        }
      />

    </Routes>

  );
}