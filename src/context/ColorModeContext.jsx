import { createContext, useContext, useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: "dark" });

const ORANGE = "#e07b39";

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

export const useColorMode = () => useContext(ColorModeContext);
