/**
 * @fileoverview Página de error polivalente para MineX.
 * Detecta el tipo de error (404, 503, red, genérico) y muestra un mensaje
 * contextualizado con icono, código HTTP y botones de "Reintentar" / "Ir al inicio".
 * En entorno de desarrollo (`import.meta.env.DEV`) también muestra el stack del error.
 * @module pages/ErrorPage
 */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { useTheme } from "@mui/material/styles";

import WifiOffIcon from "@mui/icons-material/WifiOff";
import StorageIcon from "@mui/icons-material/Storage";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeIcon from "@mui/icons-material/Home";

import { useNavigate, useRouteError } from "react-router";

const ORANGE = "#e07b39";

const ERROR_TYPES = {
  network: {
    icon: <WifiOffIcon sx={{ fontSize: 80, color: ORANGE, opacity: 0.85 }} />,
    title: "Sin conexión",
    description: "No se puede conectar con el servidor. Comprueba que el backend está en marcha o revisa tu conexión a Internet.",
    code: null,
  },
  database: {
    icon: <StorageIcon sx={{ fontSize: 80, color: ORANGE, opacity: 0.85 }} />,
    title: "Base de datos no disponible",
    description: "El servidor está activo pero no puede acceder a la base de datos. Asegúrate de que phpMyAdmin y el contenedor Docker están en ejecución.",
    code: 503,
  },
  notFound: {
    icon: <ErrorOutlineIcon sx={{ fontSize: 80, color: ORANGE, opacity: 0.85 }} />,
    title: "Página no encontrada",
    description: "La página que buscas no existe o ha sido movida.",
    code: 404,
  },
  generic: {
    icon: <ErrorOutlineIcon sx={{ fontSize: 80, color: ORANGE, opacity: 0.85 }} />,
    title: "Algo ha ido mal",
    description: "Ha ocurrido un error inesperado. Puedes intentar recargar la página.",
    code: null,
  },
};

/**
 * Mapea un objeto de error a uno de los tipos predefinidos en `ERROR_TYPES`.
 * @param {object|null} error - Error de ruta (React Router) o de Axios.
 * @returns {Object} Objeto con icon, title, description y code.
 */
function resolveErrorType(error) {
  if (!error) return ERROR_TYPES.generic;
  const status = error?.status ?? error?.response?.status;
  if (status === 404) return ERROR_TYPES.notFound;
  if (status === 503) return ERROR_TYPES.database;
  if (
    error?.code === "ERR_NETWORK" ||
    error?.message === "Network Error" ||
    (error?.name === "AxiosError" && !error?.response)
  ) return ERROR_TYPES.network;
  return ERROR_TYPES.generic;
}

/**
 * Página de error con soporte para errores de ruta (React Router) y errores prop.
 * @param {Object} [props] - Error opcional pasado como prop (p.ej. desde un boundary).
 * @returns {JSX.Element}
 */
function ErrorPage({ error: propError }) {
  const navigate   = useNavigate();
  const routeError = useRouteError();
  const theme      = useTheme();
  const isDark     = theme.palette.mode === "dark";

  const error = propError ?? routeError;
  const { icon, title, description, code } = resolveErrorType(error);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 3,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {icon}

          {code && (
            <Typography
              variant="h1"
              sx={{ fontSize: "5rem", fontWeight: 800, color: ORANGE, lineHeight: 1, opacity: 0.3, mt: -2 }}
            >
              {code}
            </Typography>
          )}

          <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700 }}>
            {title}
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, maxWidth: 380 }}>
            {description}
          </Typography>

          {import.meta.env.DEV && error?.message && (
            <Box
              sx={{
                bgcolor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.05)",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                px: 2, py: 1,
                width: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontFamily: "monospace", wordBreak: "break-all", opacity: 0.7 }}
              >
                {error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{
                backgroundColor: ORANGE, color: "white",
                textTransform: "none", fontWeight: 600, boxShadow: "none",
                "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
              }}
            >
              Reintentar
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => navigate("/")}
              sx={{
                color: "text.secondary",
                borderColor: "divider",
                textTransform: "none",
                "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
              }}
            >
              Ir al inicio
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default ErrorPage;
