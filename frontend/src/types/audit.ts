export interface AuditItem {
  id: string;
  audit_id: string;
  order: number;
  norm: string;
  control_point: string;
  objective?: string | null;
  result: 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null;
  comment: string | null;
  finding?: { id: string; code: string; active: boolean } | null;
}

export interface Audit {
  id: string;
  code: string;
  audit_date: string;   // ISO date string
  shift: string;        // Mañana / Tarde / Noche
  auditor: string;
  measurement_objective?: string | null;
  objectives?: string[];
  observations: string | null;
  status: 'PENDIENTE' | 'COMPLETADA';
  score: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  area_id: string;
  area?: { id: string; name: string; active: boolean };
  items: AuditItem[];
}

export interface AuditItemCreate {
  order: number;
  norm: string;
  control_point: string;
  objective?: string | null;
  result?: 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION' | null;
  comment?: string | null;
}

export interface AuditCreate {
  audit_date: string;
  shift: string;
  auditor: string;
  measurement_objective?: string;
  observations?: string;
  area_id: string;
  items: AuditItemCreate[];
}

export interface AuditUpdate {
  audit_date?: string;
  shift?: string;
  auditor?: string;
  measurement_objective?: string;
  observations?: string;
  area_id?: string;
  items?: AuditItemCreate[];
}

