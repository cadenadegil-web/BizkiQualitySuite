import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton,
  InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {
  DataGrid, GridColDef,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { completeAudit, deleteAudit, downloadAuditPDF, downloadDailyReportPDF } from '../../services/audits.service';
import { getCatalogItems } from '../../services/catalogs.service';
import { Audit } from '../../types/audit';
import { getAuditObjectives, getObjectiveColor } from '../../utils/auditObjectives';

type PeriodMode = 'month' | 'range' | 'single';

function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, end: today };
  }
  const lastDay = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');
  return {
    start: `${y}-${mm}-01`,
    end: `${y}-${mm}-${dd}`,
  };
}

function formatDateShort(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function AuditsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isSupervisorOrAdmin = [
    'administrador', 'admin', 'coordinador de calidad', 'coordinador',
    'supervisor de calidad', 'supervisora', 'supervisor', 'supervisor de producción',
  ].includes((role || '').trim().toLowerCase());
  const { data, isLoading, error, refetch } = useAudits();

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const todayStr = new Date().toISOString().slice(0, 10);

  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);

  // Filtros en pantalla
  const [tableAreaFilter, setTableAreaFilter] = useState<string>('ALL');
  const [tableMonthFilter, setTableMonthFilter] = useState<string>('');

  // Estado del diálogo de Informes por Área / Fechas
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [reportMonth, setReportMonth] = useState<string>(currentYearMonth);
  const [startDate, setStartDate] = useState<string>(getMonthRange(currentYearMonth).start);
  const [endDate, setEndDate] = useState<string>(getMonthRange(currentYearMonth).end);
  const [singleDate, setSingleDate] = useState<string>(todayStr);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [downloadingReport, setDownloadingReport] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    getCatalogItems('areas')
      .then((list) => setAreas(list.map((a) => ({ id: a.id, name: a.name }))))
      .catch(() => {});
  }, []);

  const showSnack = (message: string, severity: 'success' | 'error') =>
    setSnack({ open: true, message, severity });

  const handleComplete = async (id: string) => {
    if (!confirm('¿Completar la auditoría? Se calcularán puntajes y se generarán hallazgos para no conformidades.')) return;
    try {
      await completeAudit(id);
      showSnack('Auditoría completada correctamente.', 'success');
      refetch();
    } catch (e: any) {
      showSnack(e?.response?.data?.detail || 'Error al completar la auditoría.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta auditoría?')) return;
    try {
      await deleteAudit(id);
      showSnack('Auditoría eliminada.', 'success');
      refetch();
    } catch {
      showSnack('Error al eliminar la auditoría.', 'error');
    }
  };

  const handleDownloadPDF = async (id: string, code: string) => {
    try {
      await downloadAuditPDF(id, code);
    } catch {
      showSnack('Error al generar el PDF.', 'error');
    }
  };

  const effectiveRange = useMemo(() => {
    if (periodMode === 'month') {
      return getMonthRange(reportMonth);
    }
    if (periodMode === 'range') {
      return { start: startDate, end: endDate };
    }
    return { start: singleDate, end: singleDate };
  }, [periodMode, reportMonth, startDate, endDate, singleDate]);

  // Vista previa de auditorías agrupadas por Área y Fechas dentro del rango del informe
  const reportPreviewByArea = useMemo(() => {
    const allAudits = data ?? [];
    const { start, end } = effectiveRange;
    const filtered = allAudits.filter((au) => {
      const d = (au.audit_date || '').slice(0, 10);
      const inDate = d >= start && d <= end;
      const inArea = selectedAreaId === 'ALL' || au.area_id === selectedAreaId;
      return inDate && inArea;
    });

    const groups: Record<
      string,
      { areaId: string; areaName: string; count: number; dates: string[]; avgScore: string; ncCount: number }
    > = {};

    for (const au of filtered) {
      const aName = au.area?.name || 'Sin Área';
      if (!groups[aName]) {
        groups[aName] = {
          areaId: au.area_id,
          areaName: aName,
          count: 0,
          dates: [],
          avgScore: '—',
          ncCount: 0,
        };
      }
      groups[aName].count += 1;
      const d = (au.audit_date || '').slice(0, 10);
      if (d && !groups[aName].dates.includes(d)) {
        groups[aName].dates.push(d);
      }
      groups[aName].ncCount += (au.items || []).filter((it) => it.result === 'NO_CONFORME').length;
    }

    for (const aName of Object.keys(groups)) {
      groups[aName].dates.sort();
      const areaAudits = filtered.filter((au) => (au.area?.name || 'Sin Área') === aName && au.score !== null);
      if (areaAudits.length > 0) {
        const avg = areaAudits.reduce((acc, cur) => acc + (cur.score || 0), 0) / areaAudits.length;
        groups[aName].avgScore = `${avg.toFixed(1)}%`;
      }
    }

    return Object.values(groups).sort((a, b) => a.areaName.localeCompare(b.areaName));
  }, [data, effectiveRange, selectedAreaId]);

  // Filas filtradas en la tabla principal
  const filteredRows = useMemo(() => {
    return (data ?? []).filter((au) => {
      const matchArea = tableAreaFilter === 'ALL' || au.area_id === tableAreaFilter;
      const matchMonth = !tableMonthFilter || (au.audit_date || '').startsWith(tableMonthFilter);
      return matchArea && matchMonth;
    });
  }, [data, tableAreaFilter, tableMonthFilter]);

  // Resumen por Área de las filas visibles en pantalla
  const visibleAreaSummary = useMemo(() => {
    const map: Record<string, { areaId: string; areaName: string; dates: string[]; total: number }> = {};
    for (const au of filteredRows) {
      const name = au.area?.name || 'Sin Área';
      if (!map[name]) {
        map[name] = { areaId: au.area_id, areaName: name, dates: [], total: 0 };
      }
      map[name].total += 1;
      const d = (au.audit_date || '').slice(0, 10);
      if (d && !map[name].dates.includes(d)) {
        map[name].dates.push(d);
      }
    }
    return Object.values(map)
      .map((item) => ({ ...item, dates: item.dates.sort() }))
      .sort((a, b) => a.areaName.localeCompare(b.areaName));
  }, [filteredRows]);

  const handleDownloadConsolidatedReport = async () => {
    setDownloadingReport(true);
    try {
      const selectedAreaObj = areas.find((a) => a.id === selectedAreaId);
      await downloadDailyReportPDF({
        startDate: effectiveRange.start,
        endDate: effectiveRange.end,
        areaId: selectedAreaId === 'ALL' ? undefined : selectedAreaId,
        areaName: selectedAreaObj?.name,
      });
      setReportDialogOpen(false);
    } catch (e: any) {
      showSnack(e?.message || e?.response?.data?.detail || 'No hay auditorías para los filtros seleccionados.', 'error');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleQuickAreaReport = (areaId: string) => {
    setSelectedAreaId(areaId);
    if (tableMonthFilter) {
      setPeriodMode('month');
      setReportMonth(tableMonthFilter);
    } else {
      setPeriodMode('month');
      setReportMonth(currentYearMonth);
    }
    setReportDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Código', flex: 1.1, minWidth: 140 },
    {
      field: 'area',
      headerName: 'Área',
      flex: 0.9,
      minWidth: 120,
      valueGetter: (_: unknown, row: Audit) => row.area?.name ?? '—',
    },
    {
      field: 'audit_date',
      headerName: 'Fecha',
      flex: 0.9,
      minWidth: 110,
      valueFormatter: (value: string) =>
        value ? new Intl.DateTimeFormat('es-ES').format(new Date(value + 'T00:00:00')) : '—',
    },
    {
      field: 'objectives',
      headerName: 'Objetivo de Medición',
      flex: 1.8,
      minWidth: 230,
      valueGetter: (_: unknown, row: Audit) => getAuditObjectives(row).join(', '),
      renderCell: (params) => {
        const objs = getAuditObjectives(params.row);
        if (!objs || objs.length === 0) {
          return <Typography variant="caption" color="text.secondary">—</Typography>;
        }
        const visible = objs.slice(0, 2);
        const remaining = objs.slice(2);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%', flexWrap: 'nowrap', overflow: 'hidden' }}>
            {visible.map(obj => {
              const col = getObjectiveColor(obj);
              return (
                <Chip
                  key={obj}
                  label={obj}
                  size="small"
                  sx={{
                    backgroundColor: col.bg,
                    color: col.color,
                    border: `1px solid ${col.border}`,
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    height: 22,
                  }}
                />
              );
            })}
            {remaining.length > 0 && (
              <Tooltip title={objs.join(' · ')} arrow>
                <Chip
                  label={`+${remaining.length}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
    { field: 'auditor', headerName: 'Auditor', flex: 1.1, minWidth: 130 },
    { field: 'shift', headerName: 'Turno', flex: 0.8, minWidth: 100 },
    {
      field: 'score',
      headerName: 'Puntaje',
      flex: 1,
      minWidth: 120,
      renderCell: (params) =>
        params.value !== null ? (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={params.value as number}
              sx={{
                flex: 1, height: 8, borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (params.value as number) >= 80 ? '#2e7d32' : (params.value as number) >= 60 ? '#ed6c02' : '#c62828',
                },
              }}
            />
            <Typography variant="caption" sx={{ minWidth: 36 }}>{params.value}%</Typography>
          </Box>
        ) : <Typography variant="caption" color="text.secondary">—</Typography>,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value === 'COMPLETADA' ? 'Completada' : 'Pendiente'}
          color={params.value === 'COMPLETADA' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      sortable: false,
      filterable: false,
      width: 180,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Ver detalle">
            <IconButton color="primary" onClick={() => navigate(`/audits/${params.row.id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {params.row.status === 'PENDIENTE' && (
            <Tooltip title="Completar auditoría">
              <IconButton color="success" onClick={() => handleComplete(params.row.id as string)}>
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Descargar PDF">
            <IconButton color="error" onClick={() => handleDownloadPDF(params.row.id as string, params.row.code as string)}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar">
            <IconButton color="error" onClick={() => handleDelete(params.row.id as string)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">No fue posible conectar con el servidor.</Alert>;

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Auditorías</Typography>
            <Chip
              label={isSupervisorOrAdmin ? "Supervisión Global (Planta)" : "Mis Auditorías"}
              color={isSupervisorOrAdmin ? "primary" : "info"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {isSupervisorOrAdmin
              ? "Supervisión y control de todas las auditorías por área y fechas registradas en la planta"
              : "Registro y control de auditorías asignadas o realizadas por su usuario"}
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setReportDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Informes por Área / Fechas
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/audits/new')}
            sx={{ textTransform: 'none' }}
          >
            Nueva Auditoría
          </Button>
        </Stack>
      </Stack>

      {/* Barra de filtros por Área y Mes + Resumen de Fechas por Área */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FilterAltIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Filtrar por Área y Mes:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Área</InputLabel>
                <Select
                  label="Área"
                  value={tableAreaFilter}
                  onChange={(e) => setTableAreaFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todas las áreas</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Mes"
                type="month"
                size="small"
                value={tableMonthFilter}
                onChange={(e) => setTableMonthFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 170 }}
              />

              {(tableAreaFilter !== 'ALL' || tableMonthFilter !== '') && (
                <Button
                  size="small"
                  onClick={() => {
                    setTableAreaFilter('ALL');
                    setTableMonthFilter('');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Mostrando {filteredRows.length} auditoría(s) en {visibleAreaSummary.length} área(s)
            </Typography>
          </Stack>

          {visibleAreaSummary.length > 0 && (
            <>
              <Divider sx={{ my: 1.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8, fontWeight: 600 }}>
                Resumen por Área (haz clic en un área para descargar su informe con todas sus fechas del mes):
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {visibleAreaSummary.map((item) => (
                  <Tooltip
                    key={item.areaName}
                    title={`Fechas evaluadas: ${item.dates.map(formatDateShort).join(', ')} — Clic para generar informe PDF de ${item.areaName}`}
                    arrow
                  >
                    <Chip
                      icon={<PictureAsPdfIcon fontSize="small" />}
                      label={`${item.areaName}: ${item.dates.length} fecha(s) (${item.total} aud.)`}
                      color={item.dates.length > 1 ? 'primary' : 'default'}
                      variant={item.dates.length > 1 ? 'filled' : 'outlined'}
                      onClick={() => handleQuickAreaReport(item.areaId)}
                      sx={{ fontWeight: 600, cursor: 'pointer' }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Box sx={{ backgroundColor: '#fff', borderRadius: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#1976d2', color: '#000', fontWeight: 'bold', fontSize: 15 },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
          }}
        />
      </Box>

      {/* Diálogo de Informes por Área y Múltiples Fechas / Mes */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Informe Consolidado por Área y Fechas
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel>Área a incluir en el informe</InputLabel>
                <Select
                  label="Área a incluir en el informe"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                >
                  <MenuItem value="ALL">Todas las áreas (Consolidado por Área)</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ToggleButtonGroup
                color="primary"
                size="small"
                exclusive
                value={periodMode}
                onChange={(_, val) => {
                  if (val) setPeriodMode(val);
                }}
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton value="month" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Por Mes (Varias fechas)
                </ToggleButton>
                <ToggleButton value="range" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Rango de Fechas
                </ToggleButton>
                <ToggleButton value="single" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Un Día
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {periodMode === 'month' && (
              <TextField
                label="Seleccionar Mes (incluye todas las fechas registradas del mes)"
                type="month"
                size="small"
                fullWidth
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            {periodMode === 'range' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Fecha Inicial"
                  type="date"
                  size="small"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha Final"
                  type="date"
                  size="small"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}

            {periodMode === 'single' && (
              <TextField
                label="Fecha del Informe"
                type="date"
                size="small"
                fullWidth
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
                Vista previa de Áreas y Fechas en el período ({formatDateShort(effectiveRange.start)} al {formatDateShort(effectiveRange.end)}):
              </Typography>
              {reportPreviewByArea.length === 0 ? (
                <Alert severity="info">
                  No se encontraron auditorías registradas para el área y período seleccionados.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Área</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Auditorías</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Fechas Registradas en el Mes / Período</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Promedio</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">NC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportPreviewByArea.map((row) => (
                        <TableRow key={row.areaName} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.areaName}</TableCell>
                          <TableCell align="center">{row.count}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              {row.dates.map((d) => (
                                <Chip
                                  key={d}
                                  label={formatDateShort(d)}
                                  size="small"
                                  color={row.dates.length > 1 ? 'primary' : 'default'}
                                  variant="outlined"
                                  sx={{ fontSize: '0.72rem', height: 22 }}
                                />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{row.avgScore}</TableCell>
                          <TableCell align="center">{row.ncCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReportDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleDownloadConsolidatedReport}
            startIcon={<PictureAsPdfIcon />}
            disabled={downloadingReport || reportPreviewByArea.length === 0}
          >
            {downloadingReport ? 'Generando PDF...' : 'Descargar Informe PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
