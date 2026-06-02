// ============================================================
// FormularioAgregar.jsx — con sugerencias inteligentes
// ============================================================
// Formulario completo que mapea exactamente las columnas del Google Sheets.
// Incluye todos los campos del Excel original.

import React, { useState, useMemo } from 'react';
import { filtrarClubesCompatibles, getEtapaColor } from '../utils/clubUtils';

// ── Mapa de edad → etapa de vida ──
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

export default function FormularioAgregar({ apiUrl, clubes, todosParticipantes = [], onGuardado }) {
  const [modo, setModo] = useState('participante');

  // ── Estado completo del formulario ──
  // Cada campo corresponde exactamente a una columna del Google Sheets
  const [form, setForm] = useState({
    zona: '',
    sector: '',
    codigo: '',
    nombre: '',
    apellido: '',
    edad_actual: '',
    edad_2026: '',
    etapa: '',
    nombre_club: '',
    num_club: '',
    cod_club: '',
    club_nuevo: '',
    club_anterior: '',
    genero: '',
    estado: 'Registrado',
    anio_escolar: '',
    asistiendo_escuela: '',
    educacion_especial: '',
    pps_nombre: '',
    pps_abrev: '',
    tipo_pps: '',
    dia1: '',
    hora1: '',
    horario1: '',
    horario2: '',
    dia2: '',
    hora2: '',
    jornada: '',
    oficial: '',
    facilitador: '',
    contacto: '',
    nivel_educacion: '',
    telefono: '',
    escuela: '',
  });

  const [formOficial, setFormOficial] = useState({
    nombre: '', zona: '', telefono: '', email: '',
  });

  const [etapaSugerida, setEtapaSugerida] = useState('');
  const [clubSugerido, setClubSugerido]   = useState(null);
  const [guardando, setGuardando]         = useState(false);
  const [mensaje, setMensaje]             = useState(null);

  const ZONAS = ['COL-J01', 'COL-J02', 'COL-J03', 'COL-J04'];

  // ── Actualizar campo ──
  function cambiar(campo, valor) {
    setForm(prev => {
      const nuevo = { ...prev, [campo]: valor };

      // Cuando cambia la edad: sugerir y autocompletar etapa
      if (campo === 'edad_actual') {
        const sugerencia = edadAEtapa(valor);
        setEtapaSugerida(sugerencia);
        if (sugerencia) nuevo.etapa = sugerencia;
      }

      // Cuando cambia zona/etapa/jornada: limpiar club elegido
      if (['zona', 'etapa', 'jornada'].includes(campo)) {
        nuevo.cod_club = '';
        setClubSugerido(null);
      }

      return nuevo;
    });
  }

  // ── Clubes compatibles en tiempo real ──
  const clubesCompatibles = useMemo(() => {
    if (!form.etapa || !form.jornada || !form.zona) return [];
    return filtrarClubesCompatibles({
      participante: { etapa: form.etapa, jornada: form.jornada, zona: form.zona, cod_club: '' },
      clubes,
      todosParticipantes,
    }).slice(0, 6);
  }, [form.etapa, form.jornada, form.zona, clubes, todosParticipantes]);

  // Seleccionar club desde sugerencias
  function elegirClub(club) {
    setClubSugerido(club);
    setForm(prev => ({
      ...prev,
      cod_club: club.cod_club,
      nombre_club: club.nombre_club,
      pps_nombre: club.pps_nombre,
      pps_abrev: club.pps_abrev,
      horario1: club.horario1,
      horario2: club.horario2,
    }));
  }

  // ── Guardar participante ──
  // Mapeo exacto con los nombres de columna del Google Sheets (incluyendo espacios)
  async function guardarParticipante() {
    if (!form.nombre || !form.apellido || !form.etapa) {
      setMensaje({ tipo: 'error', texto: 'Nombre, apellido y etapa son obligatorios.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      // ⚠️ Los nombres de columna deben coincidir EXACTAMENTE con el Google Sheets
      const datosSheets = {
        "Zona":                                   form.zona,
        "Sector":                                 form.sector,
        "Código":                                 form.codigo,
        " Nombre Completo":                       form.nombre,   // Tiene espacio al inicio
        "Apellido del Participante":              form.apellido,
        "Edad Actual":                            form.edad_actual,
        "Edad 2026":                              form.edad_2026,
        "Etapa de vida":                          form.etapa,
        "Nombre de  club":                        form.nombre_club, // Dos espacios
        "# de club":                              form.num_club,
        "Cod. Club":                              form.cod_club,
        "Nombre de Club PTA\nNuevo":              form.club_nuevo,
        "Nombre de Club PTA\nAnterior":           form.club_anterior,
        "Género":                                 form.genero,
        "Estado del Participante":                form.estado,
        "Año Escolar Actual ":                    form.anio_escolar,
        "Asistiendo a la Escuela ":               form.asistiendo_escuela,
        "Clases de Educación Especial ":          form.educacion_especial,
        "PPS Asignado":                           form.pps_nombre,
        "Abreviatura PPS":                        form.pps_abrev,
        "Tipo de PPS":                            form.tipo_pps,
        "día 1":                                  form.dia1,
        "hora 1":                                 form.hora1,
        "Horario 1":                              form.horario1,
        "Horario 2":                              form.horario2,
        "día 2":                                  form.dia2,
        "hora 2":                                 form.hora2,
        "Jornada Asignada":                       form.jornada,
        "Oficial Responsable":                    form.oficial,
        "Facilitador Asignado":                   form.facilitador,
        "Contacto Principal del Participante":    form.contacto,
        "Nivel más Alto de Educación2":           form.nivel_educacion,
        "Telefono":                               form.telefono,
        "Escuela (Educación) (Educación)":        form.escuela,
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'participante', datos: datosSheets }),
      });
      const respuesta = await res.json();

      if (respuesta.ok) {
        setMensaje({ tipo: 'ok', texto: '✅ Participante agregado correctamente al Google Sheets.' });
        // Limpiar formulario
        setForm({
          zona: '', sector: '', codigo: '', nombre: '', apellido: '',
          edad_actual: '', edad_2026: '', etapa: '', nombre_club: '',
          num_club: '', cod_club: '', club_nuevo: '', club_anterior: '',
          genero: '', estado: 'Registrado', anio_escolar: '',
          asistiendo_escuela: '', educacion_especial: '', pps_nombre: '',
          pps_abrev: '', tipo_pps: '', dia1: '', hora1: '', horario1: '',
          horario2: '', dia2: '', hora2: '', jornada: '', oficial: '',
          facilitador: '', contacto: '', nivel_educacion: '', telefono: '', escuela: '',
        });
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
        setMensaje({ tipo: 'ok', texto: '✅ Oficial agregado correctamente.' });
        setFormOficial({ nombre: '', zona: '', telefono: '', email: '' });
        if (onGuardado) onGuardado();
      } else {
        setMensaje({ tipo: 'error', texto: respuesta.error || 'Error al guardar.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión.' });
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

      {/* ════════════════════════════════
          FORMULARIO DE PARTICIPANTE
      ════════════════════════════════ */}
      {modo === 'participante' && (
        <div>

          {/* ── Sección 1: Datos personales ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>👤 Datos personales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              <Campo label="Nombre completo *">
                <input className="input-base" placeholder="Nombres"
                  value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} />
              </Campo>

              <Campo label="Apellido *">
                <input className="input-base" placeholder="Apellidos"
                  value={form.apellido} onChange={e => cambiar('apellido', e.target.value)} />
              </Campo>

              <Campo label="Código">
                <input className="input-base" placeholder="Ej: COL-J010001"
                  value={form.codigo} onChange={e => cambiar('codigo', e.target.value)} />
              </Campo>

              <Campo label="Género">
                <select className="input-base" value={form.genero}
                  onChange={e => cambiar('genero', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </Campo>

              {/* Edad con sugerencia automática de etapa */}
              <Campo label="Edad actual">
                <input className="input-base" placeholder="Ej: 8" type="number"
                  value={form.edad_actual} onChange={e => cambiar('edad_actual', e.target.value)} />
                {etapaSugerida && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Sugerida:</span>
                    <span className={`badge ${getEtapaColor(etapaSugerida)}`} style={{ fontSize: 11 }}>
                      ✨ {etapaSugerida}
                    </span>
                  </div>
                )}
              </Campo>

              <Campo label="Edad 2026">
                <input className="input-base" placeholder="Ej: 9" type="number"
                  value={form.edad_2026} onChange={e => cambiar('edad_2026', e.target.value)} />
              </Campo>

              {/* Etapa — se autocompleta con la edad */}
              <Campo label="Etapa de vida *">
                <select className="input-base" value={form.etapa}
                  onChange={e => cambiar('etapa', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {['2-3 Años','4-5 Años','6-9 Años','10-14 Años','15-18 Años'].map(e =>
                    <option key={e} value={e}>{e}</option>)}
                </select>
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

          {/* ── Sección 2: Ubicación ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>📍 Ubicación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

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

            </div>
          </div>

          {/* ── Sección 3: Educación ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>🎓 Educación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              <Campo label="Año escolar actual">
                <input className="input-base" placeholder="Ej: 3°"
                  value={form.anio_escolar} onChange={e => cambiar('anio_escolar', e.target.value)} />
              </Campo>

              <Campo label="Asistiendo a la escuela">
                <select className="input-base" value={form.asistiendo_escuela}
                  onChange={e => cambiar('asistiendo_escuela', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </Campo>

              <Campo label="Clases de Ed. Especial">
                <select className="input-base" value={form.educacion_especial}
                  onChange={e => cambiar('educacion_especial', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </Campo>

              <Campo label="Nivel más alto de educación">
                <input className="input-base" placeholder="Ej: Primaria"
                  value={form.nivel_educacion} onChange={e => cambiar('nivel_educacion', e.target.value)} />
              </Campo>

              <Campo label="Escuela">
                <input className="input-base" placeholder="Nombre de la institución"
                  value={form.escuela} onChange={e => cambiar('escuela', e.target.value)} />
              </Campo>

            </div>
          </div>

          {/* ── Sección 4: Horario ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>🕐 Horario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              <Campo label="Jornada">
                <select className="input-base" value={form.jornada}
                  onChange={e => cambiar('jornada', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </Campo>

              <Campo label="Día 1">
                <input className="input-base" placeholder="Ej: Lunes"
                  value={form.dia1} onChange={e => cambiar('dia1', e.target.value)} />
              </Campo>

              <Campo label="Hora 1">
                <input className="input-base" placeholder="Ej: 2:00 PM"
                  value={form.hora1} onChange={e => cambiar('hora1', e.target.value)} />
              </Campo>

              <Campo label="Horario 1">
                <input className="input-base" placeholder="Ej: Lunes 2:00 PM"
                  value={form.horario1} onChange={e => cambiar('horario1', e.target.value)} />
              </Campo>

              <Campo label="Día 2">
                <input className="input-base" placeholder="Ej: Miércoles"
                  value={form.dia2} onChange={e => cambiar('dia2', e.target.value)} />
              </Campo>

              <Campo label="Hora 2">
                <input className="input-base" placeholder="Ej: 2:00 PM"
                  value={form.hora2} onChange={e => cambiar('hora2', e.target.value)} />
              </Campo>

              <Campo label="Horario 2">
                <input className="input-base" placeholder="Ej: Miércoles 2:00 PM"
                  value={form.horario2} onChange={e => cambiar('horario2', e.target.value)} />
              </Campo>

            </div>
          </div>

          {/* ── Sección 5: Club recomendado ── */}
          {clubesCompatibles.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, marginBottom: 6, color: '#f97316' }}>🎯 Clubes recomendados</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                Basado en <strong style={{ color: '#e2e8f0' }}>{form.etapa}</strong> · Jornada{' '}
                <strong style={{ color: '#e2e8f0' }}>{form.jornada}</strong> · Zona{' '}
                <strong style={{ color: '#f97316' }}>{form.zona}</strong>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {clubesCompatibles.map(club => {
                  const seleccionado = clubSugerido?.cod_club === club.cod_club;
                  const icono = club.distanciaZona === 0 ? '🟢' : club.distanciaZona === 1 ? '🟡' : '🔴';
                  const pct   = Math.min((club.participantesActuales / 30) * 100, 100);
                  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';

                  return (
                    <div key={club.cod_club}
                      onClick={() => club.hayEspacio && elegirClub(club)}
                      style={{
                        padding: 14, borderRadius: 12,
                        cursor: club.hayEspacio ? 'pointer' : 'not-allowed',
                        border: `2px solid ${seleccionado ? '#f97316' : '#334155'}`,
                        background: seleccionado ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)',
                        opacity: club.hayEspacio ? 1 : 0.5,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{club.cod_club}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{club.nombre_club}</div>
                        </div>
                        {seleccionado && (
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', background: '#f97316',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                          }}>✓</div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                        {icono} {club.zona} · {club.horario1}{club.horario2 ? ` / ${club.horario2}` : ''}
                      </div>
                      <div style={{ height: 5, background: '#334155', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 11, color: color, marginTop: 4 }}>
                        {club.participantesActuales}/30 · {club.capacidadDisponible} disponibles
                      </div>
                      {!club.hayEspacio && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Sin cupo</div>}
                    </div>
                  );
                })}
              </div>
              {clubSugerido && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 10, fontSize: 13,
                  background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                }}>
                  ✅ Club seleccionado: <strong style={{ color: '#f97316' }}>{clubSugerido.cod_club}</strong>
                  {' · '}{clubSugerido.zona} · {clubSugerido.horario1}
                </div>
              )}
            </div>
          )}

          {/* ── Sección 6: Asignación ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>📋 Asignación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              <Campo label="Cod. Club">
                <input className="input-base" placeholder="Se autocompleta al elegir club"
                  value={form.cod_club} onChange={e => cambiar('cod_club', e.target.value)} />
              </Campo>

              <Campo label="Nombre de club">
                <input className="input-base" placeholder="Se autocompleta al elegir club"
                  value={form.nombre_club} onChange={e => cambiar('nombre_club', e.target.value)} />
              </Campo>

              <Campo label="# de club">
                <input className="input-base" placeholder="Número del club"
                  value={form.num_club} onChange={e => cambiar('num_club', e.target.value)} />
              </Campo>

              <Campo label="PPS Asignado">
                <input className="input-base" placeholder="Nombre del lugar"
                  value={form.pps_nombre} onChange={e => cambiar('pps_nombre', e.target.value)} />
              </Campo>

              <Campo label="Abreviatura PPS">
                <input className="input-base" placeholder="Ej: IED"
                  value={form.pps_abrev} onChange={e => cambiar('pps_abrev', e.target.value)} />
              </Campo>

              <Campo label="Tipo de PPS">
                <input className="input-base" placeholder="Ej: Colegio"
                  value={form.tipo_pps} onChange={e => cambiar('tipo_pps', e.target.value)} />
              </Campo>

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

          {/* ── Sección 7: Contacto ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, color: '#f97316' }}>📞 Contacto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              <Campo label="Contacto principal">
                <input className="input-base" placeholder="Nombre del acudiente"
                  value={form.contacto} onChange={e => cambiar('contacto', e.target.value)} />
              </Campo>

              <Campo label="Teléfono">
                <input className="input-base" placeholder="Número de contacto"
                  value={form.telefono} onChange={e => cambiar('telefono', e.target.value)} />
              </Campo>

            </div>
          </div>

          {/* Botón guardar */}
          <button className="btn-primario" onClick={guardarParticipante}
            disabled={guardando} style={{ opacity: guardando ? 0.6 : 1, fontSize: 15, padding: '12px 28px' }}>
            {guardando ? '⏳ Guardando...' : '💾 Guardar participante en Google Sheets'}
          </button>
        </div>
      )}

      {/* ════════════════════════════════
          FORMULARIO DE OFICIAL
      ════════════════════════════════ */}
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

// Campo — wrapper con etiqueta
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
