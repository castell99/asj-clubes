// ============================================================
// FormularioAgregar.jsx
// ============================================================
// Formulario para agregar nuevos participantes u oficiales
// directamente al Google Sheets desde la app web.

import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────
// FormularioAgregar
// Props:
//   - apiUrl: URL del Apps Script de Google Sheets
//   - clubes: lista de clubes para el selector
//   - onGuardado: función que se llama tras guardar exitosamente
// ─────────────────────────────────────────────────────────────
export default function FormularioAgregar({ apiUrl, clubes, onGuardado }) {
  // Controla si se muestra el form de participante u oficial
  const [modo, setModo] = useState('participante'); // 'participante' | 'oficial'

  // Estado del formulario de participante
  const [formParticipante, setFormParticipante] = useState({
    nombre: '', apellido: '', edad_actual: '', genero: '',
    zona: '', sector: '', etapa: '', jornada: '',
    cod_club: '', oficial: '', facilitador: '',
    contacto: '', telefono: '', estado: 'Registrado',
  });

  // Estado del formulario de oficial
  const [formOficial, setFormOficial] = useState({
    nombre: '', zona: '', telefono: '', email: '',
  });

  // Estados de UI
  const [guardando, setGuardando]   = useState(false);
  const [mensaje, setMensaje]       = useState(null); // { tipo: 'ok'|'error', texto }

  // ── Etapas de vida según edad ──
  const ETAPAS = ['2-3 Años', '4-5 Años', '6-9 Años', '10-14 Años', '15-18 Años'];
  const ZONAS  = ['COL-J01', 'COL-J02', 'COL-J03', 'COL-J04'];

  // ── Clubes únicos para el selector ──
  const clubesUnicos = [...new Map(clubes.map(c => [c.cod_club, c])).values()];

  // ── Actualizar campo del formulario de participante ──
  function cambiarParticipante(campo, valor) {
    setFormParticipante(prev => ({ ...prev, [campo]: valor }));
  }

  // ── Actualizar campo del formulario de oficial ──
  function cambiarOficial(campo, valor) {
    setFormOficial(prev => ({ ...prev, [campo]: valor }));
  }

  // ── Enviar formulario de participante ──
  async function guardarParticipante() {
    // Validar campos obligatorios
    if (!formParticipante.nombre || !formParticipante.apellido || !formParticipante.etapa) {
      setMensaje({ tipo: 'error', texto: 'Nombre, apellido y etapa son obligatorios.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      // Mapear los campos del form a los nombres de columna del Google Sheets
      const datosSheets = {
        "Nombre Completo":               formParticipante.nombre,
        "Apellido del Participante":     formParticipante.apellido,
        "Edad Actual":                   formParticipante.edad_actual,
        "Género":                        formParticipante.genero,
        "Zona":                          formParticipante.zona,
        "Sector":                        formParticipante.sector,
        "Etapa de vida":                 formParticipante.etapa,
        "Jornada Asignada":              formParticipante.jornada,
        "Cod. Club":                     formParticipante.cod_club,
        "Oficial Responsable":           formParticipante.oficial,
        "Facilitador Asignado":          formParticipante.facilitador,
        "Contacto Principal del Participante": formParticipante.contacto,
        "Telefono":                      formParticipante.telefono,
        "Estado del Participante":       formParticipante.estado,
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'participante', datos: datosSheets }),
      });

      const respuesta = await res.json();

      if (respuesta.ok) {
        setMensaje({ tipo: 'ok', texto: '✅ Participante agregado correctamente al Google Sheets.' });
        // Limpiar formulario
        setFormParticipante({
          nombre: '', apellido: '', edad_actual: '', genero: '',
          zona: '', sector: '', etapa: '', jornada: '',
          cod_club: '', oficial: '', facilitador: '',
          contacto: '', telefono: '', estado: 'Registrado',
        });
        // Refrescar datos en la app
        if (onGuardado) onGuardado();
      } else {
        setMensaje({ tipo: 'error', texto: respuesta.error || 'Error al guardar.' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Verifica tu internet.' });
    } finally {
      setGuardando(false);
    }
  }

  // ── Enviar formulario de oficial ──
  async function guardarOficial() {
    if (!formOficial.nombre || !formOficial.zona) {
      setMensaje({ tipo: 'error', texto: 'Nombre y zona son obligatorios.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'oficial', datos: formOficial }),
      });

      const respuesta = await res.json();

      if (respuesta.ok) {
        setMensaje({ tipo: 'ok', texto: '✅ Oficial agregado correctamente al Google Sheets.' });
        setFormOficial({ nombre: '', zona: '', telefono: '', email: '' });
        if (onGuardado) onGuardado();
      } else {
        setMensaje({ tipo: 'error', texto: respuesta.error || 'Error al guardar.' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Verifica tu internet.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      {/* ── Selector de modo ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>➕ Agregar nuevo registro</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={modo === 'participante' ? 'btn-primario' : 'btn-secundario'}
            onClick={() => { setModo('participante'); setMensaje(null); }}
          >
            👤 Participante
          </button>
          <button
            className={modo === 'oficial' ? 'btn-primario' : 'btn-secundario'}
            onClick={() => { setModo('oficial'); setMensaje(null); }}
          >
            🏅 Oficial
          </button>
        </div>
      </div>

      {/* ── Formulario de Participante ── */}
      {modo === 'participante' && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>👤 Datos del nuevo participante</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

            <Campo label="Nombre *">
              <input className="input-base" placeholder="Nombre(s)"
                value={formParticipante.nombre}
                onChange={e => cambiarParticipante('nombre', e.target.value)} />
            </Campo>

            <Campo label="Apellido *">
              <input className="input-base" placeholder="Apellidos"
                value={formParticipante.apellido}
                onChange={e => cambiarParticipante('apellido', e.target.value)} />
            </Campo>

            <Campo label="Edad actual">
              <input className="input-base" placeholder="Ej: 8" type="number"
                value={formParticipante.edad_actual}
                onChange={e => cambiarParticipante('edad_actual', e.target.value)} />
            </Campo>

            <Campo label="Género">
              <select className="input-base"
                value={formParticipante.genero}
                onChange={e => cambiarParticipante('genero', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </Campo>

            <Campo label="Etapa de vida *">
              <select className="input-base"
                value={formParticipante.etapa}
                onChange={e => cambiarParticipante('etapa', e.target.value)}>
                <option value="">Seleccionar...</option>
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </Campo>

            <Campo label="Zona">
              <select className="input-base"
                value={formParticipante.zona}
                onChange={e => cambiarParticipante('zona', e.target.value)}>
                <option value="">Seleccionar...</option>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </Campo>

            <Campo label="Sector">
              <input className="input-base" placeholder="Ej: COL-J0101"
                value={formParticipante.sector}
                onChange={e => cambiarParticipante('sector', e.target.value)} />
            </Campo>

            <Campo label="Jornada">
              <select className="input-base"
                value={formParticipante.jornada}
                onChange={e => cambiarParticipante('jornada', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </Campo>

            <Campo label="Club asignado">
              <select className="input-base"
                value={formParticipante.cod_club}
                onChange={e => cambiarParticipante('cod_club', e.target.value)}>
                <option value="">Seleccionar club...</option>
                {clubesUnicos.map(c => (
                  <option key={c.cod_club} value={c.cod_club}>
                    {c.cod_club} — {c.nombre_club} ({c.zona})
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Oficial responsable">
              <input className="input-base" placeholder="Nombre del oficial"
                value={formParticipante.oficial}
                onChange={e => cambiarParticipante('oficial', e.target.value)} />
            </Campo>

            <Campo label="Facilitador asignado">
              <input className="input-base" placeholder="Nombre del facilitador"
                value={formParticipante.facilitador}
                onChange={e => cambiarParticipante('facilitador', e.target.value)} />
            </Campo>

            <Campo label="Contacto principal">
              <input className="input-base" placeholder="Nombre del acudiente"
                value={formParticipante.contacto}
                onChange={e => cambiarParticipante('contacto', e.target.value)} />
            </Campo>

            <Campo label="Teléfono">
              <input className="input-base" placeholder="Número de contacto"
                value={formParticipante.telefono}
                onChange={e => cambiarParticipante('telefono', e.target.value)} />
            </Campo>

            <Campo label="Estado">
              <select className="input-base"
                value={formParticipante.estado}
                onChange={e => cambiarParticipante('estado', e.target.value)}>
                <option value="Registrado">Registrado</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </Campo>

          </div>

          {/* Botón guardar */}
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primario"
              onClick={guardarParticipante}
              disabled={guardando}
              style={{ opacity: guardando ? 0.6 : 1 }}
            >
              {guardando ? '⏳ Guardando...' : '💾 Guardar participante'}
            </button>
          </div>
        </div>
      )}

      {/* ── Formulario de Oficial ── */}
      {modo === 'oficial' && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>🏅 Datos del nuevo oficial</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

            <Campo label="Nombre completo *">
              <input className="input-base" placeholder="Nombre del oficial"
                value={formOficial.nombre}
                onChange={e => cambiarOficial('nombre', e.target.value)} />
            </Campo>

            <Campo label="Zona asignada *">
              <select className="input-base"
                value={formOficial.zona}
                onChange={e => cambiarOficial('zona', e.target.value)}>
                <option value="">Seleccionar...</option>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </Campo>

            <Campo label="Teléfono">
              <input className="input-base" placeholder="Número de contacto"
                value={formOficial.telefono}
                onChange={e => cambiarOficial('telefono', e.target.value)} />
            </Campo>

            <Campo label="Email">
              <input className="input-base" placeholder="correo@ejemplo.com" type="email"
                value={formOficial.email}
                onChange={e => cambiarOficial('email', e.target.value)} />
            </Campo>

          </div>

          {/* Botón guardar */}
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primario"
              onClick={guardarOficial}
              disabled={guardando}
              style={{ opacity: guardando ? 0.6 : 1 }}
            >
              {guardando ? '⏳ Guardando...' : '💾 Guardar oficial'}
            </button>
          </div>
        </div>
      )}

      {/* ── Mensaje de resultado ── */}
      {mensaje && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: mensaje.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${mensaje.tipo === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: mensaje.tipo === 'ok' ? '#22c55e' : '#ef4444',
          fontSize: 14,
        }}>
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Campo — wrapper de cada campo del formulario con su etiqueta
// ─────────────────────────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
