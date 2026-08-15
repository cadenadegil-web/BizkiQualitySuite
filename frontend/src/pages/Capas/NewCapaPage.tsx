import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar, AlertColor } from "@mui/material";
import CapaForm from "./CapaForm";
import { createCapa, getCapa } from "../../services/capas.service";
import { getFinding } from "../../services/findings.service";

export default function NewCapaPage() {
  const navigate = useNavigate();
  const { findingId } = useParams();
  const [finding, setFinding] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    async function load() {
      if (!findingId) return;
      setLoading(true);
      try {
        const data = await getFinding(findingId);
        setFinding(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || "No se pudo cargar el hallazgo.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [findingId]);

  async function handleSubmit(values: any) {
    try {
      await createCapa({
        finding_id: findingId,
        ...values,
      });
      navigate("/capas");
    } catch (err: any) {
      setSnack({ open: true, message: err?.response?.data?.detail || err?.message || "Error creando CAPA.", severity: "error" });
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <h2>Crear CAPA</h2>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          {finding && (
            <Alert severity="info">
              Creando CAPA para el hallazgo: <strong>{finding.code || finding.id}</strong> — {finding.description?.slice(0, 120)}
            </Alert>
          )}

          <CapaForm defaultValues={{}} onSubmit={handleSubmit} />
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
