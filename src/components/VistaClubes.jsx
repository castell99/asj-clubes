// ============================================================
// VistaClubes.jsx
// ============================================================
// Directorio de todos los clubes con filtros por:
// - Zona, etapa de vida, jornada
// Muestra para cada club: código, lugar, horarios, oficial, ocupación.

import React, { useState, useMemo } from 'react';
import { getEtapaColor } from '../utils/clubUtils';

// ─────────────────────────────────────────────────────────────
// VistaClubes
// Props:
//   - clubes: array con el catálogo de clubes
//   - participantes: array para calcular ocupación real
// ─────────────────────────────────────────────────────────────
export default function VistaClubes({ clubes, participantes }) {
  // Estados de los filtros
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [filtroJornada, setFiltroJornada] = useState('');

  // ── Conteo real de participantes por club ──
  const conteoPorClub = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      if (p.cod_club) mapa[p.cod_club] = (mapa[p.cod_club] || 0) + 1;
    });
    return mapa;
  }, [participantes]);

  // ── Valores únicos para los filtros ──
  const zonas   = useMemo(() => [...new Set(clubes.map(c => c.zona).filter(Boolean))].sort(), [clubes]);
  const etapas  = useMemo(() => [...new Set(clubes.map(c => c.etapa).filter(Boolean))].sort(), [clubes]);
  const jornadas = ['AM', 'PM'];

  // ── Aplicar filtros ──
  const clubesFiltrados = useMemo(() => {
    return clubes.filter(c => {
      const matchZona    = !filtroZona    || c.zona === filtroZona;
      const matchEtapa   = !filtroEtapa   || c.etapa === filtroEtapa;
      const matchJornada = !filtroJornada || c.jornada === filtroJornada;
      return matchZona && matchEtapa && matchJornada;
    });
  }, [clubes, filtroZona, filtroEtapa, filtroJornada]);

  return (
    <div>
      {/* ── Barra de filtros ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🏫 Directorio de Clubes</h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro por zona */}
          <select
            className="input-base"
            style={{ width: 'auto', minWidth: 160 }}
            value={filtroZona}
            onChange={e => setFiltroZona(e.target.value)}
          >
            <option value="">Todas las zonas</option>
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          {/* Filtro por etapa de vida */}
          <select
            className="input-base"
            style={{ width: 'auto', minWidth: 160 }}
            value={filtroEtapa}
            onChange={e => setFiltroEtapa(e.target.value)}
          >
            <option value="">Todas las etapas</option>
            {etapas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Filtro por jornada */}
          <select
            className="input-base"
            style={{ width: 'auto', minWidth: 120 }}
            value={filtroJornada}
            onChange={e => setFiltroJornada(e.target.value)}
          >
            <option value="">AM y PM</option>
            {jornadas.map(j => <option key={j} value={j}>Jornada {j}</option>)}
          </select>

          {/* Contador de resultados */}
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {clubesFiltrados.length} de {clubes.length} clubes
          </span>

          {/* Botón limpiar filtros */}
          {(filtroZona || filtroEtapa || filtroJornada) && (
            <button
              className="btn-secundario"
              style={{ fontSize: 12, padding: '8px 14px' }}
              onClick={() => { setFiltroZona(''); setFiltroEtapa(''); setFiltroJornada(''); }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla de clubes ── */}
      <div className="tabla-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Etapa</th>
              <th>Zona</th>
              <th>Jornada</th>
              <th>Lugar</th>
              <th>Horario 1</th>
              <th>Horario 2</th>
              <th>Oficial</th>
              <th>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {clubesFiltrados.map(club => {
              // Calcular ocupación del club con datos reales
              const ocupados = parseInt(conteoPorClub[club.cod_club]) || 0;
              const porcentaje = Math.min((ocupados / 30) * 100, 100);
              const colorBarra = porcentaje >= 90 ? '#ef4444' : porcentaje >= 70 ? '#eab308' : '#22c55e';

              return (
                <tr key={club.cod_club}>
                  {/* Código del club */}
                  <td>
                    <strong style={{ fontSize: 14 }}>{club.cod_club}</strong>
                  </td>

                  {/* Tipo (Aventureros, Imaginarios, etc.) */}
                  <td style={{ fontSize: 13, color: '#94a3b8' }}>{club.nombre_club}</td>

                  {/* Etapa con badge de color */}
                  <td>
                    <span className={`badge ${getEtapaColor(club.etapa)}`} style={{ fontSize: 11 }}>
                      {club.etapa}
                    </span>
                  </td>

                  {/* Zona */}
                  <td>
                    <span className="badge badge-azul" style={{ fontSize: 11 }}>{club.zona}</span>
                  </td>

                  {/* Jornada */}
                  <td>
                    <span className={`badge ${club.jornada === 'AM' ? 'badge-amarillo' : 'badge-naranja'}`} style={{ fontSize: 11 }}>
                      {club.jornada}
                    </span>
                  </td>

                  {/* Lugar / PPS */}
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{club.pps_abrev}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{club.pps_nombre}</div>
                  </td>

                  {/* Horarios */}
                  <td style={{ fontSize: 12 }}>{club.horario1}</td>
                  <td style={{ fontSize: 12 }}>{club.horario2}</td>

                  {/* Oficial */}
                  <td style={{ fontSize: 12 }}>{club.oficial}</td>

                  {/* Barra de ocupación */}
                  <td style={{ minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                      {ocupados}/30
                    </div>
                    <div style={{ height: 5, background: '#334155', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', width: `${porcentaje}%`,
                        background: colorBarra, borderRadius: 3,
                      }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
