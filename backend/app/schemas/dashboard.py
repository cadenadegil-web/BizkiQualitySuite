from pydantic import BaseModel


class DashboardCard(BaseModel):
    title: str
    value: int


class DashboardChart(BaseModel):
    label: str
    total: int


class DashboardRecentFinding(BaseModel):
    code: str
    area: str
    classification: str
    status: str
    responsible: str
    process: str


class DashboardSummary(BaseModel):
    total_findings: int
    open_findings: int
    closed_findings: int
    critical_findings: int
    major_findings: int
    minor_findings: int


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    by_area: list[DashboardChart]
    by_status: list[DashboardChart]
    by_classification: list[DashboardChart]
    recent_findings: list[DashboardRecentFinding]