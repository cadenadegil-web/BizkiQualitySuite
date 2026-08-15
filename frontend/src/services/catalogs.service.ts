import api from "../api/axios";

export interface CatalogItem {
  id: string;
  name: string;
  active: boolean;
  description?: string;
  category?: string;
}

export type CatalogType = "areas" | "classifications" | "statuses" | "norms";

export async function getCatalogItems(type: CatalogType): Promise<CatalogItem[]> {
  const response = await api.get(`/catalogs/${type}`);
  return response.data;
}

export async function createCatalogItem(type: CatalogType, data: { name: string; description?: string; category?: string; active?: boolean }): Promise<CatalogItem> {
  const response = await api.post(`/catalogs/${type}`, data);
  return response.data;
}

export async function updateCatalogItem(type: CatalogType, id: string, data: { name?: string; description?: string; category?: string; active?: boolean }): Promise<CatalogItem> {
  const response = await api.put(`/catalogs/${type}/${id}`, data);
  return response.data;
}

export async function deleteCatalogItem(type: CatalogType, id: string): Promise<any> {
  const response = await api.delete(`/catalogs/${type}/${id}`);
  return response.data;
}
