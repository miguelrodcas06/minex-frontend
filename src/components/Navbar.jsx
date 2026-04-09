import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { NavLink, useNavigate } from "react-router";

import DiamondIcon from "@mui/icons-material/Diamond";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArticleIcon from "@mui/icons-material/Article";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import LockIcon from "@mui/icons-material/Lock";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import LoginDialog from "./LoginDialog";
import PerfilDialog from "./PerfilDialog";
import { useColorMode } from "../context/ColorModeContext";

export const SIDEBAR_W = 240;

const ORANGE = "#e07b39";

const NAV_LINKS = [
  { label: "Panel",     to: "/",          icon: <DashboardIcon     fontSize="small" />, end: true              },
  { label: "Simulador", to: "/simulador", icon: <CompareArrowsIcon fontSize="small" />                        },
  { label: "Tesorería", to: "/tesoreria", icon: <AccountBalanceIcon fontSize="small" />, protected: true       },
  { label: "Noticias",  to: "/noticias",  icon: <ArticleIcon       fontSize="small" />                        },
];

// ─── Sidebar content (shared between permanent + temporary drawer) ─────────────

function SidebarContent({ onClose, isLoggedIn, usuario, onOpenLogin, onLogout, onOpenPerfil }) {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Box
      sx={{
        width: SIDEBAR_W,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* ── Logo ── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box
          component={NavLink}
          to="/"
          onClick={onClose}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              backgroundColor: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DiamondIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1.1 }}
            >
              MineX
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
              Plataforma Mineral
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Nav links ── */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: "auto" }}>
        {NAV_LINKS.map(({ label, to, icon, end, protected: isProtected }) => (
          <Box
            key={label}
            component={NavLink}
            to={isProtected && !isLoggedIn ? undefined : to}
            end={end}
            onClick={(e) => {
              if (isProtected && !isLoggedIn) {
                e.preventDefault();
                onClose?.();
                onOpenLogin();
              } else {
                onClose?.();
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              color: "text.secondary",
              fontSize: "0.875rem",
              fontWeight: 400,
              px: 2,
              py: 1.1,
              mx: 1,
              borderRadius: 1.5,
              borderLeft: "3px solid transparent",
              transition: "all 0.15s",
              cursor: "pointer",
              userSelect: "none",
              "&:hover": {
                bgcolor: "action.hover",
                color: "text.primary",
              },
              "&.active": {
                color: ORANGE,
                bgcolor: "rgba(224,123,57,0.1)",
                borderLeftColor: ORANGE,
                fontWeight: 600,
              },
            }}
          >
            <Box sx={{ display: "flex", color: "inherit", "& svg": { fontSize: "1.1rem" } }}>
              {icon}
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: "inherit", color: "inherit", flex: 1 }}
            >
              {label}
            </Typography>
            {isProtected && !isLoggedIn && (
              <LockIcon sx={{ fontSize: 12, opacity: 0.5 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* ── Bottom: theme toggle + user ── */}
      <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}>
        {/* Theme toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {mode === "dark"
              ? <DarkModeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              : <LightModeIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {mode === "dark" ? "Modo oscuro" : "Modo claro"}
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={mode === "light"}
            onChange={toggleColorMode}
            sx={{
              "& .MuiSwitch-thumb": { backgroundColor: ORANGE },
              "& .MuiSwitch-track": { backgroundColor: `${ORANGE}55 !important` },
            }}
          />
        </Box>

        {/* User section */}
        <Box sx={{ px: 1.5, py: 1.5 }}>
          {isLoggedIn ? (
            <>
              {usuario?.username && (
                <Box
                  onClick={() => { onClose?.(); onOpenPerfil(); }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    mb: 0.5,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <PersonOutlineIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {usuario.username}
                  </Typography>
                </Box>
              )}
              <Button
                onClick={() => { onClose?.(); onLogout(); }}
                startIcon={<LogoutIcon />}
                fullWidth
                size="small"
                sx={{
                  textTransform: "none",
                  color: ORANGE,
                  justifyContent: "flex-start",
                  px: 1.5,
                  "&:hover": { bgcolor: "rgba(224,123,57,0.08)" },
                }}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Button
              onClick={() => { onClose?.(); onOpenLogin(); }}
              startIcon={<PersonOutlineIcon />}
              fullWidth
              variant="contained"
              size="small"
              sx={{
                backgroundColor: ORANGE,
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
              }}
            >
              Iniciar Sesión
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main Navbar (Sidebar) component ─────────────────────────────────────────

function Navbar() {
  const [mobileOpen,  setMobileOpen]  = React.useState(false);
  const [loginOpen,   setLoginOpen]   = React.useState(false);
  const [perfilOpen,  setPerfilOpen]  = React.useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = React.useState(
    () => Boolean(sessionStorage.getItem("token"))
  );
  const [usuario, setUsuario] = React.useState(
    () => JSON.parse(sessionStorage.getItem("usuario") ?? "null")
  );
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "" });

  const navigate = useNavigate();

  const handleLoginSuccess = (usuarioData, mensaje) => {
    setIsLoggedIn(true);
    setUsuario(usuarioData);
    if (mensaje) setSnackbar({ open: true, message: mensaje });
    window.dispatchEvent(new CustomEvent("minex:login"));
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUsuario(null);
    window.dispatchEvent(new CustomEvent("minex:logout"));
    navigate("/");
  };

  const handleOpenLogin = () => setLoginOpen(true);

  const handleUsernameChange = (nuevoUsername) => {
    const actualizado = { ...usuario, username: nuevoUsername };
    setUsuario(actualizado);
    sessionStorage.setItem("usuario", JSON.stringify(actualizado));
  };

  const sidebarProps = {
    isLoggedIn,
    usuario,
    onOpenLogin:  handleOpenLogin,
    onLogout:     handleLogout,
    onOpenPerfil: () => setPerfilOpen(true),
  };

  return (
    <>
      {/* ── Mobile: top AppBar ── */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, color: "text.primary" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile logo */}
          <Box
            component={NavLink}
            to="/"
            sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                backgroundColor: ORANGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DiamondIcon sx={{ color: "#fff", fontSize: 17 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700 }}>
              MineX
            </Typography>
          </Box>

          <Box sx={{ ml: "auto" }}>
            {isLoggedIn ? (
              <IconButton
                onClick={() => setPerfilOpen(true)}
                sx={{ color: "text.secondary" }}
                size="small"
              >
                <PersonOutlineIcon />
              </IconButton>
            ) : (
              <Button
                onClick={handleOpenLogin}
                size="small"
                variant="contained"
                sx={{
                  backgroundColor: ORANGE,
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  fontSize: "0.8rem",
                  "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
                }}
              >
                Iniciar Sesión
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Mobile: temporary Drawer ── */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_W,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <SidebarContent
          {...sidebarProps}
          onClose={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* ── Desktop: permanent Drawer ── */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: SIDEBAR_W,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_W,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        <SidebarContent {...sidebarProps} />
      </Drawer>

      {/* ── Dialogs ── */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <PerfilDialog
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        usuario={usuario}
        onUsernameChange={handleUsernameChange}
        onBaja={handleLogout}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, message: "" })}
          severity="success"
          sx={{
            backgroundColor: "#0e2a1a",
            color: "#80ff9b",
            "& .MuiAlert-icon": { color: "#4caf50" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
