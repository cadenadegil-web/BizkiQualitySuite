import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const createSchema = z.object({
  full_name: z.string().min(1, "Nombre completo es requerido."),
  username: z.string().min(3, "Nombre de usuario es requerido."),
  email: z.string().email("Correo no válido."),
  role: z.string().min(1, "Rol es requerido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  is_active: z.boolean(),
});

const editSchema = z.object({
  full_name: z.string().min(1, "Nombre completo es requerido."),
  username: z.string().min(3, "Nombre de usuario es requerido."),
  email: z.string().email("Correo no válido."),
  role: z.string().min(1, "Rol es requerido."),
  password: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
});

export type UserFormData = z.infer<typeof createSchema>;

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  submitting?: boolean;
  editingUser?: User | null;
  defaultValues?: Partial<UserFormData>;
}

export default function UserForm({
  open,
  onClose,
  onSubmit,
  submitting = false,
  editingUser = null,
  defaultValues,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = Boolean(editingUser);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      role: "",
      password: "",
      is_active: true,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingUser) {
        reset({
          full_name: editingUser.full_name || "",
          username: editingUser.username || "",
          email: editingUser.email || "",
          role: editingUser.role || "",
          password: "",
          is_active: editingUser.is_active ?? true,
        });
      } else {
        reset({
          full_name: "",
          username: "",
          email: "",
          role: "",
          password: "",
          is_active: true,
          ...defaultValues,
        });
      }
      setShowPassword(false);
    }
  }, [open, editingUser, defaultValues, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <Box>
              <Controller
                name="full_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre completo"
                    fullWidth
                    disabled={submitting}
                    error={!!errors.full_name}
                    helperText={errors.full_name?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Usuario"
                    fullWidth
                    disabled={submitting}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Correo electrónico"
                    fullWidth
                    disabled={submitting}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={submitting} error={!!errors.role}>
                    <InputLabel id="role-label">Rol</InputLabel>
                    <Select
                      labelId="role-label"
                      label="Rol"
                      {...field}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      <MenuItem value="administrador">Administrador</MenuItem>
                      <MenuItem value="coordinador de calidad">Coordinador de Calidad</MenuItem>
                      <MenuItem value="supervisor de calidad">Supervisor de Calidad</MenuItem>
                      <MenuItem value="supervisor de producción">Supervisor de Producción</MenuItem>
                      <MenuItem value="auditor">Auditor</MenuItem>
                      <MenuItem value="operario">Operario</MenuItem>
                    </Select>
                    <FormHelperText>{errors.role?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>

            <Box>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isEditing ? "Contraseña (opcional)" : "Contraseña"}
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    disabled={submitting}
                    error={!!errors.password}
                    helperText={errors.password?.message || (isEditing ? "Dejar vacío si no desea cambiarla" : undefined)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword
                                  ? "Ocultar contraseña"
                                  : "Mostrar contraseña"
                              }
                              onClick={() =>
                                setShowPassword((prev) => !prev)
                              }
                              edge="end"
                              size="large"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        disabled={submitting}
                      />
                    }
                    label="Usuario activo"
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
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
