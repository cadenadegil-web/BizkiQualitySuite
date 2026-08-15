import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";

import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {

  const navigate = useNavigate();

  const { signIn } = useAuth();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(
    event: React.FormEvent
  ) {

    event.preventDefault();

    console.log("=================================");
    console.log("BOTÓN LOGIN PRESIONADO");

    setLoading(true);

    setError("");

    console.log("ANTES DE signIn()");

    const success = await signIn({
      username,
      password,
    });

    console.log("RESULTADO signIn():", success);

    setLoading(false);

    if (success) {

      console.log("REDIRECCIONANDO AL DASHBOARD");

      navigate("/dashboard");

    } else {

      console.log("LOGIN FALLÓ");

      setError(
        "Usuario o contraseña incorrectos."
      );

    }

  }

  return (

    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Card
        sx={{
          width: "100%",
          maxWidth: 450,
          boxShadow: 6,
          borderRadius: 3,
        }}
      >

        <CardContent sx={{ p: 4 }}>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Bizki Quality Suite
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Sistema Integral de Gestión de Calidad
          </Typography>

          {error && (

            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>

          )}

          <Box
            component="form"
            onSubmit={handleLogin}
          >

            <TextField
              label="Usuario"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
            />

            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                height: 48,
              }}
              disabled={loading}
            >

              {loading ? (

                <CircularProgress
                  size={24}
                  color="inherit"
                />

              ) : (

                "INICIAR SESIÓN"

              )}

            </Button>

          </Box>

        </CardContent>

      </Card>

    </Container>

  );

}