import { useQuery } from '@tanstack/react-query';
import { getAudits, getAudit } from '../services/audits.service';

export function useAudits() {
  return useQuery({
    queryKey: ['audits'],
    queryFn: getAudits,
  });
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: ['audits', id],
    queryFn: () => getAudit(id),
    enabled: !!id,
  });
}
