import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import { getDashboard } from "../../services/dashboard.service";
import type { DashboardResponse } from "../../types/dashboard";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
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
    }

    loadDashboard();
  }, []);

  return (
    <>
      <Typography
        variant="h4"
        gutterBottom
      >
        Dashboard
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Bienvenido a Bizki Quality Suite
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
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