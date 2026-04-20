/**
 * @fileoverview Configuración del router principal de MineX con React Router v7.
 * Define todas las rutas de la SPA: Panel (index), Simulador, Tesorería (protegida),
 * Noticias, Catálogo y el fallback de error. Tesorería/Noticias/Catálogo se cargan
 * de forma lazy para reducir el bundle inicial.
 * @module App
 */

import { RouterProvider } from "react-router/dom";
import { createBrowserRouter } from "react-router";

import Home from "./pages/Home";
import Panel from "./pages/Panel";
import Simulador from "./pages/Simulador";
import ErrorPage from "./pages/ErrorPage";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: Panel },
      { path: "simulador", Component: Simulador },
      {
        Component: ProtectedRoute,
        children: [
          { path: "tesoreria", lazy: () => import("./pages/Tesoreria").then((m) => ({ Component: m.default })) },
        ],
      },
      { path: "noticias",  lazy: () => import("./pages/Noticias").then((m) => ({ Component: m.default })) },
      { path: "catalogo", lazy: () => import("./pages/Catalogo").then((m) => ({ Component: m.default })) },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
