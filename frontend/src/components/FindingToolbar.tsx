import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

interface Props {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCreate: () => void;
}

export default function FindingToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onCreate,
}: Props) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ justifyContent: "space-between", mb: 3 }}
    >
      <TextField
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar hallazgo..."
        {...({ InputProps: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        } } as any)}
        sx={{ width: { xs: "100%", md: 400 } }}
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <FormControl sx={{ width: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={status}
            label="Estado"
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Activos</MenuItem>
            <MenuItem value="false">Inactivos</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          Nuevo Hallazgo
        </Button>
      </Box>
    </Stack>
  );
}
