import React, { useState } from "react";
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

import api from "../api";

const ORANGE    = "#e07b39";
const DARK_BG   = "#0d1117";
const CARD_BG   = "#161b22";
const BORDER    = "rgba(255,255,255,0.1)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: DARK_BG,
    "& fieldset": { borderColor: BORDER },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: ORANGE },
    "&.Mui-disabled": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ORANGE },
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: TEXT_MUTED },
};

function PerfilDialog({ open, onClose, usuario, onUsernameChange }) {
  const [username, setUsername] = useState(usuario?.username ?? "");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const handleClose = () => {
    setError("");
    setSuccess("");
    onClose();
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
      PaperProps={{
        sx: {
          backgroundColor: CARD_BG,
          backgroundImage: "none",
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>

        {/* Botón cerrar */}
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: TEXT_MUTED,
            "&:hover": { color: "white" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Título */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              backgroundColor: "rgba(224,123,57,0.12)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonIcon sx={{ color: ORANGE }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 700, lineHeight: 1 }}>
              Mi perfil
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
              Gestiona tu información de cuenta
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 3 }} />

        {/* Email (solo lectura) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EmailIcon sx={{ fontSize: 15, color: TEXT_MUTED }} />
          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
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
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.25)" }}>
              El email no se puede modificar
            </Typography>
          }
        />

        {/* Username (editable) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EditIcon sx={{ fontSize: 15, color: TEXT_MUTED }} />
          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
            Nombre de usuario
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, backgroundColor: "#2a1010", color: "#ff8080", "& .MuiAlert-icon": { color: "#ff6b6b" } }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, backgroundColor: "#0e2a1a", color: "#80ff9b", "& .MuiAlert-icon": { color: "#4caf50" } }}
          >
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleGuardar}>
          <TextField
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); setSuccess(""); }}
            fullWidth
            size="small"
            placeholder="Nuevo nombre de usuario"
            sx={{ ...inputSx, mb: 2.5 }}
            autoComplete="username"
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
              : "Guardar cambios"}
          </Button>
        </Box>

      </DialogContent>
    </Dialog>
  );
}

export default PerfilDialog;
