import { useQuery } from "@tanstack/react-query";

import { getEvidences } from "../services/evidences.service";

export function useEvidences() {
  return useQuery({
    queryKey: ["evidences"],
    queryFn: getEvidences,
  });
}
