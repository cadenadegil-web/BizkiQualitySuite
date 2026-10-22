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

    const areaSlug = optionsOrDate.areaName
      ? `_${optionsOrDate.areaName.toLowerCase().replace(/\s+/g, '_')}`
      : '';
    const s = optionsOrDate.startDate || optionsOrDate.reportDate || 'fecha';
    const e = optionsOrDate.endDate || s;
    filename =
      s === e
        ? `informe_auditorias${areaSlug}_${s}.pdf`
        : `informe_auditorias${areaSlug}_${s}_al_${e}.pdf`;
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
