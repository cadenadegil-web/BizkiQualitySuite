import {
  Dashboard,
  FactCheck,
  AssignmentTurnedIn,
  PhotoLibrary,
  People,
  Settings,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
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
  Avatar,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import { Drawer } from "@mui/material";
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon, Home as HomeIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { role, username, logout } = useAuth();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
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

  const handleLogout = () => {
    setConfirmLogoutOpen(false);
    logout();
    navigate("/");
  };

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
            display: "flex",
            flexDirection: "column",
            height: "100%",
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

        <List sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
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

        <Divider />

        {/* Sección de Usuario y Logout */}
        <Box sx={{ p: collapsed ? 1 : 2, bgcolor: "action.hover", mt: "auto" }}>
          {!collapsed ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38, fontWeight: "bold", fontSize: 16 }}>
                  {(username || "U").charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                    {username || "Usuario"}
                  </Typography>
                  <Chip
                    label={role || "Usuario"}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="small"
                startIcon={<LogoutIcon />}
                onClick={() => setConfirmLogoutOpen(true)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Tooltip title={`${username || "Usuario"} (${role || ""})`} placement="right">
                <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34, fontWeight: "bold", fontSize: 14 }}>
                  {(username || "U").charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              <Tooltip title="Cerrar sesión" placement="right">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => setConfirmLogoutOpen(true)}
                  aria-label="Cerrar sesión"
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
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

      {/* Diálogo de Confirmación para Cerrar Sesión */}
      <Dialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Cerrar sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cerrar la sesión de <strong>{username || "tu cuenta"}</strong>? Tendrás que iniciar sesión nuevamente para acceder al sistema.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmLogoutOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}