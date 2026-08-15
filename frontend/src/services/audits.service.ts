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

export async function downloadDailyReportPDF(date: string): Promise<void> {
  const res = await api.get('/audits/reports/daily', {
    params: { report_date: date },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe_diario_${date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
