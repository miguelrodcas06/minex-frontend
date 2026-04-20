/**
 * @fileoverview Contexto de tema claro/oscuro para MineX.
 * Crea un tema Material-UI personalizado (naranja primario #e07b39) y persiste
 * la preferencia del usuario en `localStorage` bajo la clave `minex-color-mode`.
 * @module context/ColorModeContext
 */

import { createContext, useContext, useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: "dark" });

const ORANGE = "#e07b39";

/**
 * Construye un tema Material-UI para el modo indicado.
 * @param {"dark"|"light"} mode - Modo de color.
 * @returns {Object} Tema MUI configurado.
 */
function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: ORANGE },
      ...(mode === "dark"
        ? {
            background: { default: "#0d1117", paper: "#161b22" },
            text: {
              primary: "rgba(255,255,255,0.9)",
              secondary: "rgba(255,255,255,0.45)",
            },
            divider: "rgba(255,255,255,0.08)",
          }
        : {
            background: { default: "#f4f6f8", paper: "#ffffff" },
            text: {
              primary: "#0d1117",
              secondary: "rgba(13,17,23,0.55)",
            },
            divider: "rgba(0,0,0,0.1)",
          }),
    },
  });
}

/**
 * Proveedor de tema que envuelve la aplicación.
 * Lee la preferencia guardada en `localStorage` al montar y la actualiza al hacer toggle.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem("minex-color-mode") ?? "dark"
  );

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("minex-color-mode", next);
      return next;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

/**
 * Hook para acceder al modo de color actual y a la función de alternancia.
 * @returns {Object} Objeto con `mode` y `toggleColorMode`.
 */
export const useColorMode = () => useContext(ColorModeContext);
