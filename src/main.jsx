/**
 * @fileoverview Punto de entrada de la aplicación React MineX.
 * Envuelve la app en StrictMode y en el proveedor de tema (ColorModeProvider)
 * antes de montar el árbol de componentes en el elemento `#root` del DOM.
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ColorModeProvider } from './context/ColorModeContext.jsx';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </StrictMode>,
)
