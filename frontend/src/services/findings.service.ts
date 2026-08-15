import api from "../api/axios";

import { Finding } from "../types/finding";

export async function getFindings(): Promise<Finding[]> {

  const response = await api.get("/findings");

  return response.data;

}

export async function getFinding(
  id: string,
): Promise<Finding> {

  const response = await api.get(
    `/findings/${id}`,
  );

  return response.data;

}

export async function createFinding(
  data: any,
) {

  const response = await api.post(
    "/findings",
    data,
  );

  return response.data;

}

export async function updateFinding(
  id: string,
  data: any,
) {

  const response = await api.put(
    `/findings/${id}`,
    data,
  );

  return response.data;

}

export async function deleteFinding(
  id: string,
) {

  return api.delete(
    `/findings/${id}`,
  );

}