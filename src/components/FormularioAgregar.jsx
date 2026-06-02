// ============================================================
// BuscadorParticipante.jsx
// ============================================================
// Busca participantes por nombre, apellido o código.
// Muestra el perfil completo con opciones de:
//   - Reasignar club (recomendador inteligente)
//   - Eliminar participante (con confirmación)

import React, { useState, useMemo } from 'react';
import { buscarParticipantes, getEtapaColor } from '../utils/clubUtils';
import RecomendadorClub from './RecomendadorClub';

// URL del Apps Script — se pasa como prop desde App.jsx
export default function BuscadorParticipante({ participantes, clubes, apiUrl, onActualizar }) {
  const [termino, setTermino]               = useState('');
  const [seleccionado, setSeleccionado]     = useState(null);
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);

  // Estados para eliminación
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando]         = useState(false);
  const [mensajeEliminar, setMensajeEliminar] = useState(null);

  // Resultados de búsqueda — mínimo 2 caracteres
  const resultados = useMemo(() => {
    if (termino.length < 2) return [];
    return buscarParticipantes(participantes, termino).slice(0, 12);
  }, [termino, participantes]);

  // Seleccionar participante de los resultados
  function seleccionar(p) {
    setSeleccionado(p);
    setTermino('');
    setMostrarRecomendador(false);
    setConfirmandoEliminar(false);
    setMensajeEliminar(null);
  }

  // Cerrar perfil
  function limpiar() {
    setSeleccionado(null);
    setMostrarRecomendador(false);
    setConfirmandoEliminar(false);
    setMensajeEliminar(null);
  }

  // ── Eliminar participante ──
  // Llama al Apps Script con accion: "eliminar" y el código del participante
  async function eliminarParticipante() {
    if (!seleccionado?.codigo) return;
    setEliminando(true);
    setMensajeEliminar(null);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ accion: 'eliminar', codigo: seleccionado.codigo }),
      });
      const respuesta = await res.json();
      if (respuesta.ok) {
        setMensajeEliminar({ tipo: 'ok', texto: `✅ ${seleccionado.nombre} ${seleccionado.apellido} eliminado correctamente.` });
        setConfirmandoEliminar(false);
        // Refrescar lista de participantes
        if (onActualizar) onActualizar();
        // Limpiar selección tras 2 segundos
        setTimeout(() => limpiar(), 2000);
      } else {
        setMensajeEliminar({ tipo: 'error', texto: respuesta.error || 'Error al eliminar.' });
      }
    } catch {
      setMensajeEliminar({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div>
      {/* ── Barra de búsqueda ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🔍 Buscar Participante</h2>
        <div style={{ position: 'relative' }}>
          <input
            className="input-base"
            type="text"
            placeholder="Escribe nombre, apellido o código..."
            value={termino}
            onChange={e => setTermino(e.target.value)}
          />

          {/* Dropdown de resultados */}
          {resultados.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 12, marginTop: 6, zIndex: 100,
              maxHeight: 320, overflowY: 'auto',
            }}>
              {resultados.map(p => (
                <button key={p.codigo} onClick={() => seleccionar(p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: 'none', border: 'none',
                    borderBottom: '1px solid #334155', color: '#e2e8f0',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: '#f97316',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, flexShrink: 0,
                  }}>
                    {p.nombre?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre} {p.apellido}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Cód: {p.codigo} · {p.zona} · {p.etapa}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {termino.length >= 2 && resultados.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 12, marginTop: 6, padding: 16,
              color: '#94a3b8', fontSize: 14,
            }}>
              No se encontraron participantes con "{termino}"
            </div>
          )}
        </div>
      </div>

      {/* ── Perfil del participante seleccionado ── */}
      {seleccionado && (
        <div className="card" style={{ marginBottom: 20 }}>

          {/* Encabezado con botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 54, height: 54, borderRadius: 14, background: '#f97316',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24,
              }}>
                {seleccionado.nombre?.[0] || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: 20, color: '#fff' }}>
                  {seleccionado.nombre} {seleccionado.apellido}
                </h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${getEtapaColor(seleccionado.etapa)}`}>{seleccionado.etapa}</span>
                  <span className="badge badge-azul">Jornada {seleccionado.jornada}</span>
                  <span className={`badge ${seleccionado.estado === 'Registrado' ? 'badge-verde' : 'badge-amarillo'}`}>
                    {seleccionado.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones cerrar y eliminar */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secundario" onClick={limpiar} style={{ padding: '8px 14px', fontSize: 13 }}>
                ✕ Cerrar
              </button>
              <button
                onClick={() => { setConfirmandoEliminar(true); setMensajeEliminar(null); }}
                style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', borderRadius: 10, padding: '8px 14px',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>

          {/* Grid de datos del perfil */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <Campo label="Código"       valor={seleccionado.codigo} />
            <Campo label="Edad actual"  valor={`${seleccionado.edad_actual} años`} />
            <Campo label="Edad 2026"    valor={`${seleccionado.edad_2026} años`} />
            <Campo label="Género"       valor={seleccionado.genero} />
            <Campo label="Zona"         valor={seleccionado.zona} />
            <Campo label="Sector"       valor={seleccionado.sector} />
            <Campo label="Club actual"  valor={seleccionado.cod_club} destaca />
            <Campo label="Horario 1"    valor={seleccionado.horario1} />
            <Campo label="Horario 2"    valor={seleccionado.horario2} />
            <Campo label="Lugar"        valor={seleccionado.pps_nombre} />
            <Campo label="Oficial"      valor={seleccionado.oficial} />
            <Campo label="Facilitador"  valor={seleccionado.facilitador} />
            <Campo label="Contacto"     valor={seleccionado.contacto} />
            <Campo label="Teléfono"     valor={seleccionado.telefono} />
          </div>

          {/* Historial de club */}
          {(seleccionado.club_nuevo || seleccionado.club_anterior) && (
            <div style={{
              marginTop: 16, padding: 14,
              background: 'rgba(249,115,22,0.07)',
              borderRadius: 10, border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>📋 Historial de club</div>
              {seleccionado.club_nuevo    && <div style={{ fontSize: 13 }}><strong>Club nuevo:</strong> {seleccionado.club_nuevo}</div>}
              {seleccionado.club_anterior && <div style={{ fontSize: 13 }}><strong>Club anterior:</strong> {seleccionado.club_anterior}</div>}
            </div>
          )}

          {/* ── Panel de confirmación de eliminación ── */}
          {confirmandoEliminar && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                ⚠️ ¿Confirmar eliminación?
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
                Estás a punto de eliminar a{' '}
                <strong style={{ color: '#e2e8f0' }}>
                  {seleccionado.nombre} {seleccionado.apellido}
                </strong>{' '}
                (Cód: {seleccionado.codigo}) del Google Sheets.{' '}
                <strong style={{ color: '#ef4444' }}>Esta acción no se puede deshacer.</strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={eliminarParticipante}
                  disabled={eliminando}
                  style={{
                    background: '#ef4444', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14,
                    opacity: eliminando ? 0.6 : 1,
                  }}
                >
                  {eliminando ? '⏳ Eliminando...' : '🗑️ Sí, eliminar'}
                </button>
                <button
                  className="btn-secundario"
                  onClick={() => setConfirmandoEliminar(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Mensaje resultado eliminación */}
          {mensajeEliminar && (
            <div style={{
              marginTop: 12, padding: 14, borderRadius: 10, fontSize: 13,
              background: mensajeEliminar.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${mensajeEliminar.tipo === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: mensajeEliminar.tipo === 'ok' ? '#22c55e' : '#ef4444',
            }}>
              {mensajeEliminar.texto}
            </div>
          )}

          {/* Botón reasignar club */}
          <div style={{ marginTop: 20 }}>
            <button className="btn-primario"
              onClick={() => setMostrarRecomendador(!mostrarRecomendador)}>
              {mostrarRecomendador ? '▲ Ocultar recomendaciones' : '🔄 Ver clubes disponibles para reasignar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Recomendador de clubes ── */}
      {seleccionado && mostrarRecomendador && (
        <RecomendadorClub
          participante={seleccionado}
          clubes={clubes}
          todosParticipantes={participantes}
        />
      )}
    </div>
  );
}

// Campo — dato del perfil con etiqueta
function Campo({ label, valor, destaca }) {
  if (!valor) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: destaca ? '#f97316' : '#e2e8f0', fontWeight: destaca ? 600 : 400 }}>
        {valor}
      </div>
    </div>
  );
}
