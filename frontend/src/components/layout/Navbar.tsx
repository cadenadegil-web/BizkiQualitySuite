import {
  Dashboard,
  FactCheck,
  AssignmentTurnedIn,
  PhotoLibrary,
  People,
  Settings,
} from "@mui/icons-material";

import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import { Drawer } from "@mui/material";

import { Link, useLocation } from "react-router-dom";

const drawerWidth = 260;

const menu = [
  {
    text: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
  },
  {
    text: "No Conformidades",
    icon: <FactCheck />,
    path: "/findings",
  },
  {
    text: "Plan de Acción Correctiva (CAP)",
    icon: <AssignmentTurnedIn />,
    path: "/capas",
  },
  {
    text: "Evidencias",
    icon: <PhotoLibrary />,
    path: "/evidences",
  },
  {
    text: "Usuarios",
    icon: <People />,
    path: "/users",
  },
  {
    text: "Catálogos",
    icon: <Settings />,
    path: "/catalogs",
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />

      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Bizki
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Quality Suite
        </Typography>
      </Box>

      <Divider />

      <List>
        {menu.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}