import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import { useEffect, useState } from "react";

import { getEvidencesByFinding, uploadEvidence } from "../../services/evidences.service";
import api from "../../api/axios";

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

import type { Finding } from "../../types/finding";

interface Props {
  finding: Finding;
}

export default function FindingDetails({ finding }: Props) {
  const navigate = useNavigate();

  const [evidences, setEvidences] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [loadingEvidences, setLoadingEvidences] = useState(false);

  async function loadEvidences() {
    setLoadingEvidences(true);
    try {
      const data = await getEvidencesByFinding(finding.id);
      setEvidences(data);
    } catch (err) {
      console.error("Error cargando evidencias", err);
    } finally {
      setLoadingEvidences(false);
    }
  }

  useEffect(() => {
    loadEvidences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding.id]);

  async function handleUpload() {
    if (!file) {
      setSnack({ open: true, message: "Seleccione un archivo.", severity: "error" });
      return;
    }

    try {
      await uploadEvidence(finding.id, file);
      setSnack({ open: true, message: "Evidencia subida correctamente.", severity: "success" });
      setFile(null);
      await loadEvidences();
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
    }
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
        >
          Detalle del Hallazgo
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Regresar
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/findings/edit/${finding.id}`)}
          >
            Editar
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Código
              </Typography>

              <Typography variant="h6">
                {finding.code}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Estado
              </Typography>

              <Chip
                label={finding.active ? "Activo" : "Inactivo"}
                color={finding.active ? "success" : "default"}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Proceso
              </Typography>

              <Typography>
                {finding.process}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Tipo
              </Typography>

              <Typography>
                {finding.finding_type}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Responsable
              </Typography>

              <Typography>
                {finding.responsible}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Fecha
              </Typography>

              <Typography>
                {formatDate(finding.created_at)}
              </Typography>
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid size={12}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Descripción
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  whiteSpace: "pre-line",
                }}
              >
                {finding.description}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
          >
            Evidencias
          </Typography>

          {evidences.length === 0 ? (
            <Typography color="text.secondary">No hay evidencias asociadas.</Typography>
          ) : (
            <List>
              {evidences.map((e) => (
                <ListItem key={e.id} divider secondaryAction={
                  <IconButton component="a" href={`${api.defaults.baseURL}/evidences/download/${e.id}`} target="_blank" rel="noreferrer">
                    <DownloadIcon />
                  </IconButton>
                }>
                  <ListItemText
                    primary={e.original_name}
                    secondary={`Tipo: ${e.extension || "n/a"} — Tamaño: ${formatFileSize(e.file_size)} — Subido: ${formatDate(e.created_at)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>
              Seleccionar
              <input type="file" hidden onChange={(ev) => setFile(ev.target.files?.[0] ?? null)} />
            </Button>

            <Button variant="contained" onClick={handleUpload} disabled={!file}>
              Adjuntar Evidencia
            </Button>
          </Box>

          <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            <Alert severity={snack.severity} sx={{ width: "100%" }}>
              {snack.message}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
          >
            Acción Correctiva (CAPA)
          </Typography>

          <Typography color="text.secondary">
            Este hallazgo aún no posee una CAPA asociada.
          </Typography>

          <Button
            sx={{ mt: 2 }}
            variant="contained"
            startIcon={<AssignmentTurnedInIcon />}
            onClick={() => navigate(`/capas/new/${finding.id}`)}
          >
            Generar CAPA
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}