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
import Divider from "@mui/material/Divider";

import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import api from "../api";

const ORANGE = "#e07b39";

function PerfilDialog({ open, onClose, usuario, onUsernameChange, onBaja }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "text.primary",
      backgroundColor: theme.palette.background.default,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: "rgba(128,128,128,0.5)" },
      "&.Mui-focused fieldset": { borderColor: ORANGE },
      "&.Mui-disabled": {
        "& fieldset": { borderColor: theme.palette.divider },
      },
    },
    "& .MuiInputLabel-root": { color: theme.palette.text.secondary },
    "& .MuiInputLabel-root.Mui-focused": { color: ORANGE },
    "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: theme.palette.text.secondary },
  };

  const [username, setUsername]       = useState(usuario?.username ?? "");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [confirmBaja, setConfirmBaja] = useState(false);
  const [loadingBaja, setLoadingBaja] = useState(false);

  const handleClose = () => {
    setError("");
    setSuccess("");
    setConfirmBaja(false);
    onClose();
  };

  const handleDarDeBaja = async () => {
    setLoadingBaja(true);
    try {
      await api.put("/usuarios/baja");
      onClose();
      onBaja?.();
    } catch (err) {
      setError(err.mensaje ?? "No se pudo desactivar la cuenta.");
      setConfirmBaja(false);
    } finally {
      setLoadingBaja(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("El nombre de usuario no puede estar vacío.");
      return;
    }
    if (username.trim() === usuario?.username) {
      setError("Escribe un nombre diferente al actual.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put("/usuarios/perfil", {
        username: username.trim(),
        email: usuario?.email,
      });
      setSuccess("Nombre actualizado correctamente.");
      onUsernameChange(res.datos.username ?? username.trim());
    } catch (err) {
      setError(err.mensaje ?? "No se pudo actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Título */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box sx={{
            backgroundColor: "rgba(224,123,57,0.12)",
            borderRadius: "50%", width: 40, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PersonIcon sx={{ color: ORANGE }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1 }}>
              Mi perfil
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Gestiona tu información de cuenta
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "divider", mb: 3 }} />

        {/* Email (solo lectura) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EmailIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Correo electrónico
          </Typography>
        </Box>
        <TextField
          value={usuario?.email ?? ""}
          disabled
          fullWidth
          size="small"
          sx={{ ...inputSx, mb: 3 }}
          helperText={
            <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.6 }}>
              El email no se puede modificar
            </Typography>
          }
        />

        {/* Username (editable) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EditIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Nombre de usuario
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={isDark
            ? { mb: 2, backgroundColor: "#2a1010", color: "#ff8080", "& .MuiAlert-icon": { color: "#ff6b6b" } }
            : { mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={isDark
            ? { mb: 2, backgroundColor: "#0e2a1a", color: "#80ff9b", "& .MuiAlert-icon": { color: "#4caf50" } }
            : { mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleGuardar}>
          <TextField
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); setSuccess(""); }}
            fullWidth size="small"
            placeholder="Nuevo nombre de usuario"
            sx={{ ...inputSx, mb: 2.5 }}
            autoComplete="username"
          />
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: ORANGE, color: "white",
              textTransform: "none", fontWeight: 700, py: 1.2, boxShadow: "none",
              "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
              "&.Mui-disabled": { backgroundColor: "rgba(224,123,57,0.4)", color: "rgba(255,255,255,0.5)" },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Guardar cambios"}
          </Button>
        </Box>

        {/* ── Zona de baja ── */}
        <Divider sx={{ borderColor: "divider", mt: 3, mb: 2 }} />

        {!confirmBaja ? (
          <Button
            onClick={() => setConfirmBaja(true)}
            startIcon={<DeleteOutlineIcon />}
            fullWidth
            size="small"
            sx={{
              textTransform: "none",
              color: "text.secondary",
              justifyContent: "flex-start",
              px: 1,
              "&:hover": { color: "#f44336", bgcolor: "rgba(244,67,54,0.06)" },
            }}
          >
            Dar de baja mi cuenta
          </Button>
        ) : (
          <Box sx={{
            p: 2, borderRadius: 2,
            bgcolor: isDark ? "rgba(244,67,54,0.08)" : "rgba(244,67,54,0.05)",
            border: "1px solid rgba(244,67,54,0.25)",
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 18, color: "#f44336" }} />
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                ¿Seguro que quieres dar de baja tu cuenta?
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              Tu cuenta quedará desactivada. Podrás reactivarla en cualquier momento iniciando sesión.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={() => setConfirmBaja(false)}
                size="small"
                variant="outlined"
                sx={{
                  flex: 1, textTransform: "none",
                  color: "text.secondary", borderColor: "divider",
                  "&:hover": { borderColor: "text.secondary" },
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDarDeBaja}
                size="small"
                disabled={loadingBaja}
                sx={{
                  flex: 1, textTransform: "none",
                  backgroundColor: "#f44336", color: "white",
                  "&:hover": { backgroundColor: "#d32f2f" },
                  "&.Mui-disabled": { backgroundColor: "rgba(244,67,54,0.4)", color: "rgba(255,255,255,0.5)" },
                }}
              >
                {loadingBaja ? <CircularProgress size={16} sx={{ color: "white" }} /> : "Confirmar baja"}
              </Button>
            </Box>
          </Box>
        )}

      </DialogContent>
    </Dialog>
  );
}

export default PerfilDialog;
