import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0B5ED7",
    },
    secondary: {
      main: "#20C997",
    },
    background: {
      default: "#F5F7FA",
    },
  },

  typography: {
    fontFamily: "Segoe UI, Roboto, Arial",
  },

  shape: {
    borderRadius: 10,
  },
});

export default theme;