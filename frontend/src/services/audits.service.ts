import api from '../api/axios';
import { Audit, AuditCreate } from '../types/audit';

export async function getAudits(): Promise<Audit[]> {
  const res = await api.get('/audits');
  return res.data;
}

export async function getAudit(id: string): Promise<Audit> {
  const res = await api.get(`/audits/${id}`);
  return res.data;
}

export async function createAudit(data: AuditCreate): Promise<Audit> {
  const res = await api.post('/audits/', data);
  return res.data;
}

export async function updateAudit(id: string, data: AuditCreate | Partial<AuditCreate>): Promise<Audit> {
  const res = await api.put(`/audits/${id}`, data);
  return res.data;
}

export async function completeAudit(id: string): Promise<Audit> {
  const res = await api.post(`/audits/${id}/complete`);
  return res.data;
}

export async function deleteAudit(id: string): Promise<void> {
  await api.delete(`/audits/${id}`);
}

export async function uploadAuditEvidence(file: File): Promise<{ url: string; original_name: string; stored_name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/audits/upload-evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Resuelve la URL real accesible para un archivo o enlace de evidencia.
 * Corrige URLs que fueron guardadas con el origen del frontend (Vercel)
 * o URLs relativas, redirigiéndolas al backend real (Render / Local).
 */
export function resolveEvidenceUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  const apiBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  // Si ya apunta a un servicio externo (Google Drive, Dropbox, Cloudinary, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Si contiene la ruta de evidencia pero apuntando al dominio equivocado (ej: frontend de Vercel)
    if (trimmed.includes('/audits/evidence/')) {
      const idx = trimmed.indexOf('/audits/evidence/');
      return `${apiBase}${trimmed.substring(idx)}`;
    }
    return trimmed;
  }

  // Si es una ruta relativa (ej. /audits/evidence/... o audits/evidence/...)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.bmp') ||
    clean.endsWith('.svg') ||
    clean.includes('/evidence/')
  );
}

export async function downloadAuditPDF(id: string, code: string): Promise<void> {
  const res = await api.get(`/audits/${id}/report`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_${code}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ReportFilterOptions {
  reportDate?: string;
  startDate?: string;
  endDate?: string;
  areaId?: string;
  areaName?: string;
  plant?: string;
}

export async function downloadDailyReportPDF(
  optionsOrDate: string | ReportFilterOptions
): Promise<void> {
  const params: Record<string, string> = {};
  let filename = 'informe_auditorias.pdf';

  if (typeof optionsOrDate === 'string') {
    params.report_date = optionsOrDate;
    filename = `informe_diario_${optionsOrDate}.pdf`;
  } else {
    if (optionsOrDate.startDate) params.start_date = optionsOrDate.startDate;
    if (optionsOrDate.endDate) params.end_date = optionsOrDate.endDate;
    if (optionsOrDate.reportDate && !optionsOrDate.startDate) {
      params.report_date = optionsOrDate.reportDate;
    }
    if (optionsOrDate.areaId) params.area_id = optionsOrDate.areaId;
    if (optionsOrDate.plant) params.plant = optionsOrDate.plant;

    const plantSlug = optionsOrDate.plant
      ? `_${optionsOrDate.plant.toLowerCase().replace(/\s+/g, '_')}`
      : '';
    const areaSlug = optionsOrDate.areaName
      ? `_${optionsOrDate.areaName.toLowerCase().replace(/\s+/g, '_')}`
      : '';
    const s = optionsOrDate.startDate || optionsOrDate.reportDate || 'fecha';
    const e = optionsOrDate.endDate || s;
    filename =
      s === e
        ? `informe_auditorias${plantSlug}${areaSlug}_${s}.pdf`
        : `informe_auditorias${plantSlug}${areaSlug}_${s}_al_${e}.pdf`;
  }

  try {
    const res = await api.get('/audits/reports/daily', {
      params,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed?.detail) {
          throw new Error(parsed.detail);
        }
      } catch (parseErr: any) {
        if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
          throw parseErr;
        }
      }
    }
    throw err;
  }
}
