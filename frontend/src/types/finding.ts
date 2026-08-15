export interface CatalogItem {
  id: string;
  name: string;
  active: boolean;
}

export interface Finding {

  id: string;

  code: string;

  process: string;

  finding_type: string;

  description: string;

  responsible: string;

  created_at: string;

  active: boolean;

  // Catálogos (relaciones ORM devueltas por el backend)
  area?: CatalogItem;
  classification?: CatalogItem;
  status?: CatalogItem;

  // IDs de relación
  area_id?: string;
  classification_id?: string;
  status_id?: string;
  user_id?: string;

}