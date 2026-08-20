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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useEffect, useState } from "react";

import {
  getEvidencesByFinding,
  uploadEvidence,
  getEvidencesByCapa,
  uploadCapaEvidence,
} from "../../services/evidences.service";
import {
  getCapasByFinding,
  updateCapa,
} from "../../services/capas.service";
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

  // Estados del Plan de Acción Correctiva (CAP)
  const [capas, setCapas] = useState<any[]>([]);
  const [capaEvidences, setCapaEvidences] = useState<any[]>([]);
  const [fileCapa, setFileCapa] = useState<File | null>(null);
  const [loadingCapaEvidences, setLoadingCapaEvidences] = useState(false);

  // Estados del Diálogo de Eficacia (Cierre)
  const [openEffectivenessDialog, setOpenEffectivenessDialog] = useState(false);
  const [effectivenessReview, setEffectivenessReview] = useState("");
  const [effectivenessDate, setEffectivenessDate] = useState(new Date().toISOString().slice(0, 10));
  const [submittingCierre, setSubmittingCierre] = useState(false);

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

  async function loadCapaEvidences(capaId: string) {
    setLoadingCapaEvidences(true);
    try {
      const data = await getEvidencesByCapa(capaId);
      setCapaEvidences(data);
    } catch (err) {
      console.error("Error cargando evidencias del CAP", err);
    } finally {
      setLoadingCapaEvidences(false);
    }
  }

  async function loadCapas() {
    try {
      const data = await getCapasByFinding(finding.id);
      setCapas(data);
      if (data && data.length > 0) {
        await loadCapaEvidences(data[0].id);
      }
    } catch (err) {
      console.error("Error cargando capas", err);
    }
  }

  useEffect(() => {
    loadEvidences();
    loadCapas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding.id]);

  async function handleCapaUpload(capaId: string) {
    if (!fileCapa) {
      setSnack({ open: true, message: "Seleccione un archivo de evidencia.", severity: "error" });
      return;
    }

    try {
      await uploadCapaEvidence(capaId, fileCapa);
      setSnack({ open: true, message: "Evidencia del CAP subida correctamente.", severity: "success" });
      setFileCapa(null);
      await loadCapaEvidences(capaId);
    } catch (err: any) {
      setSnack({ open: true, message: err?.response?.data?.detail || err?.message || "Error subiendo evidencia del CAP.", severity: "error" });
    }
  }

  async function handleCierreCapa(capaId: string) {
    if (!effectivenessReview.trim()) {
      setSnack({ open: true, message: "La revisión de eficacia es obligatoria para el cierre.", severity: "error" });
      return;
    }

    setSubmittingCierre(true);
    try {
      await updateCapa(capaId, {
        effectiveness_review: effectivenessReview,
        effectiveness_date: effectivenessDate,
        status: "CERRADA",
        completion_date: new Date().toISOString().slice(0, 10),
      });
      setSnack({ open: true, message: "Plan de Acción cerrado y verificado con éxito.", severity: "success" });
      setOpenEffectivenessDialog(false);
      await loadCapas();
    } catch (err: any) {
      setSnack({ open: true, message: err?.response?.data?.detail || err?.message || "Error al registrar el cierre del CAP.", severity: "error" });
    } finally {
      setSubmittingCierre(false);
    }
  }

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
          Detalle de la No Conformidad
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

      {capas.length === 0 ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
            >
              Plan de Acción Correctiva (CAP)
            </Typography>

            <Typography color="text.secondary">
              Esta no conformidad aún no posee un Plan de Acción Correctiva (CAP) asociado.
            </Typography>

            <Button
              sx={{ mt: 2 }}
              variant="contained"
              startIcon={<AssignmentTurnedInIcon />}
              onClick={() => navigate(`/capas/new/${finding.id}`)}
            >
              Generar Plan de Acción (CAP)
            </Button>
          </CardContent>
        </Card>
      ) : (() => {
        const capa = capas[0];
        return (
          <>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Plan de Acción Correctiva (CAP) — {capa.code}
                  </Typography>
                  <Chip
                    label={capa.status}
                    color={capa.status === "CERRADA" ? "default" : capa.status === "EN PROCESO" ? "warning" : "primary"}
                  />
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Título</Typography>
                    <Typography>{capa.title}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Responsable</Typography>
                    <Typography>{capa.responsible}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Tipo de acción</Typography>
                    <Typography>{capa.action_type}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Prioridad</Typography>
                    <Typography>{capa.priority}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Fecha objetivo</Typography>
                    <Typography>{formatDate(capa.target_date)}</Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" color="text.secondary">Descripción / Plan de Acción</Typography>
                    <Typography sx={{ whiteSpace: "pre-line", mt: 0.5 }}>{capa.description}</Typography>
                  </Grid>
                  {capa.comments && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary">Comentarios</Typography>
                      <Typography sx={{ whiteSpace: "pre-line", mt: 0.5 }}>{capa.comments}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Evidencias de la Acción Correctiva
                </Typography>

                {capaEvidences.length === 0 ? (
                  <Typography color="text.secondary">No hay evidencias asociadas al plan.</Typography>
                ) : (
                  <List>
                    {capaEvidences.map((e) => (
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

                {capa.status !== "CERRADA" && (
                  <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
                    <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>
                      Seleccionar Archivo
                      <input type="file" hidden onChange={(ev) => setFileCapa(ev.target.files?.[0] ?? null)} />
                    </Button>
                    <Button variant="contained" onClick={() => handleCapaUpload(capa.id)} disabled={!fileCapa}>
                      Adjuntar a la Acción
                    </Button>
                    {fileCapa && <Typography variant="body2">{fileCapa.name}</Typography>}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 3, borderLeft: "5px solid #2e7d32" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TaskAltIcon color="success" /> Verificación de Eficacia (FSSC 22000 V7)
                </Typography>

                {capa.status === "CERRADA" ? (
                  <Box sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="subtitle2" color="text.secondary">Análisis y Verificación de Eficacia</Typography>
                        <Typography sx={{ whiteSpace: "pre-line", mt: 0.5 }}>{capa.effectiveness_review}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Fecha de Verificación</Typography>
                        <Typography>{formatDate(capa.effectiveness_date)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Fecha de Cierre Efectivo</Typography>
                        <Typography>{formatDate(capa.completion_date)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Typography color="text.secondary" gutterBottom>
                      El plan de acción correctiva se encuentra actualmente en ejecución y está pendiente de verificación de eficacia.
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<TaskAltIcon />}
                      onClick={() => setOpenEffectivenessDialog(true)}
                      sx={{ mt: 1 }}
                    >
                      Verificar Eficacia y Cerrar Plan
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Diálogo de Revisión de Eficacia */}
            <Dialog open={openEffectivenessDialog} onClose={() => setOpenEffectivenessDialog(false)} fullWidth maxWidth="sm">
              <DialogTitle sx={{ fontWeight: "bold" }}>Verificación de Eficacia (Cierre CAP)</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  De acuerdo con la norma FSSC 22000 V7, antes de proceder al cierre, se debe verificar que la causa raíz haya sido eliminada y la acción sea eficaz.
                </Typography>
                <TextField
                  label="Descripción de la verificación de eficacia"
                  placeholder="Ej. Se verificó en campo el cumplimiento de la acción y se constató que la desviación no ha vuelto a ocurrir en un periodo de..."
                  multiline
                  minRows={4}
                  fullWidth
                  value={effectivenessReview}
                  onChange={(e) => setEffectivenessReview(e.target.value)}
                  disabled={submittingCierre}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Fecha de verificación"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={effectivenessDate}
                  onChange={(e) => setEffectivenessDate(e.target.value)}
                  disabled={submittingCierre}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenEffectivenessDialog(false)} disabled={submittingCierre}>
                  Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={() => handleCierreCapa(capa.id)} disabled={submittingCierre}>
                  {submittingCierre ? "Registrando cierre..." : "Aprobar Cierre"}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        );
      })()}
    </Box>
  );
}