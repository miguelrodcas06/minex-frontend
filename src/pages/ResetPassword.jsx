import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import DiamondIcon from "@mui/icons-material/Diamond";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import api from "../api";

const ORANGE = "#e07b39";

function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [done, setDone]                   = useState(false);

  const isDark = theme.palette.mode === "dark";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.default,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: "rgba(128,128,128,0.5)" },
      "&.Mui-focused fieldset": { borderColor: ORANGE },
    },
    "& .MuiInputLabel-root": { color: theme.palette.text.secondary },
    "& .MuiInputLabel-root.Mui-focused": { color: ORANGE },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError("Completa todos los campos."); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (!token) { setError("El enlace no es válido."); return; }

    setLoading(true); setError("");
    try {
      await api.post("/usuarios/resetear-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.mensaje ?? "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Container maxWidth="xs">
          <Box sx={{ p: 4, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
            <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 1 }}>Enlace no válido</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>Este enlace de recuperación no es válido o ha expirado.</Typography>
            <Button onClick={() => navigate("/")} sx={{ backgroundColor: ORANGE, color: "white", textTransform: "none", fontWeight: 700, "&:hover": { backgroundColor: "#c96a2a" } }}>
              Volver al inicio
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Container maxWidth="xs">
        <Box sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <DiamondIcon sx={{ color: ORANGE }} />
            <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700 }}>MineX</Typography>
          </Box>

          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 0.5 }}>
            {done ? "Contraseña actualizada" : "Nueva contraseña"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            {done ? "Ya puedes iniciar sesión con tu nueva contraseña." : "Introduce tu nueva contraseña para recuperar el acceso."}
          </Typography>

          {error && (
            <Alert severity="error" sx={isDark ? { mb: 2, backgroundColor: "#2a1010", color: "#ff8080", "& .MuiAlert-icon": { color: "#ff6b6b" } } : { mb: 2 }}>
              {error}
            </Alert>
          )}

          {done ? (
            <Button fullWidth onClick={() => navigate("/")}
              sx={{ backgroundColor: ORANGE, color: "white", textTransform: "none", fontWeight: 700, py: 1.2, boxShadow: "none", "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" } }}>
              Ir al inicio
            </Button>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Nueva contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth size="small"
                sx={{ ...inputSx, mb: 2 }}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end" sx={{ color: "text.secondary" }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirmar contraseña"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                fullWidth size="small"
                sx={{ ...inputSx, mb: 3 }}
                autoComplete="new-password"
              />
              <Button type="submit" fullWidth disabled={loading}
                sx={{ backgroundColor: ORANGE, color: "white", textTransform: "none", fontWeight: 700, py: 1.2, boxShadow: "none", "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" }, "&.Mui-disabled": { backgroundColor: "rgba(224,123,57,0.4)", color: "rgba(255,255,255,0.5)" } }}>
                {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Establecer nueva contraseña"}
              </Button>
            </Box>
          )}

        </Box>
      </Container>
    </Box>
  );
}

export default ResetPassword;
