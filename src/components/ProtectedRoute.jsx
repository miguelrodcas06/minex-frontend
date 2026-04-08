import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import LoginDialog from "./LoginDialog";

function ProtectedRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(sessionStorage.getItem("token")));
  const [loginOpen,  setLoginOpen]  = useState(!isLoggedIn);
  const navigate = useNavigate();

  // Reaccionar si el login ocurre desde otro sitio (ej. Navbar)
  useEffect(() => {
    const onLogin = () => setIsLoggedIn(true);
    window.addEventListener("minex:login", onLogin);
    return () => window.removeEventListener("minex:login", onLogin);
  }, []);

  const handleLoginSuccess = (usuarioData, mensaje) => {
    sessionStorage.setItem("usuario", JSON.stringify(usuarioData));
    setIsLoggedIn(true);
    setLoginOpen(false);
    window.dispatchEvent(new CustomEvent("minex:login", { detail: { mensaje } }));
  };

  const handleClose = () => {
    setLoginOpen(false);
    navigate("/"); // Si cierra sin loguearse, volver al inicio
  };

  if (isLoggedIn) return <Outlet />;

  return (
    <LoginDialog
      open={loginOpen}
      onClose={handleClose}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default ProtectedRoute;
