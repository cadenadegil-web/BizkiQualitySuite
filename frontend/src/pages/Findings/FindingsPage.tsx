import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";

import FindingTable from "./FindingTable";
import FindingModal, { FindingFormData } from "./FindingModal";

import { useFindings } from "../../hooks/useFindings";
import { createFinding } from "../../services/findings.service";
import {
  exportFindingsToPDF,
  exportFindingsToExcel,
} from "../../services/export.service";

export default function FindingsPage() {
  const { data, isLoading, error, refetch } = useFindings();

  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleSubmitFinding = async (formData: FindingFormData) => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { ...formData };
      if (!payload.area_id) delete payload.area_id;
      if (!payload.classification_id) delete payload.classification_id;
      if (!payload.status_id) delete payload.status_id;
      if (payload.created_at) {
        payload.created_at = new Date(payload.created_at).toISOString();
      } else {
        delete payload.created_at;
      }

      await createFinding(payload);
      setSnack({
        open: true,
        message: "No Conformidad creada correctamente.",
        severity: "success",
      });
      setOpenModal(false);
      refetch();
    } catch (err: any) {
      console.error("Error creando no conformidad", err);
      const detail = err?.response?.data?.detail;
      let message = err?.message || "Error al crear la no conformidad.";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ");
      }
      setSnack({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    if (!data?.length) return;
    try {
      exportFindingsToPDF(data);
    } catch (e) {
      console.error("Error exportando PDF", e);
      setSnack({ open: true, message: "Error al generar el PDF.", severity: "error" });
    }
  };

  const handleExportExcel = () => {
    if (!data?.length) return;
    try {
      exportFindingsToExcel(data);
    } catch (e) {
      console.error("Error exportando Excel", e);
      setSnack({ open: true, message: "Error al generar el Excel.", severity: "error" });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        No fue posible conectar con el servidor.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 3, width: "100%" }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          No Conformidades
        </Typography>

        <Stack direction="row" gap={1} flexWrap="wrap">

          {/* Exportar PDF */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={!data?.length}
            sx={{ textTransform: "none" }}
          >
            Exportar PDF
          </Button>

          {/* Exportar Excel */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<TableViewIcon />}
            onClick={handleExportExcel}
            disabled={!data?.length}
            sx={{ textTransform: "none" }}
          >
            Exportar Excel
          </Button>

          {/* Nuevo hallazgo */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ textTransform: "none" }}
          >
            Nueva No Conformidad
          </Button>

        </Stack>
      </Stack>

      <FindingTable
        findings={data ?? []}
      />

      <FindingModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitFinding}
        submitting={submitting}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}