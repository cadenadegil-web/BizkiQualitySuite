import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { getFinding } from "../../services/findings.service";
import FindingDetails from "./FindingDetails";

export default function FindingViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return navigate("/findings");
      setLoading(true);
      try {
        const data = await getFinding(id);
        setFinding(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || "Error cargando hallazgo.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Alert severity="error">{error}</Alert>
  );

  return (
    <>
      {finding && <FindingDetails finding={finding} />}
    </>
  );
}
