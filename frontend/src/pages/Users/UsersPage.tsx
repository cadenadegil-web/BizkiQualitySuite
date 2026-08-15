import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import UserForm, { UserFormData } from "./UserForm";
import {
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  type User,
} from "../../services/users.service";

export default function UsersPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setOpenForm(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUser(null);
  };

  const handleSubmitUser = async (formData: UserFormData) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: Record<string, any> = { ...formData };
        if (!payload.password) delete payload.password;
        await updateUser(editingUser.id, payload);
        setSnack({ open: true, message: "Usuario actualizado correctamente.", severity: "success" });
      } else {
        await createUser(formData);
        setSnack({ open: true, message: "Usuario creado correctamente.", severity: "success" });
      }
      handleCloseForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Error en operación de usuario", error);
      const msg =
        error?.response?.data?.detail || error?.message || "Error al procesar usuario.";
      setSnack({ open: true, message: String(msg), severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      setSnack({ open: true, message: "Usuario eliminado correctamente.", severity: "success" });
      setDeletingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error("Error eliminando usuario", error);
      const msg =
        error?.response?.data?.detail || error?.message || "Error al eliminar usuario.";
      setSnack({ open: true, message: String(msg), severity: "error" });
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3, width: "100%" }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Usuarios
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Nuevo Usuario
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Nombre Completo</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Usuario</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Correo</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Rol</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Estado</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id || user.username} hover>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{user.role}</TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? "Activo" : "Inactivo"}
                    color={user.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Editar Usuario">
                      <IconButton
                        color="warning"
                        onClick={() => handleOpenEdit(user)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Usuario">
                      <IconButton
                        color="error"
                        onClick={() => setDeletingUser(user)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UserForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitUser}
        submitting={submitting}
        editingUser={editingUser}
      />

      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar al usuario <strong>{deletingUser?.full_name || deletingUser?.username}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletingUser(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}