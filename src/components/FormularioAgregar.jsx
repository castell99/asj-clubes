// ============================================================
// FormularioAgregar.jsx — con sugerencias inteligentes
// ============================================================
// Formulario para agregar participantes u oficiales.
// A medida que se rellena:
//   - La edad sugiere automáticamente la etapa de vida
//   - Al tener etapa + jornada + zona, sugiere clubes compatibles
//     ordenados por cercanía, igual que el recomendador

import React, { useState, useMemo } from 'react';
import { filtrarClubesCompatibles, getEtapaColor } from '../utils/clubUtils';

// ── Mapa de edad → etapa de vida ──
// Dado un número de edad, devuelve la etapa correspondiente
function edadAEtapa(edad) {
  const n = parseInt(edad, 10);
  if (isNaN(n)) return '';
  if (n <= 3)  return '2-3 Años';
  if (n <= 5)  return '4-5 Años';
  if (n <= 9)  return '6-9 Años';
  if (n <= 14) return '10-14 Años';
  if (n <= 18) return '15-18 Años';
  return '';
}

// ─────────────────────────────────────────────────────────────
// FormularioAgregar
// Props:
//   - apiUrl: URL del Apps Script de Google Sheets
//   - clubes: lista de clubes para sugerencias y selector
//   - todosParticipantes: para calcular ocupación actual de clubes
//   - onGuardado: función que se llama tras guardar exitosamente
// ─────────────────────────────────────────────────────────────
export default function FormularioAgregar({ apiUrl, clubes, todosParticipantes = [], onGuardado }) {
  // Modo activo: formulario de participante u oficial
  const [modo, setModo] = useState('participante');

  // Estado del formulario de participante
  const [form, setForm] = useState({
    nombre: '', apellido: '', edad_actual: '', genero: '',
    zona: '', sector: '', etapa: '', jornada: '',
    cod_club: '', oficial: '', facilitador: '',
    contacto: '', telefono: '', estado: 'Registrado',
  });

  // Estado del formulario de oficial
  const [formOficial, setFormOficial] = useState({
    nombre: '', zona: '', telefono: '', email: '',
  });

  // Sugerencia de etapa basada en edad (se muestra como pill informativo)
  const [etapaSugerida, setEtapaSugerida] = useState('');

  // Club seleccionado desde las sugerencias (antes de confirmar)
  const [clubSugerido, setClubSugerido] = useState(null);

  // Estados de UI
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje]     = useState(null);

  const ZONAS  = ['COL-J01', 'COL-J02', 'COL-J03', 'COL-J04'];

  // ── Actualizar campo del form de participante ──
  // Si el campo es "edad_actual", calcula y sugiere la etapa automáticamente
  function cambiar(campo, valor) {
    setForm(prev => {
      const nuevo = { ...prev, [campo]: valor };

      // Sugerir etapa cuando cambia la edad
      // Siempre actualiza el selector automáticamente,
      // el usuario puede cambiarlo manualmente después si necesita
      if (campo === 'edad_actual') {
        const sugerencia = edadAEtapa(valor);
        setEtapaSugerida(sugerencia);
        if (sugerencia) {
          nuevo.etapa = sugerencia;
        }
      }

      // Limpiar club elegido si cambia zona, etapa o jornada
      if (['zona', 'etapa', 'jornada'].includes(campo)) {
        nuevo.cod_club = '';
        setClubSugerido(null);
      }

      return nuevo;
    });
  }

  // ── Calcular clubes compatibles en tiempo real ──
  // Se activa cuando el participante tiene etapa + jornada + zona
  const clubesCompatibles = useMemo(() => {
    if (!form.etapa || !form.jornada || !form.zona) return [];

    // Construir un "participante temporal" para usar la función de filtrado existente
    const participanteTemporal = {
      etapa: form.etapa,
      jornada: form.jornada,
      zona: form.zona,
      cod_club: '', // No tiene club aún, así no se excluye ninguno
    };

    return filtrarClubesCompatibles({
      participante: participanteTemporal,
      clubes,
      todosParticipantes,
    }).slice(0, 6); // Mostrar máximo 6 sugerencias
  }, [form.etapa, form.jornada, form.zona, clubes, todosParticipantes]);

  // ── Seleccionar club desde las sugerencias ──
  function elegirClub(club) {
    setClubSugerido(club);
    cambiar('cod_club', club.cod_club);
  }

  // ── Guardar participante ──
  async function guardarParticipante() {
    if (!form.nombre || !form.apellido || !form.etapa) {
      setMensaje({ tipo: 'error', texto: 'Nombre, apellido y etapa son obligatorios.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const datosSheets = {
        "Nombre Completo":                    form.nombre,
        "Apellido del Participante":          form.apellido,
        "Edad Actual":                        form.edad_actual,
        "Género":                             form.genero,
        "Zona":                               form.zona,
        "Sector":                             form.sector,
        "Etapa de vida":                      form.etapa,
        "Jornada Asignada":                   form.jornada,
        "Cod. Club":                          form.cod_club,
        "Oficial Responsable":                form.oficial,
        "Facilitador Asignado":               form.facilitador,
        "Contacto Principal del Participante": form.contacto,
        "Telefono":                           form.telefono,
        "Estado del Participante":            form.estado,
      };
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'participante', datos: datosSheets }),
      });
      const respuesta = await res.json();
      if (respuesta.ok) {
        setMensaje({ tipo: 'ok', texto: '✅ Participante agregado correctamente al Google Sheets.' });
        setForm({ nombre: '', apellido: '', edad_actual: '', genero: '', zona: '', sector: '',
                  etapa: '', jornada: '', cod_club: '', oficial: '', facilitador: '',
                  contacto: '', telefono: '', estado: 'Registrado' });
        setEtapaSugerida('');
        setClubSugerido(null);
        if (onGuardado) onGuardado();
      } else {
        setMensaje({ tipo: 'error', texto: respuesta.error || 'Error al guardar.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Verifica tu internet.' });
    } finally {
      setGuardando(false);
    }
  }

  // ── Guardar oficial ──
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
    } catch {
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
          <button className={modo === 'participante' ? 'btn-primario' : 'btn-secundario'}
            onClick={() => { setModo('participante'); setMensaje(null); }}>
            👤 Participante
          </button>
          <button className={modo === 'oficial' ? 'btn-primario' : 'btn-secundario'}
            onClick={() => { setModo('oficial'); setMensaje(null); }}>
            🏅 Oficial
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FORMULARIO DE PARTICIPANTE
      ══════════════════════════════════════════ */}
      {modo === 'participante' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>👤 Datos personales</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

              <Campo label="Nombre *">
                <input className="input-base" placeholder="Nombre(s)"
                  value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} />
              </Campo>

              <Campo label="Apellido *">
                <input className="input-base" placeholder="Apellidos"
                  value={form.apellido} onChange={e => cambiar('apellido', e.target.value)} />
              </Campo>

              {/* Edad con sugerencia automática de etapa */}
              <Campo label="Edad actual">
                <input className="input-base" placeholder="Ej: 8" type="number"
                  value={form.edad_actual} onChange={e => cambiar('edad_actual', e.target.value)} />
                {/* Pill de sugerencia de etapa */}
                {etapaSugerida && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Etapa sugerida:</span>
                    <span className={`badge ${getEtapaColor(etapaSugerida)}`} style={{ fontSize: 11 }}>
                      ✨ {etapaSugerida}
                    </span>
                  </div>
                )}
              </Campo>

              <Campo label="Género">
                <select className="input-base" value={form.genero}
                  onChange={e => cambiar('genero', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </Campo>

              {/* Etapa — se autocompleta con la edad pero puede cambiarse */}
              <Campo label="Etapa de vida *">
                <select className="input-base" value={form.etapa}
                  onChange={e => cambiar('etapa', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {['2-3 Años','4-5 Años','6-9 Años','10-14 Años','15-18 Años'].map(e =>
                    <option key={e} value={e}>{e}</option>)}
                </select>
              </Campo>

              <Campo label="Zona">
                <select className="input-base" value={form.zona}
                  onChange={e => cambiar('zona', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </Campo>

              <Campo label="Sector">
                <input className="input-base" placeholder="Ej: COL-J0101"
                  value={form.sector} onChange={e => cambiar('sector', e.target.value)} />
              </Campo>

              <Campo label="Jornada">
                <select className="input-base" value={form.jornada}
                  onChange={e => cambiar('jornada', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </Campo>

              <Campo label="Contacto principal">
                <input className="input-base" placeholder="Nombre del acudiente"
                  value={form.contacto} onChange={e => cambiar('contacto', e.target.value)} />
              </Campo>

              <Campo label="Teléfono">
                <input className="input-base" placeholder="Número de contacto"
                  value={form.telefono} onChange={e => cambiar('telefono', e.target.value)} />
              </Campo>

              <Campo label="Estado">
                <select className="input-base" value={form.estado}
                  onChange={e => cambiar('estado', e.target.value)}>
                  <option value="Registrado">Registrado</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </Campo>

            </div>
          </div>

          {/* ── Sugerencias de club inteligentes ── */}
          {/* Se muestran cuando hay etapa + jornada + zona */}
          {clubesCompatibles.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>
                🎯 Clubes recomendados
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                Basado en <strong style={{ color: '#e2e8f0' }}>{form.etapa}</strong> · Jornada{' '}
                <strong style={{ color: '#e2e8f0' }}>{form.jornada}</strong> · Zona{' '}
                <strong style={{ color: '#f97316' }}>{form.zona}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {clubesCompatibles.map(club => {
                  const seleccionado = clubSugerido?.cod_club === club.cod_club;
                  const iconoCercania = club.distanciaZona === 0 ? '🟢' : club.distanciaZona === 1 ? '🟡' : '🔴';
                  const pct = Math.min((club.participantesActuales / 30) * 100, 100);
                  const colorBarra = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';

                  return (
                    <div
                      key={club.cod_club}
                      onClick={() => club.hayEspacio && elegirClub(club)}
                      style={{
                        padding: 14, borderRadius: 12, cursor: club.hayEspacio ? 'pointer' : 'not-allowed',
                        border: `2px solid ${seleccionado ? '#f97316' : '#334155'}`,
                        background: seleccionado ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)',
                        opacity: club.hayEspacio ? 1 : 0.5,
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Encabezado de la tarjeta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{club.cod_club}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{club.nombre_club}</div>
                        </div>
                        {/* Check si está seleccionado */}
                        {seleccionado && (
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: '#f97316', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 13,
                          }}>✓</div>
                        )}
                      </div>

                      {/* Datos del club */}
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                        {iconoCercania} {club.zona} · {club.horario1}
                        {club.horario2 ? ` / ${club.horario2}` : ''}
                      </div>

                      {/* Barra de ocupación */}
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#94a3b8' }}>Ocupación</span>
                          <span style={{ color: colorBarra }}>
                            {club.participantesActuales}/30 · {club.capacidadDisponible} disponibles
                          </span>
                        </div>
                        <div style={{ height: 5, background: '#334155', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colorBarra, borderRadius: 3 }} />
                        </div>
                      </div>

                      {!club.hayEspacio && (
                        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Sin cupo disponible</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Club elegido */}
              {clubSugerido && (
                <div style={{
                  marginTop: 14, padding: 12, borderRadius: 10,
                  background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                  fontSize: 13,
                }}>
                  ✅ Club seleccionado: <strong style={{ color: '#f97316' }}>{clubSugerido.cod_club}</strong>
                  {' · '}{clubSugerido.zona} · {clubSugerido.horario1}
                </div>
              )}
            </div>
          )}

          {/* ── Datos adicionales ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>📋 Asignación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

              <Campo label="Oficial responsable">
                <input className="input-base" placeholder="Nombre del oficial"
                  value={form.oficial} onChange={e => cambiar('oficial', e.target.value)} />
              </Campo>

              <Campo label="Facilitador asignado">
                <input className="input-base" placeholder="Nombre del facilitador"
                  value={form.facilitador} onChange={e => cambiar('facilitador', e.target.value)} />
              </Campo>

            </div>
          </div>

          {/* Botón guardar */}
          <button className="btn-primario" onClick={guardarParticipante}
            disabled={guardando} style={{ opacity: guardando ? 0.6 : 1 }}>
            {guardando ? '⏳ Guardando...' : '💾 Guardar participante'}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FORMULARIO DE OFICIAL
      ══════════════════════════════════════════ */}
      {modo === 'oficial' && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>🏅 Datos del nuevo oficial</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Campo label="Nombre completo *">
              <input className="input-base" placeholder="Nombre del oficial"
                value={formOficial.nombre} onChange={e => setFormOficial(p => ({ ...p, nombre: e.target.value }))} />
            </Campo>
            <Campo label="Zona asignada *">
              <select className="input-base" value={formOficial.zona}
                onChange={e => setFormOficial(p => ({ ...p, zona: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </Campo>
            <Campo label="Teléfono">
              <input className="input-base" placeholder="Número de contacto"
                value={formOficial.telefono} onChange={e => setFormOficial(p => ({ ...p, telefono: e.target.value }))} />
            </Campo>
            <Campo label="Email">
              <input className="input-base" placeholder="correo@ejemplo.com" type="email"
                value={formOficial.email} onChange={e => setFormOficial(p => ({ ...p, email: e.target.value }))} />
            </Campo>
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="btn-primario" onClick={guardarOficial}
              disabled={guardando} style={{ opacity: guardando ? 0.6 : 1 }}>
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
          color: mensaje.tipo === 'ok' ? '#22c55e' : '#ef4444', fontSize: 14,
        }}>
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}

// Campo — wrapper con etiqueta para cada input del formulario
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
