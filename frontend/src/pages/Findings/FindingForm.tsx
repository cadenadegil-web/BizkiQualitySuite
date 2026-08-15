import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  Controller,
  useForm,
} from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({

  process: z
    .string()
    .min(1, "Seleccione un proceso."),

  finding_type: z
    .string()
    .min(1, "Seleccione un tipo."),

  responsible: z
    .string()
    .min(1, "Responsable requerido."),

  description: z
    .string()
    .min(10, "La descripción es muy corta."),

  area_id: z.string(),

  classification_id: z.string(),

  status_id: z.string(),

});

type FormData = z.infer<typeof schema>;

interface Props {

  defaultValues?: Partial<FormData>;

  onSubmit: (
    data: FormData,
  ) => void;

}

export default function FindingForm({
  defaultValues,
  onSubmit,
}: Props) {

  const {

    control,

    handleSubmit,

    reset,

    formState: { errors },

  } = useForm<FormData>({

    resolver: zodResolver(schema),

    defaultValues: {

      process: "",

      finding_type: "",

      responsible: "",

      description: "",

      area_id: "",

      classification_id: "",

      status_id: "",

      ...defaultValues,

    },

  });

  const navigate = useNavigate();

  useEffect(() => {

    if (defaultValues) {

      reset(defaultValues);

    }

  }, [defaultValues, reset]);

  return (

    <Paper sx={{ p: 4 }}>

      <Typography variant="h5" sx={{ mb: 3 }}>
        Hallazgo
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >

        <Grid container spacing={3}>

          <Grid size={{ xs: 12, md: 6 }}>

            <Controller
              name="process"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  label="Proceso"
                  fullWidth
                  error={!!errors.process}
                  helperText={
                    errors.process?.message
                  }
                />

              )}
            />

          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>

            <Controller
              name="responsible"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  label="Responsable"
                  fullWidth
                  error={
                    !!errors.responsible
                  }
                  helperText={
                    errors.responsible
                      ?.message
                  }
                />

              )}
            />

          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>

            <Controller
              name="finding_type"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  select
                  label="Tipo"
                  fullWidth
                >

                  <MenuItem
                    value="Incumplimiento BPM"
                  >
                    Incumplimiento BPM
                  </MenuItem>

                  <MenuItem
                    value="Inocuidad"
                  >
                    Inocuidad
                  </MenuItem>

                  <MenuItem
                    value="Calidad"
                  >
                    Calidad
                  </MenuItem>

                </TextField>

              )}
            />

          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>

            <Controller
              name="area_id"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  select
                  label="Área"
                  fullWidth
                >

                  <MenuItem value="">

                    Seleccione...

                  </MenuItem>

                </TextField>

              )}
            />

          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>

            <Controller
              name="classification_id"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  select
                  label="Clasificación"
                  fullWidth
                >

                  <MenuItem value="">
                    Seleccione...
                  </MenuItem>

                </TextField>

              )}
            />

          </Grid>

          <Grid size={12}>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (

                <TextField
                  {...field}
                  multiline
                  rows={6}
                  fullWidth
                  label="Descripción"
                  error={
                    !!errors.description
                  }
                  helperText={
                    errors.description
                      ?.message
                  }
                />

              )}
            />

          </Grid>

        </Grid>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>

          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
          >
            Volver al Dashboard
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              /* mantener la funcionalidad de cancelar existente si se desea */
              navigate(-1);
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
          >
            Guardar
          </Button>

        </Box>

      </Box>

    </Paper>

  );

}