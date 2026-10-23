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
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import {
  completeAudit, createAudit, deleteAudit, downloadAuditPDF,
  downloadDailyReportPDF, updateAudit,
} from '../../services/audits.service';
import { getCatalogItems } from '../../services/catalogs.service';
import { Audit } from '../../types/audit';
import { getAuditObjectives, getObjectiveColor } from '../../utils/auditObjectives';

type PeriodMode = 'month' | 'range' | 'single';

const DEFAULT_PLANTS = [
  'MDH',
  'Molinos del Higuamo',
  'Caribbean Cookies Company',
];

function getAuditPlant(row: Audit): string {
  const p = row.plant || row.area?.plant || 'MDH';
  return p === 'Bizki' ? 'MDH' : p;
}

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
  const { role, username } = useAuth();
  const isSupervisorOrAdmin = [
    'administrador', 'admin', 'coordinador de calidad', 'coordinador',
    'supervisor de calidad', 'supervisora', 'supervisor', 'supervisor de producción',
  ].includes((role || '').trim().toLowerCase());
  const { data, isLoading, error, refetch } = useAudits();

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const todayStr = new Date().toISOString().slice(0, 10);

  const [areas, setAreas] = useState<{ id: string; name: string; plant?: string }[]>([]);
  const [normsCatalog, setNormsCatalog] = useState<{ norm: string; control_point: string }[]>([]);

  // Filtros en pantalla
  const [tablePlantFilter, setTablePlantFilter] = useState<string>('ALL');
  const [tableAreaFilter, setTableAreaFilter] = useState<string>('ALL');
  const [tableMonthFilter, setTableMonthFilter] = useState<string>('');

  // Estado del modal de Registro / Edición de Auditoría
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [formPlant, setFormPlant] = useState<string>('MDH');
  const [formAreaId, setFormAreaId] = useState<string>('');
  const [formShift, setFormShift] = useState<string>('Mañana');
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formAuditor, setFormAuditor] = useState<string>(username || '');
  const [formObservations, setFormObservations] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState(false);

  // Estado del diálogo de Informes por Planta / Área / Fechas
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [reportMonth, setReportMonth] = useState<string>(currentYearMonth);
  const [startDate, setStartDate] = useState<string>(getMonthRange(currentYearMonth).start);
  const [endDate, setEndDate] = useState<string>(getMonthRange(currentYearMonth).end);
  const [singleDate, setSingleDate] = useState<string>(todayStr);
  const [selectedPlant, setSelectedPlant] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [downloadingReport, setDownloadingReport] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    getCatalogItems('areas')
      .then((list) =>
        setAreas(
          list.map((a) => ({
            id: a.id,
            name: a.name,
            plant: a.plant === 'Bizki' ? 'MDH' : a.plant,
          }))
        )
      )
      .catch(() => {});

    getCatalogItems('norms')
      .then((list) => {
        const active = list.filter((n) => n.active);
        setNormsCatalog(active.map((n) => ({ norm: n.name, control_point: n.description || '' })));
      })
      .catch(() => {});
  }, []);

  const plantOptions = useMemo(() => {
    const customPlants = areas
      .map((a) => a.plant)
      .filter((p): p is string => Boolean(p && p !== 'Bizki'));
    const auditPlants = (data ?? [])
      .map((au) => getAuditPlant(au))
      .filter(Boolean);
    return Array.from(new Set([...DEFAULT_PLANTS, ...customPlants, ...auditPlants]));
  }, [areas, data]);

  const showSnack = (message: string, severity: 'success' | 'error') =>
    setSnack({ open: true, message, severity });

  const handleOpenNewModal = () => {
    setEditingAudit(null);
    setFormPlant('MDH');
    setFormAreaId(areas[0]?.id || '');
    setFormShift('Mañana');
    setFormDate(todayStr);
    setFormAuditor(username || '');
    setFormObservations('');
    setAuditModalOpen(true);
  };

  const handleOpenEditModal = (row: Audit) => {
    setEditingAudit(row);
    setFormPlant(getAuditPlant(row));
    setFormAreaId(row.area_id);
    setFormShift(row.shift || 'Mañana');
    setFormDate((row.audit_date || todayStr).slice(0, 10));
    setFormAuditor(row.auditor || username || '');
    setFormObservations(row.observations || '');
    setAuditModalOpen(true);
  };

  const handleSaveAuditFromModal = async (goToChecklist: boolean) => {
    if (!formPlant.trim()) {
      showSnack('Selecciona la planta.', 'error');
      return;
    }
    if (!formAreaId) {
      showSnack('Selecciona un área.', 'error');
      return;
    }
    if (!formAuditor.trim()) {
      showSnack('Ingresa el nombre del auditor.', 'error');
      return;
    }

    setSavingAudit(true);
    try {
      if (editingAudit) {
        const updated = await updateAudit(editingAudit.id, {
          plant: formPlant.trim(),
          area_id: formAreaId,
          shift: formShift,
          audit_date: formDate,
          auditor: formAuditor.trim(),
          observations: formObservations.trim() || undefined,
        });
        showSnack('Auditoría actualizada correctamente.', 'success');
        setAuditModalOpen(false);
        refetch();
        if (goToChecklist) {
          navigate(`/audits/edit/${updated.id}`);
        }
      } else {
        const defaultItems = normsCatalog.map((n, idx) => ({
          order: idx + 1,
          norm: n.norm,
          control_point: n.control_point,
          result: null,
          comment: null,
        }));
        const created = await createAudit({
          plant: formPlant.trim(),
          area_id: formAreaId,
          shift: formShift,
          audit_date: formDate,
          auditor: formAuditor.trim(),
          observations: formObservations.trim() || undefined,
          items: defaultItems,
        });
        showSnack('Auditoría registrada correctamente.', 'success');
        setAuditModalOpen(false);
        refetch();
        if (goToChecklist) {
          navigate(`/audits/${created.id}`);
        }
      }
    } catch (e: any) {
      showSnack(e?.response?.data?.detail || 'Error al guardar la auditoría.', 'error');
    } finally {
      setSavingAudit(false);
    }
  };

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

  // Vista previa de auditorías agrupadas por Planta, Área y Fechas dentro del rango del informe
  const reportPreviewByArea = useMemo(() => {
    const allAudits = data ?? [];
    const { start, end } = effectiveRange;
    const filtered = allAudits.filter((au) => {
      const d = (au.audit_date || '').slice(0, 10);
      const inDate = d >= start && d <= end;
      const inPlant = selectedPlant === 'ALL' || getAuditPlant(au) === selectedPlant;
      const inArea = selectedAreaId === 'ALL' || au.area_id === selectedAreaId;
      return inDate && inPlant && inArea;
    });

    const groups: Record<
      string,
      { areaId: string; plantName: string; areaName: string; count: number; dates: string[]; avgScore: string; ncCount: number }
    > = {};

    for (const au of filtered) {
      const pName = getAuditPlant(au);
      const aName = au.area?.name || 'Sin Área';
      const key = `${pName}::${aName}`;
      if (!groups[key]) {
        groups[key] = {
          areaId: au.area_id,
          plantName: pName,
          areaName: aName,
          count: 0,
          dates: [],
          avgScore: '—',
          ncCount: 0,
        };
      }
      groups[key].count += 1;
      const d = (au.audit_date || '').slice(0, 10);
      if (d && !groups[key].dates.includes(d)) {
        groups[key].dates.push(d);
      }
      groups[key].ncCount += (au.items || []).filter((it) => it.result === 'NO_CONFORME').length;
    }

    for (const key of Object.keys(groups)) {
      groups[key].dates.sort();
      const groupItem = groups[key];
      const areaAudits = filtered.filter(
        (au) =>
          getAuditPlant(au) === groupItem.plantName &&
          (au.area?.name || 'Sin Área') === groupItem.areaName &&
          au.score !== null
      );
      if (areaAudits.length > 0) {
        const avg = areaAudits.reduce((acc, cur) => acc + (cur.score || 0), 0) / areaAudits.length;
        groups[key].avgScore = `${avg.toFixed(1)}%`;
      }
    }

    return Object.values(groups).sort((a, b) => a.areaName.localeCompare(b.areaName));
  }, [data, effectiveRange, selectedPlant, selectedAreaId]);

  // Filas filtradas en la tabla principal
  const filteredRows = useMemo(() => {
    return (data ?? []).filter((au) => {
      const matchPlant = tablePlantFilter === 'ALL' || getAuditPlant(au) === tablePlantFilter;
      const matchArea = tableAreaFilter === 'ALL' || au.area_id === tableAreaFilter;
      const matchMonth = !tableMonthFilter || (au.audit_date || '').startsWith(tableMonthFilter);
      return matchPlant && matchArea && matchMonth;
    });
  }, [data, tablePlantFilter, tableAreaFilter, tableMonthFilter]);

  // Resumen por Área de las filas visibles en pantalla
  const visibleAreaSummary = useMemo(() => {
    const map: Record<string, { areaId: string; plantName: string; areaName: string; dates: string[]; total: number }> = {};
    for (const au of filteredRows) {
      const name = au.area?.name || 'Sin Área';
      const pName = getAuditPlant(au);
      const key = `${pName}::${name}`;
      if (!map[key]) {
        map[key] = { areaId: au.area_id, plantName: pName, areaName: name, dates: [], total: 0 };
      }
      map[key].total += 1;
      const d = (au.audit_date || '').slice(0, 10);
      if (d && !map[key].dates.includes(d)) {
        map[key].dates.push(d);
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
        plant: selectedPlant === 'ALL' ? undefined : selectedPlant,
      });
      setReportDialogOpen(false);
    } catch (e: any) {
      showSnack(e?.message || e?.response?.data?.detail || 'No hay auditorías para los filtros seleccionados.', 'error');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleQuickAreaReport = (areaId: string, plantName: string) => {
    setSelectedAreaId(areaId);
    setSelectedPlant(plantName || 'ALL');
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
    { field: 'code', headerName: 'Código', flex: 1.05, minWidth: 135 },
    {
      field: 'plant',
      headerName: 'Planta',
      flex: 1,
      minWidth: 140,
      valueGetter: (_: unknown, row: Audit) => getAuditPlant(row),
      renderCell: (params) => {
        const plantVal = (params.value as string) || 'MDH';
        return (
          <Chip
            label={plantVal}
            size="small"
            color={
              plantVal === 'MDH'
                ? 'primary'
                : plantVal.includes('Higuam')
                ? 'secondary'
                : 'info'
            }
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'area',
      headerName: 'Área',
      flex: 0.9,
      minWidth: 115,
      valueGetter: (_: unknown, row: Audit) => row.area?.name ?? '—',
    },
    {
      field: 'audit_date',
      headerName: 'Fecha',
      flex: 0.85,
      minWidth: 105,
      valueFormatter: (value: string) =>
        value ? new Intl.DateTimeFormat('es-ES').format(new Date(value + 'T00:00:00')) : '—',
    },
    {
      field: 'objectives',
      headerName: 'Objetivo de Medición',
      flex: 1.7,
      minWidth: 220,
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
    { field: 'auditor', headerName: 'Auditor', flex: 1.05, minWidth: 125 },
    { field: 'shift', headerName: 'Turno', flex: 0.75, minWidth: 95 },
    {
      field: 'score',
      headerName: 'Puntaje',
      flex: 0.95,
      minWidth: 115,
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
      width: 125,
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
      width: 210,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Ver detalle / Checklist">
            <IconButton color="primary" onClick={() => navigate(`/audits/${params.row.id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Editar Planta / Datos de Auditoría">
            <IconButton color="info" onClick={() => handleOpenEditModal(params.row as Audit)}>
              <EditIcon />
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
              ? "Supervisión y control de todas las auditorías por planta, área y fechas registradas"
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
            variant="outlined"
            color="primary"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={handleOpenNewModal}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Registro en Modal
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

      {/* Barra de filtros por Planta, Área y Mes + Resumen de Fechas por Área */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FilterAltIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Filtrar por Planta, Área y Mes:
              </Typography>

              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Planta</InputLabel>
                <Select
                  label="Planta"
                  value={tablePlantFilter}
                  onChange={(e) => setTablePlantFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todas las plantas</MenuItem>
                  {plantOptions.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
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

              {(tablePlantFilter !== 'ALL' || tableAreaFilter !== 'ALL' || tableMonthFilter !== '') && (
                <Button
                  size="small"
                  onClick={() => {
                    setTablePlantFilter('ALL');
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
                Resumen por Planta y Área (haz clic para descargar su informe con todas sus fechas del mes):
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {visibleAreaSummary.map((item) => (
                  <Tooltip
                    key={`${item.plantName}-${item.areaName}`}
                    title={`Planta: ${item.plantName} · Fechas evaluadas: ${item.dates.map(formatDateShort).join(', ')} — Clic para generar informe PDF`}
                    arrow
                  >
                    <Chip
                      icon={<PictureAsPdfIcon fontSize="small" />}
                      label={`${item.plantName} · ${item.areaName}: ${item.dates.length} fecha(s) (${item.total} aud.)`}
                      color={item.dates.length > 1 ? 'primary' : 'default'}
                      variant={item.dates.length > 1 ? 'filled' : 'outlined'}
                      onClick={() => handleQuickAreaReport(item.areaId, item.plantName)}
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

      {/* Modal de Registro / Edición de Auditorías (con opciones de Planta, Área, Turno, Fecha y Auditor) */}
      <Dialog open={auditModalOpen} onClose={() => setAuditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAudit ? `Editar Auditoría (${editingAudit.code})` : 'Registrar Auditoría'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.2} sx={{ mt: 0.5 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Planta</InputLabel>
              <Select
                label="Planta"
                value={formPlant}
                onChange={(e) => setFormPlant(e.target.value)}
              >
                {plantOptions.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>Área</InputLabel>
              <Select
                label="Área"
                value={formAreaId}
                onChange={(e) => setFormAreaId(e.target.value)}
              >
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}{a.plant ? ` (${a.plant})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Turno</InputLabel>
                <Select
                  label="Turno"
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value)}
                >
                  <MenuItem value="Mañana">Mañana</MenuItem>
                  <MenuItem value="Tarde">Tarde</MenuItem>
                  <MenuItem value="Noche">Noche</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Fecha de Auditoría"
                type="date"
                size="small"
                fullWidth
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Auditor"
              size="small"
              fullWidth
              required
              value={formAuditor}
              onChange={(e) => setFormAuditor(e.target.value)}
              placeholder="Nombre del auditor responsable"
            />

            <TextField
              label="Observaciones generales"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={formObservations}
              onChange={(e) => setFormObservations(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setAuditModalOpen(false)}>Cancelar</Button>
          <Button
            variant="outlined"
            onClick={() => handleSaveAuditFromModal(true)}
            disabled={savingAudit}
            sx={{ textTransform: 'none' }}
          >
            {editingAudit ? 'Guardar e ir al Checklist' : 'Registrar y evaluar Checklist'}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSaveAuditFromModal(false)}
            disabled={savingAudit}
            sx={{ textTransform: 'none' }}
          >
            {savingAudit ? 'Guardando...' : editingAudit ? 'Guardar Cambios' : 'Guardar Registro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Informes por Planta, Área y Múltiples Fechas / Mes */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Informe Consolidado por Planta, Área y Fechas
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel>Planta</InputLabel>
                <Select
                  label="Planta"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                >
                  <MenuItem value="ALL">Todas las plantas</MenuItem>
                  {plantOptions.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                Vista previa por Planta, Área y Fechas ({formatDateShort(effectiveRange.start)} al {formatDateShort(effectiveRange.end)}):
              </Typography>
              {reportPreviewByArea.length === 0 ? (
                <Alert severity="info">
                  No se encontraron auditorías registradas para la planta, área y período seleccionados.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Área</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Planta</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Auditorías</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Fechas Registradas en el Mes / Período</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Promedio</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">NC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportPreviewByArea.map((row) => (
                        <TableRow key={`${row.plantName}-${row.areaName}`} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.areaName}</TableCell>
                          <TableCell>
                            <Chip label={row.plantName} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }} />
                          </TableCell>
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
