import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";

interface Props {
  defaultValues?: any;
  onSubmit: (values: any) => void;
}

const priorities = ["Baja", "Media", "Alta"];
const statuses = ["ABIERTA", "EN PROCESO", "CERRADA"];
const actionTypes = ["Correctiva", "Preventiva", "Mixta"];

export default function CapaForm({ defaultValues, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      action_type: "Correctiva",
      priority: "Media",
      responsible: "",
      target_date: "",
      status: "ABIERTA",
      comments: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      title: "",
      description: "",
      action_type: "Correctiva",
      priority: "Media",
      responsible: "",
      target_date: "",
      status: "ABIERTA",
      comments: "",
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Datos de CAPA
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Título"
            {...register("title", { required: "El título es obligatorio." })}
            error={!!errors.title}
            helperText={errors.title?.message?.toString()}
            fullWidth
          />

          <TextField
            label="Descripción"
            multiline
            minRows={4}
            {...register("description", { required: "La descripción es obligatoria." })}
            error={!!errors.description}
            helperText={errors.description?.message?.toString()}
            fullWidth
          />

          <TextField select label="Tipo de acción" {...register("action_type")} fullWidth>
            {actionTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField select label="Prioridad" {...register("priority")} fullWidth>
            {priorities.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Responsable"
            {...register("responsible", { required: "El responsable es obligatorio." })}
            error={!!errors.responsible}
            helperText={errors.responsible?.message?.toString()}
            fullWidth
          />

          <TextField
            label="Fecha objetivo"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("target_date", { required: "La fecha objetivo es obligatoria." })}
            error={!!errors.target_date}
            helperText={errors.target_date?.message?.toString()}
            fullWidth
          />

          <TextField select label="Estado" {...register("status")} fullWidth>
            {statuses.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Comentarios"
            multiline
            minRows={3}
            {...register("comments")}
            fullWidth
          />

          <Button type="submit" variant="contained">
            Guardar CAPA
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
