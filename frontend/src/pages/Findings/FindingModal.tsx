import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCatalogItems, CatalogItem } from "../../services/catalogs.service";

const schema = z.object({
  process: z.string().min(1, "El proceso es requerido."),
  finding_type: z.string().min(1, "Seleccione un tipo de hallazgo."),
  responsible: z.string().min(1, "El responsable es requerido."),
  description: z.string().min(5, "La descripción es requerida."),
  created_at: z.string().optional().or(z.literal("")),
  area_id: z.string().optional().or(z.literal("")),
  classification_id: z.string().optional().or(z.literal("")),
  status_id: z.string().optional().or(z.literal("")),
});

export type FindingFormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FindingFormData) => void;
  submitting?: boolean;
  defaultValues?: Partial<FindingFormData>;
}

export default function FindingModal({ open, onClose, onSubmit, submitting = false, defaultValues }: Props) {
  const [areas, setAreas] = useState<CatalogItem[]>([]);
  const [classifications, setClassifications] = useState<CatalogItem[]>([]);
  const [statuses, setStatuses] = useState<CatalogItem[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FindingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      process: "",
      finding_type: "",
      responsible: "",
      description: "",
      created_at: todayStr,
      area_id: "",
      classification_id: "",
      status_id: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [a, c, s] = await Promise.all([
          getCatalogItems("areas"),
          getCatalogItems("classifications"),
          getCatalogItems("statuses"),
        ]);
        setAreas(a.filter((item) => item.active));
        setClassifications(c.filter((item) => item.active));
        setStatuses(s.filter((item) => item.active));
      } catch (err) {
        console.error("Error cargando catálogos en modal hallazgos", err);
      }
    }

    if (open) {
      loadCatalogs();
      reset({
        process: "",
        finding_type: "",
        responsible: "",
        description: "",
        created_at: todayStr,
        area_id: "",
        classification_id: "",
        status_id: "",
        ...defaultValues,
      });
    }
  }, [open, reset, defaultValues, todayStr]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold" }}>Nuevo Registro de Hallazgo</DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <Controller
              name="process"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Proceso"
                  placeholder="Ej. Mezcla, Empaque, Horno"
                  fullWidth
                  disabled={submitting}
                  error={!!errors.process}
                  helperText={errors.process?.message}
                />
              )}
            />

            <Controller
              name="responsible"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Responsable"
                  placeholder="Nombre del responsable"
                  fullWidth
                  disabled={submitting}
                  error={!!errors.responsible}
                  helperText={errors.responsible?.message}
                />
              )}
            />

            <Controller
              name="finding_type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de Hallazgo"
                  fullWidth
                  disabled={submitting}
                  error={!!errors.finding_type}
                  helperText={errors.finding_type?.message}
                >
                  <MenuItem value="Incumplimiento BPM">Incumplimiento BPM</MenuItem>
                  <MenuItem value="Inocuidad">Inocuidad</MenuItem>
                  <MenuItem value="Calidad">Calidad</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="created_at"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Fecha del Hallazgo"
                  fullWidth
                  disabled={submitting}
                  error={!!errors.created_at}
                  helperText={errors.created_at?.message}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}
            />

            <Controller
              name="area_id"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Área" fullWidth disabled={submitting}>
                  <MenuItem value="">Seleccione Área (Opcional)</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="classification_id"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Clasificación" fullWidth disabled={submitting}>
                  <MenuItem value="">Seleccione Clasificación (Opcional)</MenuItem>
                  {classifications.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="status_id"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Estado" fullWidth disabled={submitting}>
                  <MenuItem value="">Seleccione Estado (Opcional)</MenuItem>
                  {statuses.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    multiline
                    rows={4}
                    fullWidth
                    label="Descripción del Hallazgo"
                    placeholder="Detalles sobre el hallazgo encontrado..."
                    disabled={submitting}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Hallazgo"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
