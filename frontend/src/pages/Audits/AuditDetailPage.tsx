import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, LinearProgress, Paper, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

import { useAudit } from '../../hooks/useAudits';
import { completeAudit, downloadAuditPDF, updateAudit, uploadAuditEvidence, resolveEvidenceUrl, isImageUrl } from '../../services/audits.service';
import { getCatalogItems } from '../../services/catalogs.service';
import { AuditItem } from '../../types/audit';
import { classifyAuditItemObjective, getAuditObjectives, getObjectiveColor } from '../../utils/auditObjectives';
import { useState, useEffect } from 'react';

const RESULT_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode }> = {
  CONFORME: { label: 'Conforme', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  NO_CONFORME: { label: 'No Conforme', color: 'error', icon: <CancelIcon fontSize="small" /> },
  OBSERVACION: { label: 'Observación', color: 'warning', icon: <WarningIcon fontSize="small" /> },
};

const RESULT_OPTIONS: { value: 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null; label: string; color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode }[] = [
  { value: 'CONFORME', label: 'Conforme', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  { value: 'NO_CONFORME', label: 'No Conforme', color: 'error', icon: <CancelIcon fontSize="small" /> },
  { value: 'OBSERVACION', label: 'Observación', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  { value: null, label: 'Pendiente', color: 'default', icon: <HourglassEmptyIcon fontSize="small" /> },
];

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: audit, isLoading, error, refetch } = useAudit(id!);
  const [completing, setCompleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [editingItem, setEditingItem] = useState<AuditItem | null>(null);
  const [editResult, setEditResult] = useState<'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editEvidenceUrl, setEditEvidenceUrl] = useState('');
  const [editCollaborators, setEditCollaborators] = useState<string[]>([]);
  const [evidenceTab, setEvidenceTab] = useState<number>(0);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [collaboratorOptions, setCollaboratorOptions] = useState<string[]>([]);
  const [savingItem, setSavingItem] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    getCatalogItems('collaborators')
      .then((list) =>
        setCollaboratorOptions(
          list
            .filter((c) => c.active)
            .map((c) => {
              const code = c.employee_code ? `[${c.employee_code}] ` : "";
              const pos = c.position ? ` - ${c.position}` : "";
              return `${code}${c.name}${pos}`;
            })
        )
      )
      .catch(() => {});
  }, []);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error || !audit) return <Alert severity="error">No se encontró la auditoría.</Alert>;

  const handleComplete = async () => {
    if (!confirm('¿Completar la auditoría? Se generarán hallazgos para las no conformidades.')) return;
    setCompleting(true);
    try { await completeAudit(audit.id); refetch(); } finally { setCompleting(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadAuditPDF(audit.id, audit.code); } finally { setDownloading(false); }
  };

  const conformes = audit.items.filter(it => it.result === 'CONFORME').length;
  const noConformes = audit.items.filter(it => it.result === 'NO_CONFORME').length;
  const observaciones = audit.items.filter(it => it.result === 'OBSERVACION').length;
  const total = audit.items.length;

  const handleOpenEdit = (item: AuditItem) => {
    setEditingItem(item);
    setEditResult(item.result);
    setEditComment(item.comment || '');
    setEditEvidenceUrl(item.evidence_url || '');
    setEditCollaborators(
      item.non_compliant_collaborators
        ? item.non_compliant_collaborators.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    );
    setEvidenceTab(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    try {
      const res = await uploadAuditEvidence(file);
      const fullUrl = resolveEvidenceUrl(res.url);
      setEditEvidenceUrl(fullUrl);
      setSnack({ open: true, message: 'Evidencia cargada exitosamente.', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Error al subir la evidencia.', severity: 'error' });
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem || !audit) return;
    setSavingItem(true);
    try {
      const resolvedUrl = editEvidenceUrl.trim() ? resolveEvidenceUrl(editEvidenceUrl.trim()) : null;
      const updatedItems = audit.items.map(it => {
        if (it.id === editingItem.id) {
          return {
            order: it.order,
            norm: it.norm,
            control_point: it.control_point,
            result: editResult,
            comment: editComment.trim() || null,
            non_compliant_collaborators: editCollaborators.length > 0 ? editCollaborators.join(', ') : null,
            evidence_url: resolvedUrl,
          };
        }
        return {
          order: it.order,
          norm: it.norm,
          control_point: it.control_point,
          result: it.result,
          comment: it.comment,
          non_compliant_collaborators: it.non_compliant_collaborators,
          evidence_url: it.evidence_url,
        };
      });

      await updateAudit(audit.id, {
        audit_date: audit.audit_date,
        shift: audit.shift,
        auditor: audit.auditor,
        observations: audit.observations || undefined,
        area_id: audit.area_id,
        items: updatedItems,
      });

      setSnack({ open: true, message: 'Punto de control actualizado correctamente', severity: 'success' });
      setEditingItem(null);
      refetch();
    } catch {
      setSnack({ open: true, message: 'Error al actualizar el punto', severity: 'error' });
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/audits')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{audit.code}</Typography>
          <Typography variant="body2" color="text.secondary">
            {(audit.plant || audit.area?.plant || 'MDH')} · {audit.area?.name ?? '—'} · {audit.shift} · {new Intl.DateTimeFormat('es-ES').format(new Date(audit.audit_date + 'T00:00:00'))}
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/audits/edit/${audit.id}`)}
            sx={{ textTransform: 'none' }}
          >
            Editar
          </Button>
          {audit.status === 'PENDIENTE' && (
            <Button
              variant="contained" color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleComplete} disabled={completing}
              sx={{ textTransform: 'none' }}
            >
              {completing ? 'Completando...' : 'Completar'}
            </Button>
          )}
          <Button
            variant="outlined" color="error"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownload} disabled={downloading}
            sx={{ textTransform: 'none' }}
          >
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </Button>
        </Stack>
      </Stack>

      {/* Info cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Planta', value: audit.plant || audit.area?.plant || 'MDH' },
          { label: 'Responsable de Área', value: audit.area_responsible || '—' },
          { label: 'Auditor', value: audit.auditor },
          { label: 'Estado', value: <Chip label={audit.status === 'COMPLETADA' ? 'Completada' : 'Pendiente'} color={audit.status === 'COMPLETADA' ? 'success' : 'warning'} size="small" /> },
          { label: 'Puntaje', value: audit.score !== null ? `${audit.score}% (${total} pts)` : `— (${total} pts)` },
        ].map(item => (
          <Card key={item.label} elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Score bar */}
      {audit.score !== null && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Puntaje global</Typography>
            <Typography variant="body2" fontWeight={700}>{audit.score}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={audit.score}
            sx={{
              height: 12, borderRadius: 6,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: audit.score >= 80 ? '#2e7d32' : audit.score >= 60 ? '#ed6c02' : '#c62828',
                borderRadius: 6,
              },
            }}
          />
          <Stack direction="row" gap={2} sx={{ mt: 1 }}>
            <Chip size="small" icon={<CheckCircleIcon />} label={`${conformes} Conformes`} color="success" variant="outlined" />
            <Chip size="small" icon={<CancelIcon />} label={`${noConformes} No Conformes`} color="error" variant="outlined" />
            <Chip size="small" icon={<WarningIcon />} label={`${observaciones} Observaciones`} color="warning" variant="outlined" />
          </Stack>
        </Box>
      )}

      {/* Observations */}
      {audit.observations && (
        <Card sx={{ mb: 3, borderRadius: 2, backgroundColor: '#f3f8ff' }} elevation={0}>
          <CardContent>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>Observaciones generales</Typography>
            <Typography variant="body2">{audit.observations}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Checklist table */}
      <Card sx={{ borderRadius: 2 }} elevation={2}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>Checklist de Control</Typography>
            <Typography variant="body2" color="text.secondary">
              💡 Haz clic sobre cualquier fila o en el botón de lápiz para editar el resultado o comentario directamente.
            </Typography>
          </Box>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  {['#', 'Objetivo de Medición', 'Norma', 'Punto de Control', 'Resultado', 'Comentario', 'Acción'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {audit.items.map((item, idx) => {
                  const cfg = item.result ? RESULT_CONFIG[item.result] : null;
                  const itemObj = item.objective || classifyAuditItemObjective(item.norm, item.control_point);
                  const objColor = getObjectiveColor(itemObj);
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => handleOpenEdit(item)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: item.result === 'NO_CONFORME' ? '#fff5f5' : item.result === 'CONFORME' ? '#f5fff5' : 'inherit',
                        '&:hover': { backgroundColor: '#e8f4fd !important' },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#1976d2', width: 40 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', width: 170 }}>
                        <Chip
                          label={itemObj}
                          size="small"
                          sx={{
                            backgroundColor: objColor.bg,
                            color: objColor.color,
                            border: `1px solid ${objColor.border}`,
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12, color: '#555' }}>{item.norm}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {item.control_point}
                        {(item.evidence_url || item.non_compliant_collaborators) && (
                          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mt: 0.8 }}>
                            {item.evidence_url && (
                              <Stack direction="row" spacing={0.6} alignItems="center">
                                {isImageUrl(item.evidence_url) && (
                                  <Tooltip title="Clic para ampliar imagen">
                                    <Box
                                      component="img"
                                      src={resolveEvidenceUrl(item.evidence_url)}
                                      alt="Evidencia"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewModalUrl(resolveEvidenceUrl(item.evidence_url));
                                      }}
                                      onError={(e: any) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 0.8,
                                        objectFit: 'cover',
                                        border: '1px solid #90caf9',
                                        cursor: 'pointer',
                                        '&:hover': { transform: 'scale(1.2)' },
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                <Chip
                                  size="small"
                                  icon={<InsertLinkIcon fontSize="small" />}
                                  label="Evidencia"
                                  color="info"
                                  variant="outlined"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = resolveEvidenceUrl(item.evidence_url);
                                    if (isImageUrl(url)) {
                                      setPreviewModalUrl(url);
                                    } else {
                                      window.open(url, '_blank');
                                    }
                                  }}
                                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                                />
                              </Stack>
                            )}
                            {item.non_compliant_collaborators && (
                              <Chip
                                size="small"
                                icon={<GroupIcon fontSize="small" />}
                                label={`Colaborador(es): ${item.non_compliant_collaborators}`}
                                color="warning"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Haz clic para cambiar el resultado">
                            {cfg ? (
                              <Chip
                                size="small"
                                icon={cfg.icon as React.ReactElement}
                                label={cfg.label}
                                color={cfg.color as any}
                                variant="filled"
                                sx={{ fontWeight: 600, cursor: 'pointer' }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                icon={<HourglassEmptyIcon fontSize="small" />}
                                label="Pendiente"
                                variant="outlined"
                                sx={{ fontWeight: 600, cursor: 'pointer' }}
                              />
                            )}
                          </Tooltip>
                          {item.finding && item.finding.active && (
                            <Tooltip title="Ver No Conformidad vinculada">
                              <Chip
                                size="small"
                                label={item.finding.code}
                                color="error"
                                variant="outlined"
                                clickable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/findings');
                                }}
                                sx={{ fontWeight: 700 }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#666' }}>{item.comment ?? '—'}</TableCell>
                      <TableCell sx={{ width: 60 }}>
                        <Tooltip title="Editar este punto">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para edición directa del punto de control */}
      <Dialog
        open={Boolean(editingItem)}
        onClose={() => !savingItem && setEditingItem(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
            Editar Punto de Control
          </Typography>
          {editingItem && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              <strong>{editingItem.norm}:</strong> {editingItem.control_point}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ my: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Resultado:
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
              {RESULT_OPTIONS.map((opt) => (
                <Button
                  key={opt.label}
                  variant={editResult === opt.value ? 'contained' : 'outlined'}
                  color={opt.color === 'default' ? 'inherit' : opt.color}
                  startIcon={opt.icon}
                  onClick={() => setEditResult(opt.value)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: 600,
                    borderWidth: editResult === opt.value ? 2 : 1,
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </Stack>

            <TextField
              fullWidth
              label="Comentario u Observación"
              placeholder="Escribe detalles del hallazgo o notas..."
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              multiline
              rows={3}
              helperText={editResult === 'NO_CONFORME' ? 'Recomendado: Explica el motivo de la no conformidad' : ''}
              sx={{ mb: 2.5 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Sección de Colaboradores en Incumplimiento */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon fontSize="small" color="warning" /> Colaboradores en Falta o Incumplimiento:
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={collaboratorOptions}
                value={editCollaborators}
                onChange={(_, newValue) => setEditCollaborators(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Seleccionar o escribir colaboradores"
                    placeholder="Escriba o seleccione nombres..."
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

            <Divider sx={{ my: 2 }} />

            {/* Sección de Evidencias */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon fontSize="small" color="info" /> Evidencias (Foto / Archivo / Link):
              </Typography>
              <Tabs
                value={evidenceTab}
                onChange={(_, val) => setEvidenceTab(val)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}
              >
                <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Subir Archivo / Foto" sx={{ minHeight: 40 }} />
                <Tab icon={<InsertLinkIcon />} iconPosition="start" label="Link / URL Web" sx={{ minHeight: 40 }} />
              </Tabs>

              {evidenceTab === 0 ? (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <input
                    type="file"
                    id="detail-evidence-file"
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    disabled={uploadingEvidence}
                  />
                  <label htmlFor="detail-evidence-file">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={uploadingEvidence}
                      sx={{ textTransform: 'none', py: 1, px: 2.5, borderRadius: 2 }}
                    >
                      {uploadingEvidence ? 'Subiendo archivo...' : 'Seleccionar o Tomar Foto / Archivo'}
                    </Button>
                  </label>
                  {uploadingEvidence && (
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant="caption" color="text.secondary">Subiendo archivo...</Typography>
                    </Box>
                  )}
                  {editEvidenceUrl && !uploadingEvidence && (
                    <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#f0f7ff', borderRadius: 2, textAlign: 'left' }}>
                      {isImageUrl(editEvidenceUrl) && (
                        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                          <Box
                            component="img"
                            src={resolveEvidenceUrl(editEvidenceUrl)}
                            alt="Vista previa evidencia"
                            onClick={() => setPreviewModalUrl(resolveEvidenceUrl(editEvidenceUrl))}
                            onError={(e: any) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 180,
                              borderRadius: 1.5,
                              border: '1px solid #bbdefb',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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
                          {editEvidenceUrl}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Abrir en nueva pestaña">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => window.open(resolveEvidenceUrl(editEvidenceUrl), '_blank')}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar evidencia">
                            <IconButton size="small" color="error" onClick={() => setEditEvidenceUrl('')}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ pt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Enlace / URL de la Evidencia"
                    placeholder="https://..."
                    value={editEvidenceUrl}
                    onChange={(e) => setEditEvidenceUrl(e.target.value)}
                  />
                  {editEvidenceUrl && (
                    <Box sx={{ mt: 1 }}>
                      {isImageUrl(editEvidenceUrl) && (
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                          <Box
                            component="img"
                            src={resolveEvidenceUrl(editEvidenceUrl)}
                            alt="Vista previa"
                            onClick={() => setPreviewModalUrl(resolveEvidenceUrl(editEvidenceUrl))}
                            onError={(e: any) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 180,
                              borderRadius: 1.5,
                              border: '1px solid #bbdefb',
                              cursor: 'pointer',
                            }}
                          />
                        </Box>
                      )}
                      <Button
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(resolveEvidenceUrl(editEvidenceUrl), '_blank')}
                        sx={{ textTransform: 'none' }}
                      >
                        Probar enlace en nueva pestaña
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditingItem(null)} disabled={savingItem} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={savingItem}
            startIcon={<SaveIcon />}
            sx={{ textTransform: 'none', minWidth: 140 }}
          >
            {savingItem ? 'Guardando...' : 'Guardar'}
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

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
