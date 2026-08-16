import { useNavigate } from "react-router-dom";

import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from "@mui/x-data-grid";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { Finding } from "../../types/finding";

interface Props {
  findings: Finding[];
}

// MUI DataGrid v7+ pasa el valor directamente al valueFormatter, no params.value
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default function FindingTable({
  findings,
}: Props) {

  const navigate = useNavigate();

  const columns: GridColDef[] = [

    {
      field: "code",
      headerName: "Código",
      flex: 1.2,
      minWidth: 140,
    },

    {
      field: "process",
      headerName: "Proceso",
      flex: 1.5,
      minWidth: 160,
    },

    {
      field: "finding_type",
      headerName: "Tipo",
      flex: 1,
      minWidth: 130,
    },

    {
      field: "area",
      headerName: "Área",
      flex: 1,
      minWidth: 120,
      valueGetter: (_value: unknown, row: Finding) => row.area?.name ?? "—",
    },

    {
      field: "classification",
      headerName: "Clasificación",
      flex: 1,
      minWidth: 120,
      valueGetter: (_value: unknown, row: Finding) => row.classification?.name ?? "—",
    },

    {
      field: "status",
      headerName: "Estado",
      flex: 1,
      minWidth: 120,
      valueGetter: (_value: unknown, row: Finding) => row.status?.name ?? "—",
    },

    {
      field: "responsible",
      headerName: "Responsable",
      flex: 1.3,
      minWidth: 150,
    },

    {
      field: "created_at",
      headerName: "Fecha",
      flex: 1,
      minWidth: 110,
      // En MUI DataGrid v7+ valueFormatter recibe (value, row, column, apiRef)
      valueFormatter: (value: string | null | undefined) => formatDate(value),
    },

    {
      field: "active",
      headerName: "Activo",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Activo" : "Inactivo"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },

    {
      field: "actions",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      width: 170,

      renderCell: (params) => (

        <Box>

          <Tooltip title="Ver">
            <IconButton
              color="primary"
              onClick={() =>
                navigate(`/findings/${params.row.id}`)
              }
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Editar">
            <IconButton
              color="warning"
              onClick={() =>
                navigate(`/findings/edit/${params.row.id}`)
              }
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Agregar evidencia">
            <IconButton
              color="secondary"
              onClick={() =>
                navigate(`/evidences?findingId=${params.row.id}`)
              }
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => {
                if (
                  confirm("¿Desea eliminar este hallazgo?")
                ) {
                  console.log("Eliminar", params.row.id);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

        </Box>

      ),
    },

  ];

  return (

    <Box
      sx={{
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 2,
      }}
    >

      <DataGrid
        rows={findings}
        columns={columns}

        getRowId={(row) => row.id}

        pageSizeOptions={[10, 25, 50, 100]}

        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
              page: 0,
            },
          },
        }}

        disableRowSelectionOnClick

        autoHeight

        slots={{
          toolbar: GridToolbar,
        }}

        sx={{
          border: 0,

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#1976d2",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 15,
          },

          "& .MuiDataGrid-cell": {
            alignItems: "center",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}

      />

    </Box>

  );

}