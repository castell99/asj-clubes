// Punto de entrada de la aplicación React
// Este archivo monta el componente raíz <App /> dentro del div#root del HTML

import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Crea la raíz de React y renderiza la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
