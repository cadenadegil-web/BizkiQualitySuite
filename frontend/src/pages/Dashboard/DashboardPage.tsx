import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getDashboard } from "../../services/dashboard.service";
import type { DashboardResponse } from "../../types/dashboard";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { role, username } = useAuth();
  const isSupervisorOrAdmin = ['administrador', 'admin', 'coordinador de calidad', 'coordinador', 'supervisor de calidad', 'supervisora', 'supervisor', 'supervisor de producción'].includes((role || '').trim().toLowerCase());

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Error cargando datos del dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Dashboard
            </Typography>
            <Chip
              label={
                isSupervisorOrAdmin
                  ? "Supervisión Global (Toda la Planta)"
                  : `Mis Métricas (${username || "Auditor"})`
              }
              color={isSupervisorOrAdmin ? "primary" : "info"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {isSupervisorOrAdmin
              ? "Indicadores consolidados y estado de calidad de toda la planta"
              : "Indicadores de cumplimiento y seguimiento de sus no conformidades"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboard}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 10,
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Cargando indicadores del Dashboard... (si el servidor está en reposo, puede demorar hasta 1 minuto)
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ maxWidth: 700, my: 3 }}>
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadDashboard}
              >
                Reintentar
              </Button>
            }
          >
            <AlertTitle>No se pudieron obtener los datos</AlertTitle>
            {error}
          </Alert>
        </Box>
      ) : dashboard ? (
        <>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">Hallazgos</Typography>
                    <Typography variant="h4">
                      {dashboard.summary.total_findings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">Abiertos</Typography>
                    <Typography variant="h4">
                      {dashboard.summary.open_findings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">Cerrados</Typography>
                    <Typography variant="h4">
                      {dashboard.summary.closed_findings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">Críticos</Typography>
                    <Typography variant="h4">
                      {dashboard.summary.critical_findings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Hallazgos por Área
                    </Typography>
                    {dashboard.by_area.map((item) => (
                      <Box
                        key={item.label}
                        sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}
                      >
                        <Typography>{item.label}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{item.total}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Hallazgos por Estado
                    </Typography>
                    {dashboard.by_status.map((item) => (
                      <Box
                        key={item.label}
                        sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}
                      >
                        <Typography>{item.label}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{item.total}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Hallazgos por Clasificación
                    </Typography>
                    {dashboard.by_classification.map((item) => (
                      <Box
                        key={item.label}
                        sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}
                      >
                        <Typography>{item.label}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{item.total}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hallazgos recientes
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Clasificación</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Proceso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboard.recent_findings.map((finding) => (
                    <TableRow key={finding.code}>
                      <TableCell>{finding.code}</TableCell>
                      <TableCell>{finding.area}</TableCell>
                      <TableCell>{finding.classification}</TableCell>
                      <TableCell>{finding.status}</TableCell>
                      <TableCell>{finding.responsible}</TableCell>
                      <TableCell>{finding.process}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      ) : null}
    </>
  );
}