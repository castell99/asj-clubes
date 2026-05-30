// ============================================================
// App.jsx — Componente raíz de la aplicación
// ============================================================
// Carga los datos desde los archivos JSON,
// gestiona la navegación entre pestañas
// y renderiza el componente correspondiente a cada sección.

import React, { useState } from 'react';
import './App.css';

// Datos estáticos generados desde el Excel original
import participantesData from './data/participantes.json';
import clubesData from './data/clubes.json';

// Componentes de cada sección
import BuscadorParticipante from './components/BuscadorParticipante';
import PanelEstadisticas    from './components/PanelEstadisticas';
import VistaClubes          from './components/VistaClubes';

// ── Definición de las pestañas de navegación ──
// Cada pestaña tiene: id único, etiqueta visible e icono
const TABS = [
  { id: 'buscar',      label: 'Buscar Participante', icono: '🔍' },
  { id: 'estadisticas', label: 'Estadísticas',        icono: '📊' },
  { id: 'clubes',      label: 'Clubes',               icono: '🏫' },
];

export default function App() {
  // Pestaña activa — por defecto muestra el buscador
  const [tabActivo, setTabActivo] = useState('buscar');

  return (
    <div className="app-wrapper">

      {/* ── Encabezado de la aplicación ── */}
      <header className="app-header">
        <div className="logo-icono">🌟</div>
        <div>
          <h1>ASJ Clubes</h1>
          <p>Sistema de gestión de participantes y clubes · {participantesData.length} participantes · {clubesData.length} clubes</p>
        </div>
      </header>

      {/* ── Navegación por pestañas ── */}
      <nav className="nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${tabActivo === tab.id ? 'activo' : ''}`}
            onClick={() => setTabActivo(tab.id)}
          >
            {tab.icono} {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Contenido principal según pestaña activa ── */}
      <main>
        {tabActivo === 'buscar' && (
          <BuscadorParticipante
            participantes={participantesData}
            clubes={clubesData}
          />
        )}

        {tabActivo === 'estadisticas' && (
          <PanelEstadisticas
            participantes={participantesData}
            clubes={clubesData}
          />
        )}

        {tabActivo === 'clubes' && (
          <VistaClubes
            clubes={clubesData}
            participantes={participantesData}
          />
        )}
      </main>
    </div>
  );
}
