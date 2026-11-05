import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import LabelIcon from "@mui/icons-material/Label";
import FlagIcon from "@mui/icons-material/Flag";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import BadgeIcon from "@mui/icons-material/Badge";
import GroupIcon from "@mui/icons-material/Group";
import TableViewIcon from "@mui/icons-material/TableView";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  CatalogItem,
  CatalogType,
} from "../../services/catalogs.service";
import {
  exportCatalogToPDF,
  exportCatalogToExcel,
} from "../../services/export.service";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`catalog-tabpanel-${index}`}
      aria-labelledby={`catalog-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const DEFAULT_PLANTS = [
  "MDH",
  "Bizki (Planta de Bizcocho)",
  "Molinos del Higuamo",
  "Caribbean Cookies Company",
];

export default function CatalogsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState("");
  const [employeeCodeInput, setEmployeeCodeInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [plantInput, setPlantInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [activeInput, setActiveInput] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Notification state
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Column filter states
  const [filterName, setFilterName] = useState("");
  const [filterEmployeeCode, setFilterEmployeeCode] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "", "active", "inactive"

  const getCatalogType = (tab: number): CatalogType => {
    switch (tab) {
      case 0: return "areas";
      case 1: return "classifications";
      case 2: return "statuses";
      case 3: return "norms";
      case 4: return "responsibles";
      case 5: return "auditors";
      case 6: return "collaborators";
      default: return "areas";
    }
  };

  const currentType = getCatalogType(tabValue);

  const getCatalogTitle = (tab: number) => {
    switch (tab) {
      case 0: return "Áreas";
      case 1: return "Clasificaciones";
      case 2: return "Estados";
      case 3: return "Normas de Auditoría";
      case 4: return "Responsables";
      case 5: return "Auditores";
      case 6: return "Colaboradores";
      default: return "Catálogo";
    }
  };

  async function loadItems(tab: number) {
    setLoading(true);
    try {
      const type = getCatalogType(tab);
      const data = await getCatalogItems(type);
      setItems(data);
    } catch (err: any) {
      console.error("Error cargando catálogo:", err);
      setSnack({
        open: true,
        message: "Error al cargar los elementos del catálogo.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const availablePlants = Array.from(
    new Set([
      ...DEFAULT_PLANTS,
      ...items.map((i) => i.plant).filter((p): p is string => Boolean(p)),
    ])
  );

  useEffect(() => {
    setFilterName("");
    setFilterEmployeeCode("");
    setFilterPosition("");
    setFilterPlant("");
    setFilterCategory("");
    setFilterDescription("");
    setFilterStatus("");
    loadItems(tabValue);
  }, [tabValue]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setNameInput("");
    setEmployeeCodeInput("");
    setPositionInput("");
    setPlantInput("");
    setDescriptionInput("");
    setCategoryInput("");
    setActiveInput(true);
    setOpenModal(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setNameInput(item.name);
    setEmployeeCodeInput(item.employee_code || "");
    setPositionInput(item.position || "");
    setPlantInput(item.plant || "");
    setDescriptionInput(item.description || "");
    setCategoryInput(item.category || "");
    setActiveInput(item.active);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingItem(null);
    setNameInput("");
    setEmployeeCodeInput("");
    setPositionInput("");
    setPlantInput("");
    setDescriptionInput("");
    setCategoryInput("");
    setActiveInput(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setSnack({
        open: true,
        message: "El nombre es obligatorio.",
        severity: "error",
      });
      return;
    }

    const isPlantCatalogs =
      currentType === "areas" ||
      currentType === "responsibles" ||
      currentType === "auditors" ||
      currentType === "collaborators";

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateCatalogItem(currentType, editingItem.id, {
          name: nameInput.trim(),
          employee_code:
            currentType === "collaborators"
              ? (employeeCodeInput.trim() || null)
              : undefined,
          position:
            currentType === "collaborators"
              ? (positionInput.trim() || null)
              : undefined,
          plant: isPlantCatalogs ? (plantInput || null) : undefined,
          description: currentType === "norms" ? descriptionInput.trim() : undefined,
          category: currentType === "norms" ? categoryInput.trim() : undefined,
          active: activeInput,
        });
        setSnack({
          open: true,
          message: "Registro actualizado correctamente.",
          severity: "success",
        });
      } else {
        await createCatalogItem(currentType, {
          name: nameInput.trim(),
          employee_code:
            currentType === "collaborators"
              ? (employeeCodeInput.trim() || undefined)
              : undefined,
          position:
            currentType === "collaborators"
              ? (positionInput.trim() || undefined)
              : undefined,
          plant: isPlantCatalogs ? (plantInput || undefined) : undefined,
          description: currentType === "norms" ? descriptionInput.trim() : undefined,
          category: currentType === "norms" ? categoryInput.trim() : undefined,
          active: activeInput,
        });
        setSnack({
          open: true,
          message: "Registro creado correctamente.",
          severity: "success",
        });
      }
      handleCloseModal();
      await loadItems(tabValue);
    } catch (err: any) {
      console.error("Error al guardar elemento:", err);
      const detail = err?.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Error al guardar el elemento.";
      setSnack({ open: true, message, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteCatalogItem(currentType, deletingItem.id);
      setSnack({
        open: true,
        message: "Registro eliminado correctamente.",
        severity: "success",
      });
      setDeletingItem(null);
      await loadItems(tabValue);
    } catch (err: any) {
      console.error("Error al eliminar elemento:", err);
      const detail = err?.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Error al eliminar el elemento.";
      setSnack({ open: true, message, severity: "error" });
    }
  };

  const filteredItems = items.filter(item => {
    const isPlant =
      currentType === "areas" ||
      currentType === "responsibles" ||
      currentType === "auditors" ||
      currentType === "collaborators";
    const matchesName = item.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesEmployeeCode = currentType === "collaborators"
      ? (item.employee_code || "").toLowerCase().includes(filterEmployeeCode.toLowerCase())
      : true;
    const matchesPosition = currentType === "collaborators"
      ? (item.position || "").toLowerCase().includes(filterPosition.toLowerCase())
      : true;
    const matchesPlant = isPlant
      ? (!filterPlant || (item.plant || "").toLowerCase() === filterPlant.toLowerCase())
      : true;
    const matchesCategory = currentType === "norms"
      ? (item.category || "").toLowerCase().includes(filterCategory.toLowerCase())
      : true;
    const matchesDescription = currentType === "norms"
      ? (item.description || "").toLowerCase().includes(filterDescription.toLowerCase())
      : true;
    
    let matchesStatus = true;
    if (filterStatus === "active") matchesStatus = item.active === true;
    if (filterStatus === "inactive") matchesStatus = item.active === false;

    return (
      matchesName &&
      matchesEmployeeCode &&
      matchesPosition &&
      matchesPlant &&
      matchesCategory &&
      matchesDescription &&
      matchesStatus
    );
  });

  const handleExportPDF = () => {
    exportCatalogToPDF(filteredItems, getCatalogTitle(tabValue));
  };

  const handleExportExcel = () => {
    exportCatalogToExcel(filteredItems, getCatalogTitle(tabValue));
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 3, width: "100%" }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Catálogos del Sistema
        </Typography>

        <Stack direction="row" gap={1} flexWrap="wrap">
          {/* Exportar PDF */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={filteredItems.length === 0}
            sx={{ textTransform: "none" }}
          >
            Exportar PDF
          </Button>

          {/* Exportar Excel */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<TableViewIcon />}
            onClick={handleExportExcel}
            disabled={filteredItems.length === 0}
            sx={{ textTransform: "none" }}
          >
            Exportar Excel
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ textTransform: "none" }}
          >
            Nuevo Registro
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ width: "100%", borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}
        >
          <Tab icon={<CategoryIcon />} iconPosition="start" label="Áreas" />
          <Tab icon={<LabelIcon />} iconPosition="start" label="Clasificaciones" />
          <Tab icon={<FlagIcon />} iconPosition="start" label="Estados" />
          <Tab icon={<MenuBookIcon />} iconPosition="start" label="Normas" />
          <Tab icon={<AssignmentIndIcon />} iconPosition="start" label="Responsables" />
          <Tab icon={<BadgeIcon />} iconPosition="start" label="Auditores" />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Colaboradores" />
        </Tabs>

        <CustomTabPanel value={tabValue} index={0}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={1}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={2}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={3}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={4}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={5}>
          {renderCatalogTable()}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={6}>
          {renderCatalogTable()}
        </CustomTabPanel>
      </Paper>

      {/* Modal Form */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: "bold" }}>
            {editingItem
              ? `Editar en ${getCatalogTitle(tabValue)}`
              : `Nuevo Registro en ${getCatalogTitle(tabValue)}`}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
              {currentType === "collaborators" && (
                <TextField
                  label="ID / Código de Empleado (5 dígitos)"
                  placeholder="Ej. 10001 (auto-generado si se deja vacío)"
                  fullWidth
                  value={employeeCodeInput}
                  onChange={(e) =>
                    setEmployeeCodeInput(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  disabled={submitting}
                  helperText="Código numérico de 5 dígitos (ej. 10001). Si se deja en blanco se asigna automático."
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 5 }}
                />
              )}

              <TextField
                label={currentType === "collaborators" ? "Nombre del Colaborador" : "Nombre"}
                placeholder={
                  currentType === "responsibles"
                    ? "Ej. Juan Pérez (Supervisor)"
                    : currentType === "auditors"
                    ? "Ej. Lic. Carlos Méndez"
                    : currentType === "collaborators"
                    ? "Ej. Carlos Martínez"
                    : "Ej. Mezcla, Crítico, Abierto..."
                }
                fullWidth
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={submitting}
                required
                autoFocus={currentType !== "collaborators"}
              />

              {currentType === "collaborators" && (
                <TextField
                  label="Cargo del Colaborador"
                  placeholder="Ej. Auxiliar de Empaque, Operador de Horno..."
                  fullWidth
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  disabled={submitting}
                />
              )}

              {(currentType === "areas" ||
                currentType === "responsibles" ||
                currentType === "auditors" ||
                currentType === "collaborators") && (
                <TextField
                  select
                  label="Planta"
                  fullWidth
                  value={plantInput}
                  onChange={(e) => setPlantInput(e.target.value)}
                  disabled={submitting}
                  SelectProps={{ native: true }}
                  helperText={
                    currentType === "areas"
                      ? "Selecciona la planta a la que pertenece esta área"
                      : "Planta asignada (opcional - dejar vacío para todas las plantas)"
                  }
                >
                  <option value="">
                    {currentType === "areas"
                      ? "-- Seleccionar Planta --"
                      : "-- General / Todas las plantas --"}
                  </option>
                  {availablePlants.map((plant) => (
                    <option key={plant} value={plant}>
                      {plant}
                    </option>
                  ))}
                </TextField>
              )}

              {currentType === "norms" && (
                <>
                  <TextField
                    label="Categoría"
                    placeholder="Ej. BPM (Buenas Prácticas de Manufactura)"
                    fullWidth
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    disabled={submitting}
                  />
                  <TextField
                    label="Punto de Control (Descripción)"
                    placeholder="Ej. Personal con uniforme completo..."
                    fullWidth
                    multiline
                    rows={2}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={activeInput}
                    onChange={(e) => setActiveInput(e.target.checked)}
                    color="success"
                    disabled={submitting}
                  />
                }
                label={activeInput ? "Registro Activo" : "Registro Inactivo"}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal} disabled={submitting} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el registro <strong>{deletingItem?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletingItem(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
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

  function renderCatalogTable() {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      );
    }

    const isPlant =
      currentType === "areas" ||
      currentType === "responsibles" ||
      currentType === "auditors" ||
      currentType === "collaborators";
    const isCollaborator = currentType === "collaborators";

    return (
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "#1976d2" }}>
            <TableRow>
              {isCollaborator && (
                <TableCell sx={{ color: "#fff", fontWeight: "bold", width: 110 }}>
                  ID
                </TableCell>
              )}
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                {isCollaborator ? "Colaborador" : "Nombre"}
              </TableCell>
              {isCollaborator && (
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Cargo</TableCell>
              )}
              {isPlant && (
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Planta</TableCell>
              )}
              {currentType === "norms" && <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Categoría</TableCell>}
              {currentType === "norms" && <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Punto de Control</TableCell>}
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Estado</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }} align="right">
                Acciones
              </TableCell>
            </TableRow>
            <TableRow>
              {isCollaborator && (
                <TableCell sx={{ p: 1, width: 110 }}>
                  <TextField
                    placeholder="Filtrar ID..."
                    size="small"
                    variant="outlined"
                    value={filterEmployeeCode}
                    onChange={(e) => setFilterEmployeeCode(e.target.value)}
                    sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                    fullWidth
                  />
                </TableCell>
              )}
              <TableCell sx={{ p: 1 }}>
                <TextField
                  placeholder={
                    isCollaborator ? "Filtrar colaborador..." : "Filtrar por nombre..."
                  }
                  size="small"
                  variant="outlined"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                  fullWidth
                />
              </TableCell>
              {isCollaborator && (
                <TableCell sx={{ p: 1 }}>
                  <TextField
                    placeholder="Filtrar cargo..."
                    size="small"
                    variant="outlined"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                    fullWidth
                  />
                </TableCell>
              )}
              {isPlant && (
                <TableCell sx={{ p: 1 }}>
                  <TextField
                    select
                    size="small"
                    variant="outlined"
                    value={filterPlant}
                    onChange={(e) => setFilterPlant(e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ backgroundColor: "#fff", borderRadius: 1, minWidth: 150 }}
                    fullWidth
                  >
                    <option value="">Todas las plantas</option>
                    {availablePlants.map((plant) => (
                      <option key={plant} value={plant}>
                        {plant}
                      </option>
                    ))}
                  </TextField>
                </TableCell>
              )}
              {currentType === "norms" && (
                <TableCell sx={{ p: 1 }}>
                  <TextField
                    placeholder="Filtrar por categoría..."
                    size="small"
                    variant="outlined"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                    fullWidth
                  />
                </TableCell>
              )}
              {currentType === "norms" && (
                <TableCell sx={{ p: 1 }}>
                  <TextField
                    placeholder="Filtrar por punto de control..."
                    size="small"
                    variant="outlined"
                    value={filterDescription}
                    onChange={(e) => setFilterDescription(e.target.value)}
                    sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                    fullWidth
                  />
                </TableCell>
              )}
              <TableCell sx={{ p: 1 }}>
                <TextField
                  select
                  size="small"
                  variant="outlined"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{ backgroundColor: "#fff", borderRadius: 1, minWidth: 100 }}
                  fullWidth
                >
                  <option value="">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </TextField>
              </TableCell>
              <TableCell align="right" sx={{ p: 1 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} hover>
                {isCollaborator && (
                  <TableCell sx={{ width: 110 }}>
                    <Chip
                      label={item.employee_code || "—"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        backgroundColor: "#e8f0fe",
                        color: "#1967d2",
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                {isCollaborator && (
                  <TableCell sx={{ color: "text.primary" }}>
                    {item.position || (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                )}
                {isPlant && (
                  <TableCell>
                    {item.plant ? (
                      <Chip
                        label={item.plant}
                        size="small"
                        color={
                          item.plant === "MDH"
                            ? "primary"
                            : item.plant.includes("Higuam") || item.plant.includes("Higuan")
                            ? "secondary"
                            : "default"
                        }
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                )}
                {currentType === "norms" && (
                  <TableCell>
                    {item.category || "-"}
                  </TableCell>
                )}
                {currentType === "norms" && (
                  <TableCell sx={{ color: "text.secondary", maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.description || "-"}
                  </TableCell>
                )}
                <TableCell>
                  <Chip
                    label={item.active ? "Activo" : "Inactivo"}
                    color={item.active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton
                        color="warning"
                        onClick={() => handleOpenEdit(item)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() => setDeletingItem(item)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isCollaborator ? 6 : currentType === "norms" ? 5 : isPlant ? 4 : 3}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No existen registros en este catálogo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}
