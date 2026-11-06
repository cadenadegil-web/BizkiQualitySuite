import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Fab,
  FormControl, IconButton, InputLabel, MenuItem, Select,
  Snackbar, Stack, TextField, Tooltip, Typography, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';

import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

import { createAudit, getAudit, updateAudit, uploadAuditEvidence, resolveEvidenceUrl, isImageUrl } from '../../services/audits.service';
import { getCatalogItems } from '../../services/catalogs.service';
import { AuditItemCreate } from '../../types/audit';
import { classifyAuditItemObjective, getObjectiveColor } from '../../utils/auditObjectives';
import { useAuth } from '../../hooks/useAuth';

type ResultType = 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null;

interface FormItem extends AuditItemCreate {
  _key: number;
}

let keyCounter = 0;

const DEFAULT_PLANTS = [
  'MDH',
  'Bizki (Planta de Bizcocho)',
  'Molinos del Higuamo',
  'Caribbean Cookies Company',
];

export default function AuditFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { username } = useAuth();

  const [loadingAudit, setLoadingAudit] = useState(isEditing);
  const [auditCode, setAuditCode] = useState('');
  const [areas, setAreas] = useState<{ id: string; name: string; plant?: string }[]>([]);
  const [plant, setPlant] = useState('MDH');
  const [areaId, setAreaId] = useState('');
  const [shift, setShift] = useState('Mañana');
  const [auditor, setAuditor] = useState('');
  const [areaResponsible, setAreaResponsible] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);
  const [normsCatalog, setNormsCatalog] = useState<{norm: string, control_point: string}[]>([]);
  const [suggestedNorms, setSuggestedNorms] = useState<string[]>([]);
  const [auditorOptions, setAuditorOptions] = useState<string[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<string[]>([]);
  const [collaboratorOptions, setCollaboratorOptions] = useState<string[]>([]);

  // Dialog estados para Evidencia y Colaboradores
  const [evidenceModalItemKey, setEvidenceModalItemKey] = useState<number | null>(null);
  const [evidenceTab, setEvidenceTab] = useState<number>(0);
  const [evidenceUrlInput, setEvidenceUrlInput] = useState<string>('');
  const [uploadingEvidence, setUploadingEvidence] = useState<boolean>(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const [collaboratorModalItemKey, setCollaboratorModalItemKey] = useState<number | null>(null);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!isEditing && username) {
      setAuditor(prev => prev || username);
    }
    getCatalogItems('areas').then(setAreas).catch(() => {});
    getCatalogItems('norms').then(data => {
      const activeNorms = data.filter(n => n.active);
      const catalog = activeNorms.map(n => ({ norm: n.name, control_point: n.description || '' }));
      setNormsCatalog(catalog);
      setSuggestedNorms(catalog.map(n => n.norm));
      
      // Auto-load all items from catalog if the form is empty and NOT editing
      if (!isEditing) {
        setItems(prev => {
          if (prev.length === 0 && catalog.length > 0) {
            keyCounter = catalog.length + 10;
            return catalog.map((n, i) => ({
              _key: i + 1, order: i + 1, norm: n.norm, control_point: n.control_point, result: null, comment: null
            }));
          }
          return prev;
        });
      }
    }).catch(() => {});

    getCatalogItems('auditors').then(list => {
      setAuditorOptions(list.filter(a => a.active).map(a => a.name));
    }).catch(() => {});

    getCatalogItems('responsibles').then(list => {
      setResponsibleOptions(list.filter(r => r.active).map(r => r.name));
    }).catch(() => {});

    getCatalogItems('collaborators').then(list => {
      setCollaboratorOptions(
        list
          .filter(c => c.active)
          .map(c => {
            const code = c.employee_code ? `[${c.employee_code}] ` : "";
            const pos = c.position ? ` - ${c.position}` : "";
            return `${code}${c.name}${pos}`;
          })
      );
    }).catch(() => {});

    if (isEditing && id) {
      getAudit(id)
        .then(audit => {
          setAuditCode(audit.code);
          setPlant(audit.plant || audit.area?.plant || 'MDH');
          setAreaId(audit.area_id);
          setShift(audit.shift);
          setAuditor(audit.auditor);
          setAreaResponsible(audit.area_responsible || '');
          setAuditDate(audit.audit_date);
          setObservations(audit.observations || '');
          if (audit.items && audit.items.length > 0) {
            keyCounter = audit.items.length + 10;
            setItems(audit.items.map((it, idx) => ({
              _key: idx + 1,
              order: it.order || idx + 1,
              norm: it.norm,
              control_point: it.control_point,
              result: it.result,
              comment: it.comment,
              non_compliant_collaborators: it.non_compliant_collaborators || null,
              evidence_url: it.evidence_url || null,
            })));
          }
        })
        .catch(() => {
          setSnack({ open: true, message: 'No se pudo cargar la auditoría.', severity: 'error' });
        })
        .finally(() => {
          setLoadingAudit(false);
        });
    }
  }, [id, isEditing]);

  const handleLoadAllCatalogPoints = () => {
    if (normsCatalog.length === 0) {
      setSnack({ open: true, message: 'No hay puntos en el catálogo disponibles para cargar.', severity: 'error' });
      return;
    }
    keyCounter = normsCatalog.length + 10;
    const newItems: FormItem[] = normsCatalog.map((n, i) => ({
      _key: i + 1,
      order: i + 1,
      norm: n.norm,
      control_point: n.control_point,
      result: null,
      comment: null,
    }));
    setItems(newItems);
    setSnack({ open: true, message: `Se cargaron todos los ${newItems.length} puntos de control del catálogo.`, severity: 'success' });
  };

  const setItemResult = (key: number, result: ResultType) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, result } : it));
  };

  const setItemField = (key: number, field: keyof FormItem, value: any) => {
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
      {
        _key: keyCounter,
        order: prev.length + 1,
        norm: '',
        control_point: '',
        result: null,
        comment: null,
        non_compliant_collaborators: null,
        evidence_url: null,
      },
    ]);
  };

  const openEvidenceModal = (key: number) => {
    const item = items.find(it => it._key === key);
    setEvidenceModalItemKey(key);
    setEvidenceUrlInput(item?.evidence_url || '');
    setEvidenceTab(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || evidenceModalItemKey === null) return;
    setUploadingEvidence(true);
    try {
      const res = await uploadAuditEvidence(file);
      const fullUrl = resolveEvidenceUrl(res.url);
      setEvidenceUrlInput(fullUrl);
      setItemField(evidenceModalItemKey, 'evidence_url', fullUrl);
      setSnack({ open: true, message: 'Evidencia subida correctamente.', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Error al subir la evidencia.', severity: 'error' });
    } finally {
      setUploadingEvidence(false);
    }
  };

  const saveEvidenceUrl = () => {
    if (evidenceModalItemKey !== null) {
      const resolved = evidenceUrlInput.trim() ? resolveEvidenceUrl(evidenceUrlInput.trim()) : null;
      setItemField(evidenceModalItemKey, 'evidence_url', resolved);
    }
    setEvidenceModalItemKey(null);
  };

  const removeEvidence = (key: number) => {
    setItemField(key, 'evidence_url', null);
  };

  const openCollaboratorsModal = (key: number) => {
    const item = items.find(it => it._key === key);
    const existing = item?.non_compliant_collaborators
      ? item.non_compliant_collaborators.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    setSelectedCollaborators(existing);
    setCollaboratorModalItemKey(key);
  };

  const saveCollaborators = () => {
    if (collaboratorModalItemKey !== null) {
      const val = selectedCollaborators.join(', ');
      setItemField(collaboratorModalItemKey, 'non_compliant_collaborators', val || null);
    }
    setCollaboratorModalItemKey(null);
  };

  const removeItem = (key: number) => {
    setItems(prev => prev.filter(it => it._key !== key).map((it, i) => ({ ...it, order: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!plant.trim()) { setSnack({ open: true, message: 'Selecciona o ingresa la planta.', severity: 'error' }); return; }
    if (!areaId) { setSnack({ open: true, message: 'Selecciona un área.', severity: 'error' }); return; }
    if (!auditor.trim()) { setSnack({ open: true, message: 'Ingresa el nombre del auditor.', severity: 'error' }); return; }
    setSubmitting(true);
    const payload = {
      audit_date: auditDate,
      shift,
      auditor: auditor.trim(),
      area_responsible: areaResponsible.trim() || undefined,
      plant: plant.trim(),
      observations: observations.trim() || undefined,
      area_id: areaId,
      items: items.map(({ _key, ...rest }) => rest),
    };
    try {
      if (isEditing && id) {
        const audit = await updateAudit(id, payload);
        navigate(`/audits/${audit.id}`);
      } else {
        const audit = await createAudit(payload);
        navigate(`/audits/${audit.id}`);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setSnack({
        open: true,
        message: typeof detail === 'string' ? detail : `Error al ${isEditing ? 'actualizar' : 'crear'} la auditoría.`,
        severity: 'error',
      });
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

  if (loadingAudit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(isEditing ? `/audits/${id}` : '/audits')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar Auditoría ${auditCode ? `(${auditCode})` : ''}` : 'Nueva Auditoría'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Modifica los puntos de control, resultados o comentarios' : 'Completa el checklist BPM/ISO para registrar la auditoría'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ textTransform: 'none', minWidth: 160 }}
        >
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Auditoría')}
        </Button>
      </Stack>

      {/* Encabezado */}
      <Card sx={{ mb: 3, borderRadius: 2 }} elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>Datos Generales</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Planta</InputLabel>
              <Select
                value={plant}
                label="Planta"
                onChange={e => setPlant(e.target.value)}
              >
                {Array.from(
                  new Set([
                    ...DEFAULT_PLANTS,
                    ...areas.map(a => a.plant).filter((p): p is string => Boolean(p && p !== 'Bizki')),
                  ])
                ).map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select
                value={areaId}
                label="Área"
                onChange={e => {
                  const selectedId = e.target.value;
                  setAreaId(selectedId);
                  const found = areas.find(a => a.id === selectedId);
                  if (found?.plant && found.plant !== 'Bizki' && !plant) {
                    setPlant(found.plant);
                  }
                }}
              >
                {areas.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}{a.plant ? ` (${a.plant === 'Bizki' ? 'MDH' : a.plant})` : ''}
                  </MenuItem>
                ))}
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

            <Autocomplete
              freeSolo
              options={auditorOptions}
              value={auditor}
              onInputChange={(_, newValue) => setAuditor(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Auditor"
                  placeholder="Seleccione o escriba el auditor"
                  required
                />
              )}
            />

            <Autocomplete
              freeSolo
              options={responsibleOptions}
              value={areaResponsible}
              onInputChange={(_, newValue) => setAreaResponsible(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable de Área"
                  placeholder="Seleccione o escriba el responsable"
                />
              )}
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Puntos de Control ({items.length})
            </Typography>
            <Stack direction="row" gap={1}>
              {normsCatalog.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlaylistAddCheckIcon />}
                  onClick={handleLoadAllCatalogPoints}
                  sx={{ textTransform: 'none' }}
                >
                  Cargar todos los puntos ({normsCatalog.length})
                </Button>
              )}
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>
                Agregar punto
              </Button>
            </Stack>
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
                    <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                      {(() => {
                        const obj = item.objective || classifyAuditItemObjective(item.norm, item.control_point);
                        const col = getObjectiveColor(obj);
                        return (
                          <Chip
                            label={`Objetivo: ${obj}`}
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
                      })()}
                    </Stack>
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

                    {/* Result buttons, Evidencias y Colaboradores */}
                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
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

                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

                      {/* Botón Pestaña / Subir Evidencia */}
                      <Button
                        size="small"
                        variant={item.evidence_url ? 'contained' : 'outlined'}
                        color={item.evidence_url ? 'info' : 'inherit'}
                        startIcon={<AttachFileIcon />}
                        onClick={() => openEvidenceModal(item._key)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        {item.evidence_url ? 'Evidencia Adjunta' : 'Evidencias (Foto/Link)'}
                      </Button>

                      {/* Botón Pestaña / Colaboradores en falta */}
                      <Button
                        size="small"
                        variant={item.non_compliant_collaborators ? 'contained' : 'outlined'}
                        color={item.non_compliant_collaborators ? 'warning' : 'inherit'}
                        startIcon={<GroupIcon />}
                        onClick={() => openCollaboratorsModal(item._key)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        {item.non_compliant_collaborators ? 'Colaboradores en Falta' : 'Colaboradores en Falta'}
                      </Button>
                    </Stack>

                    {/* Resumen de Evidencias y Colaboradores */}
                    {(item.evidence_url || item.non_compliant_collaborators) && (
                      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
                        {item.evidence_url && (
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            {isImageUrl(item.evidence_url) && (
                              <Tooltip title="Clic para ampliar imagen">
                                <Box
                                  component="img"
                                  src={resolveEvidenceUrl(item.evidence_url)}
                                  alt="Miniatura evidencia"
                                  onClick={() => setPreviewModalUrl(resolveEvidenceUrl(item.evidence_url))}
                                  onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    objectFit: 'cover',
                                    border: '1px solid #90caf9',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    '&:hover': { transform: 'scale(1.15)', borderColor: '#1976d2' },
                                  }}
                                />
                              </Tooltip>
                            )}
                            <Chip
                              icon={<InsertLinkIcon fontSize="small" />}
                              label="Ver Evidencia"
                              color="info"
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const url = resolveEvidenceUrl(item.evidence_url);
                                if (isImageUrl(url)) {
                                  setPreviewModalUrl(url);
                                } else {
                                  window.open(url, '_blank');
                                }
                              }}
                              onDelete={() => removeEvidence(item._key)}
                              deleteIcon={<Tooltip title="Quitar evidencia"><DeleteIcon fontSize="small" /></Tooltip>}
                              sx={{ fontWeight: 600, cursor: 'pointer' }}
                            />
                          </Stack>
                        )}
                        {item.non_compliant_collaborators && (
                          <Chip
                            icon={<GroupIcon fontSize="small" />}
                            label={`Colaborador(es): ${item.non_compliant_collaborators}`}
                            color="warning"
                            size="small"
                            variant="outlined"
                            onClick={() => openCollaboratorsModal(item._key)}
                            onDelete={() => setItemField(item._key, 'non_compliant_collaborators', null)}
                            deleteIcon={<Tooltip title="Quitar colaboradores"><DeleteIcon fontSize="small" /></Tooltip>}
                            sx={{ fontWeight: 600, cursor: 'pointer' }}
                          />
                        )}
                      </Stack>
                    )}

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
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar')}
        </Fab>
      </Box>

      {/* Modal / Pestaña para Subir Evidencias o Link */}
      <Dialog
        open={evidenceModalItemKey !== null}
        onClose={() => !uploadingEvidence && setEvidenceModalItemKey(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Evidencias del Punto de Control
        </DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={evidenceTab}
            onChange={(_, val) => setEvidenceTab(val)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Subir Archivo / Foto" />
            <Tab icon={<InsertLinkIcon />} iconPosition="start" label="Link / URL Web" />
          </Tabs>

          {evidenceTab === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <input
                type="file"
                id="audit-evidence-file"
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={uploadingEvidence}
              />
              <label htmlFor="audit-evidence-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploadingEvidence}
                  sx={{ textTransform: 'none', py: 1.5, px: 3, borderRadius: 2 }}
                >
                  {uploadingEvidence ? 'Subiendo archivo...' : 'Seleccionar o Tomar Foto / Archivo'}
                </Button>
              </label>

              {uploadingEvidence && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Subiendo evidencia al servidor...</Typography>
                </Box>
              )}

              {evidenceUrlInput && !uploadingEvidence && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                    Archivo cargado:
                  </Typography>
                  {isImageUrl(evidenceUrlInput) && (
                    <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                      <Box
                        component="img"
                        src={resolveEvidenceUrl(evidenceUrlInput)}
                        alt="Vista previa evidencia"
                        onClick={() => setPreviewModalUrl(resolveEvidenceUrl(evidenceUrlInput))}
                        onError={(e: any) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 1.5,
                          border: '1px solid #bbdefb',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          transition: 'opacity 0.2s',
                          '&:hover': { opacity: 0.85 },
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        (Clic en la foto para ampliar)
                      </Typography>
                    </Box>
                  )}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', maxWidth: '75%', fontSize: '0.8rem' }}>
                      {evidenceUrlInput}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Abrir en nueva pestaña">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => window.open(resolveEvidenceUrl(evidenceUrlInput), '_blank')}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar archivo">
                        <IconButton size="small" color="error" onClick={() => setEvidenceUrlInput('')}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="Enlace / URL de la Evidencia"
                placeholder="https://drive.google.com/... o enlace a la foto"
                value={evidenceUrlInput}
                onChange={(e) => setEvidenceUrlInput(e.target.value)}
                helperText="Pega aquí el enlace de la fotografía, documento o carpeta compartida"
              />
              {evidenceUrlInput && (
                <Box sx={{ mt: 2 }}>
                  {isImageUrl(evidenceUrlInput) && (
                    <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                      <Box
                        component="img"
                        src={resolveEvidenceUrl(evidenceUrlInput)}
                        alt="Vista previa"
                        onClick={() => setPreviewModalUrl(resolveEvidenceUrl(evidenceUrlInput))}
                        onError={(e: any) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 1.5,
                          border: '1px solid #bbdefb',
                          cursor: 'pointer',
                        }}
                      />
                    </Box>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(resolveEvidenceUrl(evidenceUrlInput), '_blank')}
                    sx={{ textTransform: 'none' }}
                  >
                    Probar enlace en nueva pestaña
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEvidenceModalItemKey(null)} disabled={uploadingEvidence}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveEvidenceUrl} disabled={uploadingEvidence}>
            Guardar Evidencia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal / Pestaña para Colaboradores en Falta / Incumplimiento */}
      <Dialog
        open={collaboratorModalItemKey !== null}
        onClose={() => setCollaboratorModalItemKey(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Colaboradores en Falta o Incumplimiento
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleccione del catálogo o escriba el nombre de los colaboradores asociados a esta no conformidad u observación:
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={collaboratorOptions}
              value={selectedCollaborators}
              onChange={(_, newValue) => setSelectedCollaborators(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Colaboradores"
                  placeholder="Seleccione o escriba nombres de colaboradores..."
                  helperText="Presione Enter después de cada nombre si desea ingresar uno nuevo"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    color="warning"
                    variant="filled"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                ))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCollaboratorModalItemKey(null)}>
            Cancelar
          </Button>
          <Button variant="contained" color="warning" onClick={saveCollaborators}>
            Guardar Colaboradores
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Visor de Evidencia / Lightbox */}
      <Dialog
        open={Boolean(previewModalUrl)}
        onClose={() => setPreviewModalUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Visualizador de Evidencia
          </Typography>
          <Stack direction="row" spacing={1}>
            {previewModalUrl && (
              <Button
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(previewModalUrl, '_blank')}
                sx={{ textTransform: 'none' }}
              >
                Abrir en pestaña
              </Button>
            )}
            <IconButton onClick={() => setPreviewModalUrl(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 2, backgroundColor: '#0f172a' }}>
          {previewModalUrl && (
            <Box
              component="img"
              src={previewModalUrl}
              alt="Evidencia ampliada"
              sx={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
