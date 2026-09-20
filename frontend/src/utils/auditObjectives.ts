import { Audit } from '../types/audit';

export const COMMON_OBJECTIVES = [
  'Personal',
  'Control de Plagas',
  'Control de Químicos',
  'Limpieza e Instalaciones',
  'Equipos y Utensilios',
  'Control de Procesos',
  'Trazabilidad y Etiquetado',
  'Almacenamiento',
  'Control de Alérgenos',
  'Puntos Críticos (HACCP)',
  'Seguridad y Salud (SST)',
  'Control de Calidad',
  'Defensa y Fraude Alimentario',
  'Manejo de Desechos',
] as const;

export function classifyAuditItemObjective(norm: string, controlPoint: string): string {
  const text = `${norm} ${controlPoint}`.toLowerCase();
  
  if (['plaga', 'roedor', 'insecto', 'cebadero', 'desratiz', 'fumiga', 'infestaci'].some(w => text.includes(w))) {
    return 'Control de Plagas';
  }
  if (['químic', 'quimic', 'sustancia', 'detergente', 'desinfectante', 'msds', 'fds', 'reactivo'].some(w => text.includes(w))) {
    return 'Control de Químicos';
  }
  if (['personal', 'uniforme', 'epp', 'manos', 'joya', 'uña', 'salud', 'enfermedad', 'manipulador', 'higiene personal'].some(w => text.includes(w))) {
    return 'Personal';
  }
  if (['alergen', 'alérgen'].some(w => text.includes(w))) {
    return 'Control de Alérgenos';
  }
  if (['calibra', 'equipo', 'utensilio', 'mantenimiento', 'balanza', 'termómetro', 'termometro'].some(w => text.includes(w))) {
    return 'Equipos y Utensilios';
  }
  if (['térmic', 'termic', 'temperatura', 'humedad', 'cocción', 'coccion', 'enfriamiento', 'horno'].some(w => text.includes(w))) {
    return 'Control de Procesos';
  }
  if (['trazabil', 'lote', 'etiqueta', 'caducidad', 'vencimiento'].some(w => text.includes(w))) {
    return 'Trazabilidad y Etiquetado';
  }
  if (['almacén', 'almacen', 'peps', 'inventario', 'estiba', 'tarima', 'bodega'].some(w => text.includes(w))) {
    return 'Almacenamiento';
  }
  if (['limpi', 'instalaci', 'polvo', 'telaraña', 'telarana', 'drenaje', 'saneamiento', 'poes'].some(w => text.includes(w))) {
    return 'Limpieza e Instalaciones';
  }
  if (['desecho', 'merma', 'reproceso', 'desperdicio', 'food loss'].some(w => text.includes(w))) {
    return 'Manejo de Desechos';
  }
  if (['pcc', 'haccp', 'punto crítico', 'punto critico', 'peligro'].some(w => text.includes(w))) {
    return 'Puntos Críticos (HACCP)';
  }
  if (['extintor', 'evacuaci', 'primeros auxilios', 'botiquín', 'botiquin', 'sst'].some(w => text.includes(w))) {
    return 'Seguridad y Salud (SST)';
  }
  if (['muestra', 'laboratorio', 'calidad', 'especificación', 'especificacion'].some(w => text.includes(w))) {
    return 'Control de Calidad';
  }
  if (['defense', 'fraud', 'defensa', 'fraude', 'sabotaje'].some(w => text.includes(w))) {
    return 'Defensa y Fraude Alimentario';
  }
  return 'Control General';
}

export function getAuditObjectives(audit: Audit): string[] {
  if (audit.objectives && audit.objectives.length > 0) {
    return audit.objectives;
  }
  if (audit.measurement_objective) {
    return audit.measurement_objective.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (audit.items && audit.items.length > 0) {
    const list: string[] = [];
    for (const item of audit.items) {
      const obj = item.objective || classifyAuditItemObjective(item.norm, item.control_point);
      if (obj && !list.includes(obj)) {
        list.push(obj);
      }
    }
    return list;
  }
  return [];
}

export function getObjectiveColor(objective: string): { bg: string; color: string; border: string } {
  switch (objective) {
    case 'Personal':
      return { bg: '#e3f2fd', color: '#0d47a1', border: '#90caf9' };
    case 'Control de Plagas':
      return { bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7' };
    case 'Control de Químicos':
      return { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' };
    case 'Limpieza e Instalaciones':
      return { bg: '#ede7f6', color: '#4a148c', border: '#b39ddb' };
    case 'Equipos y Utensilios':
      return { bg: '#e0f2f1', color: '#004d40', border: '#80cbc4' };
    case 'Control de Procesos':
      return { bg: '#fbe9e7', color: '#bf360c', border: '#ffab91' };
    case 'Trazabilidad y Etiquetado':
      return { bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' };
    case 'Almacenamiento':
      return { bg: '#eceff1', color: '#263238', border: '#b0bec5' };
    case 'Control de Alérgenos':
      return { bg: '#fce4ec', color: '#880e4f', border: '#f48fb1' };
    case 'Puntos Críticos (HACCP)':
      return { bg: '#ffebee', color: '#b71c1c', border: '#ef9a9a' };
    case 'Seguridad y Salud (SST)':
      return { bg: '#fffde7', color: '#f57f17', border: '#fff59d' };
    case 'Control de Calidad':
      return { bg: '#e1f5fe', color: '#01579b', border: '#81d4fa' };
    default:
      return { bg: '#f5f5f5', color: '#424242', border: '#e0e0e0' };
  }
}
