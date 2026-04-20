/**
 * @fileoverview Layout principal de MineX. Combina el Navbar lateral persistente,
 * el área de contenido (`<Outlet />`) y el Footer en un flexbox responsive.
 * En móvil añade un Toolbar espaciador para compensar el AppBar fijo.
 * @module pages/Home
 */

import { Outlet } from "react-router";
import Navbar, { SIDEBAR_W } from "../components/Navbar";
import Footer from "../components/Footer";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

/**
 * Componente de layout raíz. Renderiza el Navbar, el área de rutas hijas y el Footer.
 * @returns {JSX.Element}
 */
function Home() {
  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />

      {/* Main area: flex: 1, pushes right of the permanent sidebar */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          // On desktop the permanent Drawer already takes SIDEBAR_W out of the flow.
          // On mobile the Drawer is overlay so we don't need a margin — but we need
          // to push content below the fixed AppBar.
        }}
      >
        {/* Spacer for the fixed mobile AppBar (hidden on md+) */}
        <Toolbar sx={{ display: { md: "none" } }} />

        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default Home;
