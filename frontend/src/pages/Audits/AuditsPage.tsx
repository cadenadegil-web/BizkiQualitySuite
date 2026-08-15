import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton,
  LinearProgress, Snackbar, Stack, TextField, Tooltip, Typography,
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

import { useAudits } from '../../hooks/useAudits';
import { completeAudit, deleteAudit, downloadAuditPDF, downloadDailyReportPDF } from '../../services/audits.service';
import { Audit } from '../../types/audit';

export default function AuditsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAudits();

  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

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

  const handleDailyReport = async () => {
    try {
      await downloadDailyReportPDF(dailyDate);
      setDailyDialogOpen(false);
    } catch (e: any) {
      showSnack(e?.response?.data?.detail || 'No hay auditorías para esa fecha.', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Código', flex: 1.2, minWidth: 150 },
    {
      field: 'area',
      headerName: 'Área',
      flex: 1,
      minWidth: 120,
      valueGetter: (_: unknown, row: Audit) => row.area?.name ?? '—',
    },
    { field: 'auditor', headerName: 'Auditor', flex: 1.2, minWidth: 140 },
    { field: 'shift', headerName: 'Turno', flex: 0.8, minWidth: 100 },
    {
      field: 'audit_date',
      headerName: 'Fecha',
      flex: 1,
      minWidth: 110,
      valueFormatter: (value: string) =>
        value ? new Intl.DateTimeFormat('es-ES').format(new Date(value + 'T00:00:00')) : '—',
    },
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Auditorías</Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de auditorías BPM e ISO del proceso productivo
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setDailyDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Informe Diario
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

      <Box sx={{ backgroundColor: '#fff', borderRadius: 2 }}>
        <DataGrid
          rows={data ?? []}
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

      {/* Daily Report Dialog */}
      <Dialog open={dailyDialogOpen} onClose={() => setDailyDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Informe Diario de Auditorías</DialogTitle>
        <DialogContent>
          <TextField
            label="Fecha"
            type="date"
            fullWidth
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDailyDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleDailyReport} startIcon={<PictureAsPdfIcon />}>
            Descargar PDF
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
