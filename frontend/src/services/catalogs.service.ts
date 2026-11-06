import api from "../api/axios";

export interface CatalogItem {
  id: string;
  name: string;
  plant?: string | null;
  employee_code?: string | null;
  position?: string | null;
  active: boolean;
  description?: string;
  category?: string;
}

export type CatalogType =
  | "areas"
  | "classifications"
  | "statuses"
  | "norms"
  | "responsibles"
  | "auditors"
  | "collaborators"
  | "managements";

export async function getCatalogItems(type: CatalogType): Promise<CatalogItem[]> {
  const response = await api.get(`/catalogs/${type}`);
  return response.data;
}

export async function createCatalogItem(
  type: CatalogType,
  data: {
    name: string;
    plant?: string;
    employee_code?: string;
    position?: string;
    description?: string;
    category?: string;
    active?: boolean;
  }
): Promise<CatalogItem> {
  const response = await api.post(`/catalogs/${type}`, data);
  return response.data;
}

export async function updateCatalogItem(
  type: CatalogType,
  id: string,
  data: {
    name?: string;
    plant?: string | null;
    employee_code?: string | null;
    position?: string | null;
    description?: string;
    category?: string;
    active?: boolean;
  }
): Promise<CatalogItem> {
  const response = await api.put(`/catalogs/${type}/${id}`, data);
  return response.data;
}

export async function deleteCatalogItem(type: CatalogType, id: string): Promise<any> {
  const response = await api.delete(`/catalogs/${type}/${id}`);
  return response.data;
}
