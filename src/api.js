/**
 * @fileoverview Módulo de configuración de Axios para comunicación con el backend
 * @module api
 */

import axios from "axios";

/**
 * Instancia configurada de Axios para comunicación con el backend (LOCAL)
 */
const api = axios.create({
  // Configuración para trabajar en el propio PC
  baseURL: "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * INTERCEPTOR DE SOLICITUD (REQUEST)
 * Inyecta el token de autenticación en cada petición si existe.
 * Es fundamental para que funcionen las peticiones POST, PUT y DELETE.
 */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token"); // O localStorage según uses
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * INTERCEPTOR DE RESPUESTA (RESPONSE)
 * Maneja errores centralizados y simplifica la respuesta.
 */
api.interceptors.response.use(
  (response) => {
    // Retornamos directamente los datos (response.data)
    return response.data;
  },
  (error) => {
    let mensajeError = "Error desconocido";

    if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      mensajeError = error.response.data?.mensaje || `Error: ${error.response.status} ${error.response.statusText}`;

      // Si el error es 401/403 Y ya había un token activo, significa que
      // la sesión expiró o fue revocada → limpiar y redirigir al inicio.
      // Si NO hay token (p.ej. intento de login fallido), dejar que el
      // componente maneje el error con su propio mensaje.
      if (error.response.status === 401 || error.response.status === 403) {
        const tokenActivo = sessionStorage.getItem("token");
        if (tokenActivo) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("usuario");
          window.location.href = "/";
        }
      }
    } else if (error.request) {
      // No hubo respuesta del servidor
      mensajeError = "No se pudo conectar con el servidor.";
    } else {
      // Error al configurar la petición
      mensajeError = error.message;
    }

    // Retornamos un objeto de error rechazado con el mensaje procesado
    return Promise.reject({ mensaje: mensajeError, original: error });
  },
);

export default api;
