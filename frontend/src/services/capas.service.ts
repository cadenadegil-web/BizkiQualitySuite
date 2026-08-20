import api from "../api/axios";

export async function getCapas() {
  const response = await api.get("/capas");

  return response.data;
}

export async function getCapa(id: string) {
  const response = await api.get(`/capas/${id}`);

  return response.data;
}

export async function createCapa(data: any) {
  const response = await api.post(
    "/capas",
    data,
  );

  return response.data;
}

export async function updateCapa(
  id: string,
  data: any,
) {
  const response = await api.put(
    `/capas/${id}`,
    data,
  );

  return response.data;
}

export async function deleteCapa(id: string) {
  return api.delete(`/capas/${id}`);
}

export async function getCapasByFinding(findingId: string) {
  const response = await api.get(`/capas/finding/${findingId}`);
  return response.data;
}