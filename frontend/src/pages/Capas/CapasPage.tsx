import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
} from "@mui/material";

import { getCapas } from "../../services/capas.service";

export default function CapasPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["capas"],
    queryFn: getCapas,
  });

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Plan de Acción Correctiva (CAP)</Typography>
        <Button variant="contained" onClick={() => navigate("/capas/new")}>Nuevo Plan de Acción (CAP)</Button>
      </Box>

      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">No se pudieron cargar los Planes de Acción (CAP).</Alert>
          ) : (
            <List>
              {(data ?? []).map((capa: any) => (
                <ListItem key={capa.id} divider>
                  <ListItemText
                    primary={`${capa.code} — ${capa.title}`}
                    secondary={`Estado: ${capa.status} • Responsable: ${capa.responsible} • Fecha objetivo: ${capa.target_date}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </>
  );
}
