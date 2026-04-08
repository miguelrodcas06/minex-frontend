import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import CloseIcon from "@mui/icons-material/Close";
import DiamondIcon from "@mui/icons-material/Diamond";

import api from "../api";

const ORANGE = "#e07b39";

function LoginDialog({ open, onClose, onLoginSuccess }) {
  const theme = useTheme();

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

  const [modo, setModo]         = useState("login"); // "login" | "registro"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const resetForm = () => {
    setEmail(""); setPassword(""); setUsername("");
    setError(""); setSuccess("");
  };

  const handleClose = () => { resetForm(); setModo("login"); onClose(); };
  const cambiarModo = (nuevoModo) => { resetForm(); setModo(nuevoModo); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Completa todos los campos."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/usuarios/login", { email, password });
      sessionStorage.setItem("token", res.datos.token);
      sessionStorage.setItem("usuario", JSON.stringify(res.datos.usuario));
      onLoginSuccess(res.datos.usuario, `¡Bienvenido de nuevo, ${res.datos.usuario.username}!`);
      handleClose();
    } catch (err) {
      const mensaje = err.mensaje ?? "Credenciales incorrectas.";
      if (mensaje.toLowerCase().includes("desactivada") || mensaje.toLowerCase().includes("inactiv")) {
        setError("Tu cuenta está desactivada. Contacta con soporte para reactivarla.");
      } else {
        setError(mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) { setError("Completa todos los campos."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/usuarios", { username, email, password });
      resetForm(); setModo("login");
      setSuccess("¡Cuenta creada correctamente! Ya puedes iniciar sesión.");
    } catch (err) {
      setError(err.mensaje ?? "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = modo === "login";
  const isDark  = theme.palette.mode === "dark";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "background.paper",
            backgroundImage: "none",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>

        {/* Botón cerrar */}
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: "absolute", top: 12, right: 12,
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <DiamondIcon sx={{ color: ORANGE }} />
          <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700 }}>
            MineX
          </Typography>
        </Box>

        {/* Título */}
        <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 0.5 }}>
          {isLogin ? "Iniciar Sesión" : "Crear cuenta"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {isLogin
            ? "Accede a tu cuenta de MineX para gestionar tu tesorería."
            : "Regístrate para guardar tus alertas y tesorería."}
        </Typography>

        {/* Alertas */}
        {error && (
          <Alert
            severity="error"
            sx={isDark
              ? { mb: 2, backgroundColor: "#2a1010", color: "#ff8080", "& .MuiAlert-icon": { color: "#ff6b6b" } }
              : { mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={isDark
              ? { mb: 2, backgroundColor: "#0e2a1a", color: "#80ff9b", "& .MuiAlert-icon": { color: "#4caf50" } }
              : { mb: 2 }}
          >
            {success}
          </Alert>
        )}

        {/* Formulario */}
        <Box component="form" onSubmit={isLogin ? handleLogin : handleRegistro}>
          {!isLogin && (
            <TextField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth size="small"
              sx={{ ...inputSx, mb: 2 }}
              autoComplete="username"
            />
          )}

          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth size="small"
            placeholder="correo@ejemplo.com"
            sx={{ ...inputSx, mb: 2 }}
            autoComplete="email"
          />

          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth size="small"
            sx={{ ...inputSx, mb: 3 }}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: ORANGE,
              color: "white",
              textTransform: "none",
              fontWeight: 700,
              py: 1.2,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
              "&.Mui-disabled": { backgroundColor: "rgba(224,123,57,0.4)", color: "rgba(255,255,255,0.5)" },
            }}
          >
            {loading
              ? <CircularProgress size={20} sx={{ color: "white" }} />
              : isLogin ? "Iniciar Sesión" : "Crear cuenta"}
          </Button>
        </Box>

        {/* Toggle login / registro */}
        <Box sx={{ textAlign: "center", mt: 2.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <Box
              component="span"
              onClick={() => cambiarModo(isLogin ? "registro" : "login")}
              sx={{ color: ORANGE, cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </Box>
          </Typography>
        </Box>

      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
