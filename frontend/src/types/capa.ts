export interface CAPA {
  id: string;
  code: string;
  finding_id: string;
  title: string;
  description: string;
  action_type: string;
  priority: string;
  responsible: string;
  target_date: string;
  completion_date?: string | null;
  effectiveness_review?: string | null;
  effectiveness_date?: string | null;
  status: string;
  comments?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
