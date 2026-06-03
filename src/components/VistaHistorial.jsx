// ============================================================
// VistaHistorial.jsx — Historial de cambios del sistema
// ============================================================
// Muestra todos los cambios registrados:
//   - Reasignaciones de club
//   - Eliminaciones de participantes
//   - Cambios de horario en clubes
// Permite filtrar por tipo, fecha, oficial y exportar a Excel.

import React, { useState, useEffect, useMemo } from 'react';

// ── Colores por tipo de acción ──
const COLORES_ACCION = {
  'reasignacion':  { bg: 'rgba(59,130,246,0.15)',  borde: '#3b82f6',  texto: '#60a5fa',  label: '🔄 Reasignación' },
  'eliminacion':   { bg: 'rgba(239,68,68,0.12)',   borde: '#ef4444',  texto: '#ef4444',  label: '🗑️ Eliminación'  },
  'horario':       { bg: 'rgba(234,179,8,0.12)',   borde: '#eab308',  texto: '#eab308',  label: '📅 Horario'      },
  'nuevo':         { bg: 'rgba(34,197,94,0.12)',   borde: '#22c55e',  texto: '#22c55e',  label: '➕ Nuevo'         },
};

// ─────────────────────────────────────────────────────────────
// VistaHistorial
// Props:
//   - apiUrl: URL del Apps Script de Google Sheets
// ─────────────────────────────────────────────────────────────
export default function VistaHistorial({ apiUrl }) {
  const [registros,   setRegistros]   = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState(null);

  // Filtros
  const [filtroTipo,     setFiltroTipo]     = useState('');
  const [filtroOficial,  setFiltroOficial]  = useState('');
  const [filtroTexto,    setFiltroTexto]    = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Cargar historial al montar el componente
  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    setCargando(true);
    setError(null);
    try {
      const res  = await fetch(`${apiUrl}?tipo=historial`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setRegistros([]);
      } else {
        // Ordenar del más reciente al más antiguo
        setRegistros(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }
    } catch {
      setError('Error de conexión al cargar el historial.');
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }

  // ── Valores únicos para filtros ──
  const tiposUnicos    = useMemo(() => [...new Set(registros.map(r => r.tipo).filter(Boolean))], [registros]);
  const oficialesUnicos = useMemo(() => [...new Set(registros.map(r => r.oficial).filter(Boolean))].sort(), [registros]);

  // ── Aplicar filtros ──
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      const matchTipo    = !filtroTipo    || r.tipo === filtroTipo;
      const matchOficial = !filtroOficial || r.oficial === filtroOficial;
      const matchDesde   = !filtroFechaDesde || new Date(r.fecha) >= new Date(filtroFechaDesde);
      const matchHasta   = !filtroFechaHasta || new Date(r.fecha) <= new Date(filtroFechaHasta + 'T23:59:59');
      const matchTexto   = !filtroTexto || [r.participante, r.club_anterior, r.club_nuevo,
                            r.oficial, r.detalle, r.codigo].some(campo =>
                              String(campo || '').toLowerCase().includes(filtroTexto.toLowerCase()));
      return matchTipo && matchOficial && matchDesde && matchHasta && matchTexto;
    });
  }, [registros, filtroTipo, filtroOficial, filtroFechaDesde, filtroFechaHasta, filtroTexto]);

  // ── Exportar a Excel (CSV descargable) ──
  function exportarExcel() {
    const encabezados = ['Fecha', 'Tipo', 'Participante', 'Código', 'Club Anterior', 'Club Nuevo', 'Oficial', 'Detalle'];
    const filas = registrosFiltrados.map(r => [
      r.fecha, r.tipo, r.participante, r.codigo,
      r.club_anterior, r.club_nuevo, r.oficial, r.detalle,
    ]);

    // Construir CSV con BOM para que Excel lo abra bien en español
    const bom = '\uFEFF';
    const csv = bom + [encabezados, ...filas]
      .map(fila => fila.map(celda => `"${String(celda || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Crear link de descarga
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `historial_asj_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Limpiar filtros ──
  function limpiarFiltros() {
    setFiltroTipo('');
    setFiltroOficial('');
    setFiltroTexto('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  }

  const hayFiltros = filtroTipo || filtroOficial || filtroTexto || filtroFechaDesde || filtroFechaHasta;

  return (
    <div>
      {/* ── Encabezado ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 18 }}>📋 Historial de Cambios</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Botón refrescar */}
            <button className="btn-secundario" style={{ fontSize: 12, padding: '8px 14px' }}
              onClick={cargarHistorial} disabled={cargando}>
              {cargando ? '⏳' : '🔄'} Actualizar
            </button>
            {/* Botón exportar */}
            <button className="btn-primario" style={{ fontSize: 12, padding: '8px 14px' }}
              onClick={exportarExcel} disabled={registrosFiltrados.length === 0}>
              📥 Exportar Excel ({registrosFiltrados.length})
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>

          {/* Búsqueda de texto */}
          <input className="input-base" placeholder="🔍 Buscar participante, club..."
            value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />

          {/* Filtro por tipo de acción */}
          <select className="input-base" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {tiposUnicos.map(t => (
              <option key={t} value={t}>{COLORES_ACCION[t]?.label || t}</option>
            ))}
          </select>

          {/* Filtro por oficial */}
          <select className="input-base" value={filtroOficial} onChange={e => setFiltroOficial(e.target.value)}>
            <option value="">Todos los oficiales</option>
            {oficialesUnicos.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Filtro fecha desde */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Desde</div>
            <input className="input-base" type="date"
              value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} />
          </div>

          {/* Filtro fecha hasta */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Hasta</div>
            <input className="input-base" type="date"
              value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {hayFiltros && (
          <button className="btn-secundario" style={{ fontSize: 12, padding: '8px 14px', marginTop: 10 }}
            onClick={limpiarFiltros}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Resumen rápido por tipo ── */}
      {registros.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(COLORES_ACCION).map(([tipo, color]) => {
            const count = registros.filter(r => r.tipo === tipo).length;
            if (count === 0) return null;
            return (
              <div key={tipo}
                onClick={() => setFiltroTipo(filtroTipo === tipo ? '' : tipo)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                  background: filtroTipo === tipo ? color.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${filtroTipo === tipo ? color.borde : '#334155'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: color.texto }}>
                  {count}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{color.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Estado de carga ── */}
      {cargando && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
          ⏳ Cargando historial...
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444', fontSize: 13,
        }}>
          ⚠️ {error}
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Asegúrate de que la hoja "Historial" existe en Google Sheets y el Apps Script está actualizado.
          </div>
        </div>
      )}

      {/* ── Tabla de historial ── */}
      {!cargando && !error && (
        <>
          {registrosFiltrados.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14,
              background: 'rgba(255,255,255,0.02)', borderRadius: 12,
              border: '1px solid #334155',
            }}>
              {registros.length === 0
                ? 'Aún no hay registros en el historial. Los cambios aparecerán aquí automáticamente.'
                : 'No hay registros que coincidan con los filtros.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {registrosFiltrados.map((r, idx) => {
                const color = COLORES_ACCION[r.tipo] || COLORES_ACCION['nuevo'];
                const fecha = r.fecha ? new Date(r.fecha).toLocaleString('es-CO', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }) : '—';

                return (
                  <div key={idx} style={{
                    background: '#1e293b', border: `1px solid ${color.borde}22`,
                    borderLeft: `3px solid ${color.borde}`,
                    borderRadius: 10, padding: '12px 16px',
                    display: 'grid',
                    gridTemplateColumns: '140px 110px 1fr 1fr 140px',
                    gap: 12, alignItems: 'center',
                  }}>
                    {/* Fecha */}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{fecha}</div>

                    {/* Tipo de acción */}
                    <div>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: color.bg, border: `1px solid ${color.borde}`,
                        color: color.texto, fontWeight: 600,
                      }}>
                        {color.label}
                      </span>
                    </div>

                    {/* Participante / Club */}
                    <div>
                      {r.participante && (
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.participante}</div>
                      )}
                      {r.codigo && (
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Cód: {r.codigo}</div>
                      )}
                    </div>

                    {/* Detalle del cambio */}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {r.tipo === 'reasignacion' && (
                        <span>
                          <span style={{ color: '#ef4444' }}>{r.club_anterior}</span>
                          {' → '}
                          <span style={{ color: '#22c55e' }}>{r.club_nuevo}</span>
                        </span>
                      )}
                      {r.tipo === 'horario' && (
                        <span>{r.detalle}</span>
                      )}
                      {r.tipo === 'eliminacion' && (
                        <span style={{ color: '#ef4444' }}>{r.detalle || 'Participante eliminado'}</span>
                      )}
                      {r.tipo === 'nuevo' && (
                        <span style={{ color: '#22c55e' }}>Club: {r.club_nuevo}</span>
                      )}
                    </div>

                    {/* Oficial que hizo el cambio */}
                    <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                      👤 {r.oficial || 'Sistema'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
