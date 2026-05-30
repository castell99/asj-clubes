// ============================================================
// PanelEstadisticas.jsx
// ============================================================
// Muestra un resumen visual de la base de datos:
// - Total de participantes, clubes, zonas y oficiales
// - Distribución por etapa de vida
// - Participantes por zona
// - Clubes por oficial responsable

import React, { useMemo } from 'react';
import { getEtapaColor } from '../utils/clubUtils';

// ─────────────────────────────────────────────────────────────
// PanelEstadisticas
// Props:
//   - participantes: array con todos los participantes
//   - clubes: array con todos los clubes
// ─────────────────────────────────────────────────────────────
export default function PanelEstadisticas({ participantes, clubes }) {

  // ── Calcular estadísticas derivadas ──
  // useMemo evita recalcular en cada render
  const stats = useMemo(() => {

    // Conteo por etapa de vida
    const porEtapa = {};
    participantes.forEach(p => {
      const etapa = p.etapa || 'Sin etapa';
      porEtapa[etapa] = (porEtapa[etapa] || 0) + 1;
    });

    // Conteo por zona
    const porZona = {};
    participantes.forEach(p => {
      const zona = p.zona || 'Sin zona';
      porZona[zona] = (porZona[zona] || 0) + 1;
    });

    // Conteo por jornada
    const porJornada = {};
    participantes.forEach(p => {
      const j = p.jornada || 'Sin datos';
      porJornada[j] = (porJornada[j] || 0) + 1;
    });

    // Clubes por oficial responsable
    const porOficial = {};
    clubes.forEach(c => {
      const oficial = c.oficial || 'Sin asignar';
      if (!porOficial[oficial]) porOficial[oficial] = 0;
      porOficial[oficial]++;
    });

    // Participantes por oficial
    const partPorOficial = {};
    participantes.forEach(p => {
      const oficial = p.oficial || 'Sin asignar';
      partPorOficial[oficial] = (partPorOficial[oficial] || 0) + 1;
    });

    return { porEtapa, porZona, porJornada, porOficial, partPorOficial };
  }, [participantes, clubes]);

  return (
    <div>
      {/* ── KPIs principales ── */}
      <div className="stats-grid">
        <StatCard numero={participantes.length} etiqueta="Participantes totales" icono="👥" />
        <StatCard numero={clubes.length} etiqueta="Clubes activos" icono="🏫" />
        <StatCard numero={4} etiqueta="Zonas geográficas" icono="📍" />
        <StatCard numero={5} etiqueta="Oficiales responsables" icono="👤" />
        <StatCard
          numero={participantes.filter(p => p.jornada === 'AM').length}
          etiqueta="Participantes jornada AM"
          icono="🌅"
        />
        <StatCard
          numero={participantes.filter(p => p.jornada === 'PM').length}
          etiqueta="Participantes jornada PM"
          icono="🌇"
        />
      </div>

      {/* ── Segunda fila: etapas + zonas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Distribución por etapa de vida */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>📊 Por etapa de vida</h3>
          {Object.entries(stats.porEtapa)
            .sort((a, b) => b[1] - a[1])
            .map(([etapa, total]) => (
              <BarraHorizontal
                key={etapa}
                label={etapa}
                valor={total}
                total={participantes.length}
                badgeClass={getEtapaColor(etapa)}
              />
            ))}
        </div>

        {/* Distribución por zona */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>🗺️ Por zona</h3>
          {Object.entries(stats.porZona)
            .sort((a, b) => b[1] - a[1])
            .map(([zona, total]) => (
              <BarraHorizontal
                key={zona}
                label={zona}
                valor={total}
                total={participantes.length}
                badgeClass="badge-azul"
              />
            ))}
        </div>
      </div>

      {/* ── Tabla por oficial ── */}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>👤 Carga por oficial responsable</h3>
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
              {Object.entries(stats.partPorOficial)
                .sort((a, b) => b[1] - a[1])
                .map(([oficial, total]) => {
                  const pct = ((total / participantes.length) * 100).toFixed(1);
                  return (
                    <tr key={oficial}>
                      {/* Nombre del oficial */}
                      <td style={{ fontWeight: 600 }}>{oficial}</td>
                      {/* Número de participantes */}
                      <td>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: '#f97316', fontWeight: 800 }}>
                          {total}
                        </span>
                      </td>
                      {/* Número de clubes asignados */}
                      <td>
                        <span className="badge badge-azul">
                          {stats.porOficial[oficial] || 0} clubs
                        </span>
                      </td>
                      {/* Barra de porcentaje */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: '#334155', borderRadius: 3 }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: '#f97316', borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {pct}%
                          </span>
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

// ─────────────────────────────────────────────────────────────
// StatCard — tarjeta de KPI con número grande
// Props: numero, etiqueta, icono
// ─────────────────────────────────────────────────────────────
function StatCard({ numero, etiqueta, icono }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 22 }}>{icono}</div>
      <div className="numero">{numero.toLocaleString()}</div>
      <div className="etiqueta">{etiqueta}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BarraHorizontal — fila con barra de progreso
// Props: label, valor, total, badgeClass
// ─────────────────────────────────────────────────────────────
function BarraHorizontal({ label, valor, total, badgeClass }) {
  const pct = ((valor / total) * 100).toFixed(1);
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Encabezado de la barra */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <span className={`badge ${badgeClass}`} style={{ fontSize: 11 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          <strong style={{ color: '#e2e8f0' }}>{valor}</strong> · {pct}%
        </span>
      </div>
      {/* Barra de progreso */}
      <div style={{ height: 7, background: '#334155', borderRadius: 4 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #f97316, #fb923c)',
          borderRadius: 4, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}
