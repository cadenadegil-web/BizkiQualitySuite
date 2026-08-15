import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  IconButton, LinearProgress, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { useAudit } from '../../hooks/useAudits';
import { completeAudit, downloadAuditPDF } from '../../services/audits.service';
import { useState } from 'react';

const RESULT_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode }> = {
  CONFORME: { label: 'Conforme', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  NO_CONFORME: { label: 'No Conforme', color: 'error', icon: <CancelIcon fontSize="small" /> },
  OBSERVACION: { label: 'Observación', color: 'warning', icon: <WarningIcon fontSize="small" /> },
};

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: audit, isLoading, error, refetch } = useAudit(id!);
  const [completing, setCompleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/audits')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{audit.code}</Typography>
          <Typography variant="body2" color="text.secondary">
            {audit.area?.name ?? '—'} · {audit.shift} · {new Intl.DateTimeFormat('es-ES').format(new Date(audit.audit_date + 'T00:00:00'))}
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Auditor', value: audit.auditor },
          { label: 'Estado', value: <Chip label={audit.status === 'COMPLETADA' ? 'Completada' : 'Pendiente'} color={audit.status === 'COMPLETADA' ? 'success' : 'warning'} size="small" /> },
          { label: 'Puntaje', value: audit.score !== null ? `${audit.score}%` : '—' },
          { label: 'Puntos evaluados', value: total },
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>Checklist de Control</Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  {['#', 'Norma', 'Punto de Control', 'Resultado', 'Comentario'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {audit.items.map((item, idx) => {
                  const cfg = item.result ? RESULT_CONFIG[item.result] : null;
                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        backgroundColor: item.result === 'NO_CONFORME' ? '#fff5f5' : item.result === 'CONFORME' ? '#f5fff5' : 'inherit',
                        '&:hover': { backgroundColor: '#f8f8f8' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#1976d2', width: 40 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12, color: '#555' }}>{item.norm}</TableCell>
                      <TableCell>{item.control_point}</TableCell>
                      <TableCell>
                        {cfg ? (
                          <Chip
                            size="small"
                            icon={cfg.icon as React.ReactElement}
                            label={cfg.label}
                            color={cfg.color as any}
                            variant="filled"
                          />
                        ) : (
                          <Chip size="small" icon={<HourglassEmptyIcon fontSize="small" />} label="Pendiente" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#666' }}>{item.comment ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
