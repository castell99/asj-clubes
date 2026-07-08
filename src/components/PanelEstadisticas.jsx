// ============================================================
// PanelEstadisticas.jsx — con desglose interactivo
// ============================================================
// Al hacer clic en cualquier barra (etapa, zona, jornada, oficial)
// se despliega un panel con el detalle de los participantes
// que conforman esa categoría.

import React, { useMemo, useState } from 'react';
import { getEtapaColor } from '../utils/clubUtils';

export default function PanelEstadisticas({ participantes, clubes }) {

  // Estado del desglose activo
  // { tipo: 'etapa'|'zona'|'jornada'|'oficial', valor: string }
  const [desglose, setDesglose] = useState(null);

  // ── Calcular estadísticas ──
  const stats = useMemo(() => {
    const porEtapa    = {};
    const porZona     = {};
    const porJornada  = {};
    const porOficial  = {};
    const porOficialClubes = {};

    participantes.forEach(p => {
      const etapa   = p.etapa   || 'Etapa de vida';
      const zona    = p.zona    || 'Sin zona';
      const jornada = p.jornada || 'Sin datos';
      const oficial = p.oficial || 'Sin asignar';

      porEtapa[etapa]     = (porEtapa[etapa]     || 0) + 1;
      porZona[zona]       = (porZona[zona]        || 0) + 1;
      porJornada[jornada] = (porJornada[jornada]  || 0) + 1;
      porOficial[oficial] = (porOficial[oficial]  || 0) + 1;
    });

    clubes.forEach(c => {
      const oficial = c.oficial || 'Sin asignar';
      porOficialClubes[oficial] = (porOficialClubes[oficial] || 0) + 1;
    });

    return { porEtapa, porZona, porJornada, porOficial, porOficialClubes };
  }, [participantes, clubes]);

  // ── Participantes del desglose activo ──
  const participantesDesglose = useMemo(() => {
    if (!desglose) return [];
    return participantes.filter(p => {
      if (desglose.tipo === 'etapa')   return (p.etapa   || 'Etapa de vida') === desglose.valor;
      if (desglose.tipo === 'zona')    return (p.zona    || 'Sin zona')      === desglose.valor;
      if (desglose.tipo === 'jornada') return (p.jornada || 'Sin datos')     === desglose.valor;
      if (desglose.tipo === 'oficial') return (p.oficial || 'Sin asignar')   === desglose.valor;
      return false;
    });
  }, [desglose, participantes]);

  // ── Toggle desglose ──
  function toggleDesglose(tipo, valor) {
    if (desglose?.tipo === tipo && desglose?.valor === valor) {
      setDesglose(null); // Cerrar si ya estaba abierto
    } else {
      setDesglose({ tipo, valor });
    }
  }

  return (
    <div>
      {/* ── KPIs principales ── */}
      <div className="stats-grid">
        <StatCard numero={participantes.length} etiqueta="Participantes totales" icono="👥" />
        <StatCard numero={clubes.length}        etiqueta="Clubes activos"        icono="🏫" />
        <StatCard numero={4}                    etiqueta="Zonas geográficas"     icono="📍" />
        <StatCard numero={5}                    etiqueta="Oficiales responsables" icono="👤" />
        <StatCard numero={participantes.filter(p => p.jornada === 'AM').length} etiqueta="Jornada AM" icono="🌅" />
        <StatCard numero={participantes.filter(p => p.jornada === 'PM').length} etiqueta="Jornada PM" icono="🌇" />
      </div>

      {/* ── Panel de desglose activo ── */}
      {desglose && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16 }}>
                Desglose: <span style={{ color: '#f97316' }}>{desglose.valor}</span>
              </h3>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {participantesDesglose.length} participantes
              </div>
            </div>
            <button className="btn-secundario" style={{ fontSize: 12, padding: '7px 14px' }}
              onClick={() => setDesglose(null)}>
              ✕ Cerrar
            </button>
          </div>

          {/* Tabla de participantes del desglose */}
          <div className="tabla-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Etapa</th>
                  <th>Zona</th>
                  <th>Club</th>
                  <th>Jornada</th>
                  <th>Oficial</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {participantesDesglose.map((p, idx) => (
                  <tr key={p.codigo || idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, background: '#f97316',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, flexShrink: 0,
                        }}>
                          {p.nombre?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.apellido}, {p.nombre}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{p.codigo}</td>
                    <td>
                      <span className={`badge ${getEtapaColor(p.etapa)}`} style={{ fontSize: 11 }}>
                        {p.etapa}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{p.zona}</td>
                    <td style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>{p.cod_club}</td>
                    <td>
                      <span className={`badge ${p.jornada === 'AM' ? 'badge-amarillo' : 'badge-naranja'}`} style={{ fontSize: 11 }}>
                        {p.jornada}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{p.oficial}</td>
                    <td>
                      <span className={`badge ${p.estado === 'Registrado' ? 'badge-verde' : 'badge-gris'}`} style={{ fontSize: 11 }}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Gráficas por etapa y zona ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Por etapa de vida */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>📊 Por etapa de vida</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Clic para ver participantes</p>
          {Object.entries(stats.porEtapa)
            .sort((a, b) => b[1] - a[1])
            .map(([etapa, total]) => (
              <BarraClickeable
                key={etapa}
                label={etapa}
                valor={total}
                total={participantes.length}
                badgeClass={getEtapaColor(etapa)}
                activo={desglose?.tipo === 'etapa' && desglose?.valor === etapa}
                onClick={() => toggleDesglose('etapa', etapa)}
              />
            ))}
        </div>

        {/* Por zona */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>🗺️ Por zona</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Clic para ver participantes</p>
          {Object.entries(stats.porZona)
            .sort((a, b) => b[1] - a[1])
            .map(([zona, total]) => (
              <BarraClickeable
                key={zona}
                label={zona}
                valor={total}
                total={participantes.length}
                badgeClass="badge-azul"
                activo={desglose?.tipo === 'zona' && desglose?.valor === zona}
                onClick={() => toggleDesglose('zona', zona)}
              />
            ))}
        </div>
      </div>

      {/* ── Por jornada ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>🕐 Por jornada</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Clic para ver participantes</p>
          {Object.entries(stats.porJornada)
            .sort((a, b) => b[1] - a[1])
            .map(([jornada, total]) => (
              <BarraClickeable
                key={jornada}
                label={jornada}
                valor={total}
                total={participantes.length}
                badgeClass={jornada === 'AM' ? 'badge-amarillo' : 'badge-naranja'}
                activo={desglose?.tipo === 'jornada' && desglose?.valor === jornada}
                onClick={() => toggleDesglose('jornada', jornada)}
              />
            ))}
        </div>

        {/* Placeholder para balance visual */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>📋 Resumen rápido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Dato label="Promedio por club"     valor={`${Math.round(participantes.length / (clubes.length || 1))} participantes`} />
            <Dato label="Club más grande"       valor={(() => {
              const conteo = {};
              participantes.forEach(p => { if (p.cod_club) conteo[p.cod_club] = (conteo[p.cod_club]||0)+1; });
              const max = Object.entries(conteo).sort((a,b)=>b[1]-a[1])[0];
              return max ? `${max[0]} (${max[1]})` : '—';
            })()} />
            <Dato label="Clubs con sobrecupo"   valor={`${clubes.filter(c => {
              const conteo = {};
              participantes.forEach(p => { if(p.cod_club) conteo[p.cod_club]=(conteo[p.cod_club]||0)+1; });
              return (conteo[c.cod_club]||0) >= 30;
            }).length} clubs`} />
            <Dato label="Sin club asignado"     valor={`${participantes.filter(p => !p.cod_club).length} participantes`} />
          </div>
        </div>
      </div>

      {/* ── Tabla por oficial ── */}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>👤 Carga por oficial responsable</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Clic en una fila para ver sus participantes</p>
        <div className="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th>Oficial</th>
                <th>Participantes</th>
                <th>Clubes</th>
                <th>% del total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.porOficial)
                .sort((a, b) => b[1] - a[1])
                .map(([oficial, total]) => {
                  const pct     = ((total / participantes.length) * 100).toFixed(1);
                  const activo  = desglose?.tipo === 'oficial' && desglose?.valor === oficial;
                  return (
                    <tr key={oficial}
                      onClick={() => toggleDesglose('oficial', oficial)}
                      style={{
                        cursor: 'pointer',
                        background: activo ? 'rgba(249,115,22,0.08)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!activo) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {activo && <span style={{ color: '#f97316', marginRight: 6 }}>▶</span>}
                        {oficial}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: '#f97316', fontWeight: 800 }}>
                          {total}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-azul">
                          {stats.porOficialClubes[oficial] || 0} clubs
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: '#334155', borderRadius: 3 }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: '#f97316', borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ──
function StatCard({ numero, etiqueta, icono }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 22 }}>{icono}</div>
      <div className="numero">{numero.toLocaleString()}</div>
      <div className="etiqueta">{etiqueta}</div>
    </div>
  );
}

// ── BarraClickeable — barra interactiva con desglose ──
function BarraClickeable({ label, valor, total, badgeClass, activo, onClick }) {
  const pct = ((valor / total) * 100).toFixed(1);
  return (
    <div
      onClick={onClick}
      style={{
        marginBottom: 14, cursor: 'pointer', borderRadius: 10,
        padding: '8px 10px', transition: 'background 0.15s',
        background: activo ? 'rgba(249,115,22,0.08)' : 'transparent',
        border: activo ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!activo) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!activo) e.currentTarget.style.background = activo ? 'rgba(249,115,22,0.08)' : 'transparent'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activo && <span style={{ color: '#f97316', fontSize: 12 }}>▶</span>}
          <span className={`badge ${badgeClass}`} style={{ fontSize: 11 }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          <strong style={{ color: '#e2e8f0' }}>{valor}</strong> · {pct}%
        </span>
      </div>
      <div style={{ height: 7, background: '#334155', borderRadius: 4 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: activo
            ? 'linear-gradient(90deg, #f97316, #fb923c)'
            : 'linear-gradient(90deg, #475569, #64748b)',
          borderRadius: 4, transition: 'all 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// ── Dato — fila de dato en el resumen rápido ──
function Dato({ label, valor }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid #334155',
    }}>
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#f97316' }}>{valor}</span>
    </div>
  );
}
