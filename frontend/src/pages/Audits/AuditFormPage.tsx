import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, Fab,
  FormControl, IconButton, InputLabel, MenuItem, Select,
  Snackbar, Stack, TextField, Tooltip, Typography, Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

import { createAudit } from '../../services/audits.service';
import { getCatalogItems } from '../../services/catalogs.service';
import { AuditItemCreate } from '../../types/audit';

type ResultType = 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null;

interface FormItem extends AuditItemCreate {
  _key: number;
}

let keyCounter = 0;

export default function AuditFormPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [areaId, setAreaId] = useState('');
  const [shift, setShift] = useState('Mañana');
  const [auditor, setAuditor] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);
  const [normsCatalog, setNormsCatalog] = useState<{norm: string, control_point: string}[]>([]);
  const [suggestedNorms, setSuggestedNorms] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getCatalogItems('areas').then(setAreas).catch(() => {});
    getCatalogItems('norms').then(data => {
      const activeNorms = data.filter(n => n.active);
      const catalog = activeNorms.map(n => ({ norm: n.name, control_point: n.description || '' }));
      setNormsCatalog(catalog);
      setSuggestedNorms(catalog.map(n => n.norm));
      
      // Auto-load 10 default items if the form is empty
      setItems(prev => {
        if (prev.length === 0 && catalog.length > 0) {
          keyCounter = 10;
          return catalog.slice(0, 10).map((n, i) => ({
            _key: i, order: i + 1, norm: n.norm, control_point: n.control_point, result: null, comment: null
          }));
        }
        return prev;
      });
    }).catch(() => {});
  }, []);

  const setItemResult = (key: number, result: ResultType) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, result } : it));
  };

  const setItemField = (key: number, field: 'norm' | 'control_point' | 'comment', value: string) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, [field]: value } : it));
  };

  const handleNormChange = (key: number, newNorm: string, currentControlPoint: string) => {
    setItems(prev => prev.map(it => {
      if (it._key === key) {
        const match = normsCatalog.find(n => n.norm === newNorm);
        if (match) {
          const isAutoFilled = !currentControlPoint || normsCatalog.some(n => n.control_point === currentControlPoint);
          if (isAutoFilled) {
            return { ...it, norm: newNorm, control_point: match.control_point };
          }
        }
        return { ...it, norm: newNorm };
      }
      return it;
    }));
  };

  const addItem = () => {
    keyCounter++;
    setItems(prev => [
      ...prev,
      { _key: keyCounter, order: prev.length + 1, norm: '', control_point: '', result: null, comment: null },
    ]);
  };

  const removeItem = (key: number) => {
    setItems(prev => prev.filter(it => it._key !== key).map((it, i) => ({ ...it, order: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!areaId) { setSnack({ open: true, message: 'Selecciona un área.', severity: 'error' }); return; }
    if (!auditor.trim()) { setSnack({ open: true, message: 'Ingresa el nombre del auditor.', severity: 'error' }); return; }
    setSubmitting(true);
    try {
      const audit = await createAudit({
        audit_date: auditDate,
        shift,
        auditor: auditor.trim(),
        observations: observations.trim() || undefined,
        area_id: areaId,
        items: items.map(({ _key, ...rest }) => rest),
      });
      navigate(`/audits/${audit.id}`);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setSnack({ open: true, message: typeof detail === 'string' ? detail : 'Error al crear la auditoría.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resultConfig = {
    CONFORME: { label: 'Conforme', color: 'success' as const, icon: <CheckCircleIcon /> },
    NO_CONFORME: { label: 'No Conforme', color: 'error' as const, icon: <CancelIcon /> },
    OBSERVACION: { label: 'Observación', color: 'warning' as const, icon: <WarningIcon /> },
  };

  const conformes = items.filter(it => it.result === 'CONFORME').length;
  const noConformes = items.filter(it => it.result === 'NO_CONFORME').length;
  const pendientes = items.filter(it => it.result === null).length;

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/audits')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Nueva Auditoría</Typography>
          <Typography variant="body2" color="text.secondary">Completa el checklist BPM/ISO para registrar la auditoría</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ textTransform: 'none', minWidth: 160 }}
        >
          {submitting ? 'Guardando...' : 'Guardar Auditoría'}
        </Button>
      </Stack>

      {/* Encabezado */}
      <Card sx={{ mb: 3, borderRadius: 2 }} elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>Datos Generales</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select value={areaId} label="Área" onChange={e => setAreaId(e.target.value)}>
                {areas.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Turno</InputLabel>
              <Select value={shift} label="Turno" onChange={e => setShift(e.target.value)}>
                <MenuItem value="Mañana">Mañana</MenuItem>
                <MenuItem value="Tarde">Tarde</MenuItem>
                <MenuItem value="Noche">Noche</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              type="date"
              value={auditDate}
              onChange={e => setAuditDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Auditor"
              value={auditor}
              onChange={e => setAuditor(e.target.value)}
              placeholder="Nombre del auditor"
              required
              sx={{ gridColumn: { sm: 'span 2' } }}
            />

            <TextField
              label="Observaciones generales"
              value={observations}
              onChange={e => setObservations(e.target.value)}
              multiline
              rows={2}
              sx={{ gridColumn: { sm: 'span 2', md: 'span 3' } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Progress summary */}
      <Stack direction="row" gap={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip icon={<CheckCircleIcon />} label={`Conformes: ${conformes}`} color="success" variant="outlined" />
        <Chip icon={<CancelIcon />} label={`No Conformes: ${noConformes}`} color="error" variant="outlined" />
        <Chip icon={<WarningIcon />} label={`Observaciones: ${items.filter(it => it.result === 'OBSERVACION').length}`} color="warning" variant="outlined" />
        <Chip label={`Pendientes: ${pendientes}`} variant="outlined" />
      </Stack>

      {/* Checklist */}
      <Card sx={{ borderRadius: 2 }} elevation={2}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>Puntos de Control</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>
              Agregar punto
            </Button>
          </Stack>

          <Stack gap={2}>
            {items.map((item, idx) => (
              <Box
                key={item._key}
                sx={{
                  border: '1px solid',
                  borderColor: item.result === 'CONFORME' ? 'success.light' : item.result === 'NO_CONFORME' ? 'error.light' : item.result === 'OBSERVACION' ? 'warning.light' : 'divider',
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: item.result === 'NO_CONFORME' ? '#fff8f8' : item.result === 'CONFORME' ? '#f8fff8' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Stack direction="row" alignItems="flex-start" gap={1}>
                  {/* Number */}
                  <Box
                    sx={{
                      minWidth: 32, height: 32, borderRadius: '50%',
                      backgroundColor: '#1976d2', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0, mt: 0.5,
                    }}
                  >
                    {idx + 1}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 1, mb: 1.5 }}>
                      <Autocomplete
                        freeSolo
                        options={suggestedNorms}
                        value={item.norm}
                        onChange={(e, newValue) => handleNormChange(item._key, newValue || '', item.control_point)}
                        onInputChange={(e, newInputValue) => handleNormChange(item._key, newInputValue || '', item.control_point)}
                        renderInput={(params) => (
                          <TextField {...params} size="small" label="Norma" placeholder="ej. BPM §4.1" />
                        )}
                      />
                      <TextField
                        size="small"
                        label="Punto de control"
                        value={item.control_point}
                        onChange={e => setItemField(item._key, 'control_point', e.target.value)}
                      />
                    </Box>

                    {/* Result buttons */}
                    <Stack direction="row" gap={1} sx={{ mb: 1 }}>
                      {(Object.entries(resultConfig) as [ResultType, typeof resultConfig[keyof typeof resultConfig]][]).map(([val, cfg]) => (
                        <Button
                          key={val as string}
                          size="small"
                          variant={item.result === val ? 'contained' : 'outlined'}
                          color={cfg.color}
                          startIcon={cfg.icon}
                          onClick={() => setItemResult(item._key, item.result === val ? null : val as ResultType)}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {cfg.label}
                        </Button>
                      ))}
                    </Stack>

                    {/* Comment (only if not CONFORME) */}
                    {item.result !== null && item.result !== 'CONFORME' && (
                      <TextField
                        size="small"
                        fullWidth
                        label="Comentario"
                        value={item.comment ?? ''}
                        onChange={e => setItemField(item._key, 'comment', e.target.value)}
                        multiline
                        rows={2}
                        placeholder="Describe el hallazgo o la observación..."
                      />
                    )}
                  </Box>

                  <Tooltip title="Eliminar punto">
                    <IconButton size="small" color="error" onClick={() => removeItem(item._key)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Floating save button */}
      <Box sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Fab
          color="primary"
          variant="extended"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <SaveIcon sx={{ mr: 1 }} />
          {submitting ? 'Guardando...' : 'Guardar'}
        </Fab>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
