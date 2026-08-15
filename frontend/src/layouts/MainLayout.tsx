import {
  Dashboard,
  FactCheck,
  AssignmentTurnedIn,
  PhotoLibrary,
  People,
  Settings,
  Assignment as AssignmentIcon,
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
  IconButton,
} from "@mui/material";

import { Drawer } from "@mui/material";
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon, Home as HomeIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const drawerWidth = 260;
const collapsedWidth = 72;

const baseMenu = [
  {
    text: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
  },
  {
    text: "Hallazgos",
    icon: <FactCheck />,
    path: "/findings",
  },
  {
    text: "CAPA",
    icon: <AssignmentTurnedIn />,
    path: "/capas",
  },
  {
    text: 'Auditorías',
    icon: <AssignmentIcon />,
    path: '/audits',
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
    adminOnly: true,
  },
  {
    text: "Catálogos",
    icon: <Settings />,
    path: "/catalogs",
  },
];

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("bqs.drawer.collapsed");
      return v === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bqs.drawer.collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);
  const menu = baseMenu.filter((item) => {
    if (item.adminOnly) {
      return ["admin", "administrador"].some(
        (allowedRole) =>
          role?.toLowerCase() === allowedRole.toLowerCase()
      );
    }

    return true;
  });

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: collapsed ? "center" : "space-between", px: 1 }}>
          {!collapsed && (
            <IconButton component={Link} to="/dashboard" size="small" aria-label="Volver al Dashboard">
              <HomeIcon />
            </IconButton>
          )}

          <IconButton onClick={() => setCollapsed((s) => !s)} size="small" aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Toolbar>

        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.25, alignItems: collapsed ? "center" : "flex-start" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", display: collapsed ? "none" : "block" }}>
            Bizki
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ display: collapsed ? "none" : "block" }}>
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
              sx={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: "center" }}>
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.text} sx={{ display: collapsed ? "none" : "block" }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${collapsed ? collapsedWidth : drawerWidth}px`,
          pt: 2,
          pr: 2,
          pb: 2,
          pl: 0,
          boxSizing: "border-box",
          minHeight: "100vh",
          transition: (theme) =>
            theme.transitions.create(["margin"], {
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {children}
      </Box>
    </>
  );
}