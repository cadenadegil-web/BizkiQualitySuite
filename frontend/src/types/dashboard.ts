export interface DashboardSummary {
  total_findings: number;
  open_findings: number;
  closed_findings: number;
  critical_findings: number;
  major_findings: number;
  minor_findings: number;
}

export interface DashboardChart {
  label: string;
  total: number;
}

export interface DashboardRecentFinding {
  code: string;
  area: string;
  classification: string;
  status: string;
  responsible: string;
  process: string;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  by_area: DashboardChart[];
  by_status: DashboardChart[];
  by_classification: DashboardChart[];
  recent_findings: DashboardRecentFinding[];
}
