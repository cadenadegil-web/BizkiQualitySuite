import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";

import { useEvidences } from "../../hooks/useEvidences";
import { useFindings } from "../../hooks/useFindings";
import { uploadEvidence } from "../../services/evidences.service";

function formatFileSize(value: number) {
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${value} B`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function EvidencesPage() {
  const [searchParams] = useSearchParams();
  const { data, isLoading, error, refetch } = useEvidences();
  const { data: findings, isLoading: findingsLoading } = useFindings();

  const [findingId, setFindingId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const selectedFindingId = searchParams.get("findingId") ?? "";

    if (selectedFindingId && selectedFindingId !== findingId) {
      setFindingId(selectedFindingId);
    }
  }, [searchParams, findingId]);

  const selectedFinding = (findings ?? []).find((finding: any) => finding.id === findingId);

  async function handleUpload() {
    if (!findingId) {
      setSnack({ open: true, message: "Seleccione un hallazgo.", severity: "error" });
      return;
    }

    if (!file) {
      setSnack({ open: true, message: "Seleccione un archivo.", severity: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await uploadEvidence(findingId, file);
      setSnack({ open: true, message: "Evidencia subida correctamente.", severity: "success" });
      setFile(null);
      setFindingId("");
      await refetch();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = err?.message || "Error subiendo evidencia.";

      if (detail) {
        if (Array.isArray(detail)) {
          message = detail.map((d) => d?.msg || JSON.stringify(d)).join("; ");
        } else if (typeof detail === "string") {
          message = detail;
        } else {
          message = JSON.stringify(detail);
        }
      }

      setSnack({ open: true, message, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Evidencias
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Subir evidencia a un hallazgo.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              select
              label="Hallazgo"
              value={findingId}
              onChange={(e) => setFindingId(e.target.value)}
              sx={{ minWidth: 240 }}
              helperText={findingsLoading ? "Cargando hallazgos..." : "Selecciona un hallazgo para adjuntar la evidencia."}
            >
              <MenuItem value="">Seleccione un hallazgo</MenuItem>
              {(findings ?? []).map((finding: any) => (
                <MenuItem key={finding.id} value={finding.id}>
                  {finding.title ?? finding.name ?? finding.id}
                </MenuItem>
              ))}
            </TextField>

            {selectedFinding ? (
              <Typography sx={{ minWidth: 240, color: "text.secondary" }}>
                Hallazgo seleccionado: {selectedFinding.code ?? selectedFinding.id}
              </Typography>
            ) : null}

            <Button variant="outlined" component="label">
              Seleccionar archivo
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>

            <Button variant="contained" onClick={handleUpload} disabled={submitting || findingsLoading}>
              Subir
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Lista de evidencias
      </Typography>

      <Card>
        <CardContent>
          {isLoading ? (
            <Typography>Cargando...</Typography>
          ) : error ? (
            <Typography color="error">Error cargando evidencias.</Typography>
          ) : (
            <List>
              {(data ?? []).map((e: any) => (
                <ListItem key={e.id} divider>
                  <ListItemText
                    primary={e.original_name}
                    secondary={`Tipo: ${e.extension || "n/a"} — Tamaño: ${formatFileSize(e.file_size)} — Fecha: ${formatDate(e.created_at)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
