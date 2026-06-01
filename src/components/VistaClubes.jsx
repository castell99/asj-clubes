// ============================================================
// VistaClubes.jsx
// ============================================================
// Directorio de clubes con filtros y lista de participantes
// desplegable por cada club.

import React, { useState, useMemo } from 'react';
import { getEtapaColor } from '../utils/clubUtils';

export default function VistaClubes({ clubes, participantes }) {
  const [filtroZona,    setFiltroZona]    = useState('');
  const [filtroEtapa,   setFiltroEtapa]   = useState('');
  const [filtroJornada, setFiltroJornada] = useState('');

  // Club expandido para ver su lista de participantes
  const [clubExpandido, setClubExpandido] = useState(null);

  // Conteo real de participantes por club
  const conteoPorClub = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      if (p.cod_club) mapa[p.cod_club] = (mapa[p.cod_club] || 0) + 1;
    });
    return mapa;
  }, [participantes]);

  // Participantes agrupados por club (para la vista expandida)
  const participantesPorClub = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      if (!p.cod_club) return;
      if (!mapa[p.cod_club]) mapa[p.cod_club] = [];
      mapa[p.cod_club].push(p);
    });
    return mapa;
  }, [participantes]);

  // Valores únicos para los filtros
  const zonas    = useMemo(() => [...new Set(clubes.map(c => c.zona).filter(Boolean))].sort(), [clubes]);
  const etapas   = useMemo(() => [...new Set(clubes.map(c => c.etapa).filter(Boolean))].sort(), [clubes]);

  // Aplicar filtros
  const clubesFiltrados = useMemo(() => {
    return clubes.filter(c => {
      const matchZona    = !filtroZona    || c.zona === filtroZona;
      const matchEtapa   = !filtroEtapa   || c.etapa === filtroEtapa;
      const matchJornada = !filtroJornada || c.jornada === filtroJornada;
      return matchZona && matchEtapa && matchJornada;
    });
  }, [clubes, filtroZona, filtroEtapa, filtroJornada]);

  // Toggle expandir/colapsar un club
  function toggleClub(codClub) {
    setClubExpandido(prev => prev === codClub ? null : codClub);
  }

  return (
    <div>
      {/* ── Barra de filtros ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🏫 Directorio de Clubes</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="input-base" style={{ width: 'auto', minWidth: 160 }}
            value={filtroZona} onChange={e => setFiltroZona(e.target.value)}>
            <option value="">Todas las zonas</option>
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          <select className="input-base" style={{ width: 'auto', minWidth: 160 }}
            value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
            <option value="">Todas las etapas</option>
            {etapas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select className="input-base" style={{ width: 'auto', minWidth: 120 }}
            value={filtroJornada} onChange={e => setFiltroJornada(e.target.value)}>
            <option value="">AM y PM</option>
            <option value="AM">Jornada AM</option>
            <option value="PM">Jornada PM</option>
          </select>

          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {clubesFiltrados.length} de {clubes.length} clubes
          </span>

          {(filtroZona || filtroEtapa || filtroJornada) && (
            <button className="btn-secundario" style={{ fontSize: 12, padding: '8px 14px' }}
              onClick={() => { setFiltroZona(''); setFiltroEtapa(''); setFiltroJornada(''); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de clubes con acordeón ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clubesFiltrados.map(club => {
          const ocupados    = parseInt(conteoPorClub[club.cod_club]) || 0;
          const porcentaje  = Math.min((ocupados / 30) * 100, 100);
          const colorBarra  = porcentaje >= 90 ? '#ef4444' : porcentaje >= 70 ? '#eab308' : '#22c55e';
          const expandido   = clubExpandido === club.cod_club;
          const miembros    = participantesPorClub[club.cod_club] || [];

          return (
            <div key={club.cod_club} style={{
              background: '#1e293b',
              border: `1px solid ${expandido ? '#f97316' : '#334155'}`,
              borderRadius: 14,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* ── Fila del club (siempre visible) ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', flexWrap: 'wrap',
              }}>

                {/* Código y nombre */}
                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{club.cod_club}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{club.nombre_club}</div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 200px' }}>
                  <span className={`badge ${getEtapaColor(club.etapa)}`} style={{ fontSize: 11 }}>{club.etapa}</span>
                  <span className="badge badge-azul" style={{ fontSize: 11 }}>{club.zona}</span>
                  <span className={`badge ${club.jornada === 'AM' ? 'badge-amarillo' : 'badge-naranja'}`} style={{ fontSize: 11 }}>
                    {club.jornada}
                  </span>
                </div>

                {/* Horarios */}
                <div style={{ fontSize: 12, color: '#94a3b8', flex: '1 1 150px' }}>
                  {club.horario1}{club.horario2 ? ` / ${club.horario2}` : ''}
                </div>

                {/* Lugar */}
                <div style={{ fontSize: 12, flex: '1 1 150px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{club.pps_abrev}</div>
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>{club.pps_nombre}</div>
                </div>

                {/* Barra de ocupación */}
                <div style={{ flex: '0 0 120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#94a3b8' }}>{ocupados}/30</span>
                    <span style={{ color: colorBarra }}>{30 - ocupados} libres</span>
                  </div>
                  <div style={{ height: 5, background: '#334155', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${porcentaje}%`, background: colorBarra, borderRadius: 3 }} />
                  </div>
                </div>

                {/* Botón ver participantes */}
                <button
                  onClick={() => toggleClub(club.cod_club)}
                  style={{
                    background: expandido ? '#f97316' : '#334155',
                    color: expandido ? '#fff' : '#e2e8f0',
                    border: 'none', borderRadius: 10,
                    padding: '8px 14px', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 600, whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  {expandido ? '▲ Ocultar' : `👥 Ver ${ocupados}`}
                </button>
              </div>

              {/* ── Lista de participantes (expandible) ── */}
              {expandido && (
                <div style={{ borderTop: '1px solid #334155' }}>
                  {miembros.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No hay participantes registrados en este club.
                    </div>
                  ) : (
                    <div>
                      {/* Encabezado de la lista */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 80px 80px 120px',
                        gap: 10, padding: '10px 20px',
                        background: 'rgba(249,115,22,0.06)',
                        fontSize: 11, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        <div>Nombre</div>
                        <div>Código</div>
                        <div>Edad</div>
                        <div>Género</div>
                        <div>Estado</div>
                      </div>

                      {/* Filas de participantes */}
                      {miembros.map((p, idx) => (
                        <div key={p.codigo || idx} style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 80px 80px 120px',
                          gap: 10, padding: '10px 20px',
                          borderTop: '1px solid rgba(51,65,85,0.5)',
                          fontSize: 13,
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}>
                          {/* Nombre con inicial */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 7, background: '#f97316',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, flexShrink: 0,
                            }}>
                              {p.nombre?.[0] || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.zona} · {p.sector}</div>
                            </div>
                          </div>

                          {/* Código */}
                          <div style={{ color: '#94a3b8', alignSelf: 'center' }}>{p.codigo}</div>

                          {/* Edad */}
                          <div style={{ alignSelf: 'center' }}>{p.edad_actual} años</div>

                          {/* Género */}
                          <div style={{ alignSelf: 'center', color: '#94a3b8' }}>{p.genero}</div>

                          {/* Estado */}
                          <div style={{ alignSelf: 'center' }}>
                            <span className={`badge ${p.estado === 'Registrado' ? 'badge-verde' : 'badge-gris'}`}
                              style={{ fontSize: 11 }}>
                              {p.estado}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Pie con total */}
                      <div style={{
                        padding: '10px 20px', fontSize: 12, color: '#94a3b8',
                        borderTop: '1px solid #334155', textAlign: 'right',
                      }}>
                        Total: <strong style={{ color: '#f97316' }}>{miembros.length}</strong> participantes
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
