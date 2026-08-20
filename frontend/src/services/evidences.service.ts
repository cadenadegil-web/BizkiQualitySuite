import api from "../api/axios";

export async function getEvidences() {
  const response = await api.get("/evidences");

  return response.data;
}

export async function getEvidencesByFinding(findingId: string) {
  const response = await api.get(`/evidences/finding/${findingId}`);

  return response.data;
}

export async function uploadEvidence(
  findingId: string,
  file: File,
) {
  const form = new FormData();

  form.append("file", file);

  const response = await api.post(
    `/evidences/upload/finding/${findingId}`,
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function uploadCapaEvidence(
  capaId: string,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post(
    `/evidences/upload/capa/${capaId}`,
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getEvidencesByCapa(capaId: string) {
  const response = await api.get(`/evidences/capa/${capaId}`);
  return response.data;
}