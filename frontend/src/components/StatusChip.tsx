import Chip from "@mui/material/Chip";

interface Props {

  active: boolean;

}

export default function StatusChip({

  active,

}: Props) {

  return (

    <Chip

      label={

        active

          ? "Activo"

          : "Inactivo"

      }

      color={

        active

          ? "success"

          : "default"

      }

      size="small"

    />

  );

}