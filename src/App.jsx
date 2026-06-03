// ============================================================
// App.jsx — Componente raíz de la aplicación
// ============================================================
// Carga los datos desde Google Sheets en tiempo real,
// gestiona la navegación entre pestañas
// y renderiza el componente correspondiente a cada sección.

import React, { useState, useEffect } from 'react';
import './App.css';

// Datos estáticos como respaldo inicial (mientras carga Google Sheets)
import participantesLocal from './data/participantes.json';
import clubesData from './data/clubes.json';

// Componentes de cada sección
import BuscadorParticipante from './components/BuscadorParticipante';
import PanelEstadisticas    from './components/PanelEstadisticas';
import VistaClubes          from './components/VistaClubes';
import VistaHorario         from './components/VistaHorario';
import FormularioAgregar    from './components/FormularioAgregar';

// ── URL de la API de Google Sheets (Apps Script) ──
// Esta URL conecta la app con tu Google Sheets directamente
const API_URL = "https://script.google.com/macros/s/AKfycbwEnuuf7DTrfPMO0OdicLFZ2Wxc9o0C3lp_4gOhv3KxJ3qXR_tHXAOsFcPky8lj0A084w/exec";

// ── Definición de las pestañas de navegación ──
const TABS = [
  { id: 'buscar',      label: 'Buscar Participante', icono: '🔍' },
  { id: 'agregar',     label: 'Agregar',              icono: '➕' },
  { id: 'estadisticas', label: 'Estadísticas',        icono: '📊' },
  { id: 'clubes',      label: 'Clubes',               icono: '🏫' },
  { id: 'horario',     label: 'Horario',              icono: '📅' },
];

export default function App() {
  // Pestaña activa
  const [tabActivo, setTabActivo] = useState('buscar');

  // Participantes cargados desde Google Sheets (inicia con datos locales)
  const [participantes, setParticipantes] = useState(participantesLocal);

  // Estado de carga desde Google Sheets
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState(null);

  // ── Cargar participantes desde Google Sheets al iniciar ──
  useEffect(() => {
    cargarParticipantes();
  }, []);

  // Función para obtener participantes frescos desde Google Sheets
  async function cargarParticipantes() {
    try {
      setCargando(true);
      setErrorApi(null);
      const res = await fetch(`${API_URL}?tipo=participantes`);
      const datos = await res.json();

      // Si la API devuelve un error, usar datos locales como respaldo
      if (datos.error) {
        console.warn("API error:", datos.error);
        setErrorApi("Usando datos locales (Google Sheets no disponible)");
      } else {
        // Normalizar columnas del Sheets al formato que usa la app
        const normalizados = datos.map(p => ({
          codigo:       p["Código"]                        || p.codigo       || "",
          nombre:       p[" Nombre Completo"]              || p["Nombre Completo"] || p.nombre || "",
          apellido:     p["Apellido del Participante"]     || p.apellido     || "",
          edad_actual:  p["Edad Actual"]                   || p.edad_actual  || "",
          edad_2026:    p["Edad 2026"]                     || p.edad_2026    || "",
          etapa:        p["Etapa de vida"]                 || p.etapa        || "",
          zona:         p["Zona"]                          || p.zona         || "",
          sector:       p["Sector"]                        || p.sector       || "",
          cod_club:     p["Cod. Club"]                     || p.cod_club     || "",
          nombre_club:  p["Nombre de  club"]               || p.nombre_club  || "",
          jornada:      p["Jornada Asignada"]              || p.jornada      || "",
          horario1:     p["Horario 1"]                     || p.horario1     || "",
          horario2:     p["Horario 2"]                     || p.horario2     || "",
          oficial:      p["Oficial Responsable"]           || p.oficial      || "",
          facilitador:  p["Facilitador Asignado"]          || p.facilitador  || "",
          estado:       p["Estado del Participante"]       || p.estado       || "",
          pps_nombre:   p["PPS Asignado"]                  || p.pps_nombre   || "",
          pps_abrev:    p["Abreviatura PPS"]               || p.pps_abrev    || "",
          contacto:     p["Contacto Principal del Participante"] || p.contacto || "",
          telefono:     p["Telefono"]                      || p.telefono     || "",
          genero:       p["Género"]                        || p.genero       || "",
        }));
        setParticipantes(normalizados);
      }
    } catch (err) {
      // Si falla la red, usar datos locales
      console.warn("Sin conexión a Google Sheets, usando datos locales");
      setErrorApi("Sin conexión a Google Sheets. Mostrando datos locales.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app-wrapper">

      {/* ── Encabezado de la aplicación ── */}
      <header className="app-header">
        <div className="logo-icono">🌟</div>
        <div style={{ flex: 1 }}>
          <h1>ASJ Clubes</h1>
          <p>
            {cargando
              ? "Cargando datos desde Google Sheets..."
              : `${participantes.length} participantes · ${clubesData.length} clubes`}
          </p>
        </div>
        {/* Botón para refrescar datos desde Google Sheets */}
        <button
          className="btn-secundario"
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={cargarParticipantes}
          disabled={cargando}
        >
          {cargando ? "⏳ Cargando..." : "🔄 Actualizar"}
        </button>
      </header>

      {/* Aviso si Google Sheets no está disponible */}
      {errorApi && (
        <div style={{
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#eab308',
        }}>
          ⚠️ {errorApi}
        </div>
      )}

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
            participantes={participantes}
            clubes={clubesData}
            apiUrl={API_URL}
            onActualizar={cargarParticipantes}
          />
        )}

        {tabActivo === 'agregar' && (
          <FormularioAgregar
            apiUrl={API_URL}
            clubes={clubesData}
            todosParticipantes={participantes}
            onGuardado={cargarParticipantes} // Refresca los datos tras guardar
          />
        )}

        {tabActivo === 'estadisticas' && (
          <PanelEstadisticas
            participantes={participantes}
            clubes={clubesData}
          />
        )}

        {tabActivo === 'horario' && (
          <VistaHorario
            clubes={clubesData}
            participantes={participantes}
            apiUrl={API_URL}
          />
        )}

        {tabActivo === 'clubes' && (
          <VistaClubes
            clubes={clubesData}
            participantes={participantes}
          />
        )}
      </main>
    </div>
  );
}

