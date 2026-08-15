import {
  Box,
  Typography,
} from "@mui/material";

export default function FindingFilters() {

  return (

    <Box

      sx={{

        p: 2,

      }}

    >

      <Typography

        color="text.secondary"

      >

        Aquí se agregarán filtros avanzados:

      </Typography>

      <Typography>

        • Área

      </Typography>

      <Typography>

        • Clasificación

      </Typography>

      <Typography>

        • Responsable

      </Typography>

      <Typography>

        • Fecha

      </Typography>

      <Typography>

        • Estado

      </Typography>

    </Box>

  );

}