// ============================================================
// PanelInteligencia.jsx — Motor de reglas inteligentes
// ============================================================
// Analiza los datos en tiempo real y genera:
//   - Alertas de problemas detectados
//   - Recomendaciones de optimización
//   - Propuestas concretas de reorganización
// Todo sin IA externa, 100% basado en reglas y umbrales.

import React, { useMemo, useState } from 'react';
import { getDistanciaZona } from '../utils/clubUtils';

// ── Umbrales del sistema ──
const CAPACIDAD_MAX     = 30;  // Máximo participantes por club
const UMBRAL_SOBRECUPO  = 30;  // A partir de aquí es alerta roja
const UMBRAL_CASI_LLENO = 25;  // A partir de aquí es alerta amarilla
const UMBRAL_ZONA_LEJANA = 2;  // Distancia de zona considerada "lejos"
const UMBRAL_CARGA_OFICIAL = 1.25; // 25% más que el promedio = sobrecarga

// ── Tipos de alertas ──
const TIPOS = {
  sobrecupo:       { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   borde: 'rgba(239,68,68,0.3)',   icono: '🔴', label: 'Sobrecupo'        },
  casi_lleno:      { color: '#eab308', bg: 'rgba(234,179,8,0.1)',   borde: 'rgba(234,179,8,0.3)',   icono: '🟡', label: 'Casi lleno'       },
  zona_lejana:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  borde: 'rgba(249,115,22,0.3)',  icono: '📍', label: 'Zona lejana'      },
  carga_oficial:   { color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  borde: 'rgba(168,85,247,0.3)',  icono: '👤', label: 'Sobrecarga'       },
  club_vacio:      { color: '#64748b', bg: 'rgba(100,116,139,0.1)', borde: 'rgba(100,116,139,0.3)', icono: '⚪', label: 'Club sin datos'   },
  recomendacion:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   borde: 'rgba(34,197,94,0.3)',   icono: '💡', label: 'Recomendación'    },
};

export default function PanelInteligencia({ participantes, clubes }) {
  const [filtroTipo,    setFiltroTipo]    = useState('');
  const [expandido,     setExpandido]     = useState(null);
  const [soloAlertas,   setSoloAlertas]   = useState(false);

  // ── Conteo de participantes por club ──
  const conteoPorClub = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      if (p.cod_club) mapa[p.cod_club] = (mapa[p.cod_club] || 0) + 1;
    });
    return mapa;
  }, [participantes]);

  // ── Participantes por oficial ──
  const partPorOficial = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      const o = p.oficial || 'Sin asignar';
      mapa[o] = (mapa[o] || 0) + 1;
    });
    return mapa;
  }, [participantes]);

  // ── MOTOR DE REGLAS ──
  // Genera todas las alertas y recomendaciones automáticamente
  const alertas = useMemo(() => {
    const resultado = [];

    // ── REGLA 1: Clubes con sobrecupo ──
    clubes.forEach(club => {
      const total = parseInt(conteoPorClub[club.cod_club]) || 0;
      if (total >= UMBRAL_SOBRECUPO) {
        const exceso = total - CAPACIDAD_MAX;

        // Buscar clubes compatibles con cupo disponible para reubicar
        const alternativas = clubes.filter(c =>
          c.cod_club !== club.cod_club &&
          c.etapa === club.etapa &&
          c.jornada === club.jornada &&
          (parseInt(conteoPorClub[c.cod_club]) || 0) < CAPACIDAD_MAX
        ).sort((a, b) =>
          getDistanciaZona(club.zona, a.zona) - getDistanciaZona(club.zona, b.zona)
        ).slice(0, 3);

        resultado.push({
          tipo: 'sobrecupo',
          titulo: `${club.cod_club} tiene sobrecupo`,
          descripcion: `Este club tiene ${total} participantes (${exceso} sobre el límite de ${CAPACIDAD_MAX}).`,
          club: club.cod_club,
          zona: club.zona,
          detalle: {
            participantesActuales: total,
            exceso,
            alternativas: alternativas.map(a => ({
              cod_club: a.cod_club,
              zona: a.zona,
              disponibles: CAPACIDAD_MAX - (parseInt(conteoPorClub[a.cod_club]) || 0),
              distancia: getDistanciaZona(club.zona, a.zona),
            })),
          },
          accion: alternativas.length > 0
            ? `Puedes mover ${exceso} participante(s) a: ${alternativas.map(a => a.cod_club).join(', ')}`
            : 'No hay clubes compatibles con cupo disponible cercanos.',
        });
      }
    });

    // ── REGLA 2: Clubes casi llenos ──
    clubes.forEach(club => {
      const total = parseInt(conteoPorClub[club.cod_club]) || 0;
      if (total >= UMBRAL_CASI_LLENO && total < UMBRAL_SOBRECUPO) {
        resultado.push({
          tipo: 'casi_lleno',
          titulo: `${club.cod_club} está casi lleno`,
          descripcion: `Tiene ${total}/${CAPACIDAD_MAX} participantes. Solo quedan ${CAPACIDAD_MAX - total} cupos.`,
          club: club.cod_club,
          zona: club.zona,
          accion: `Considera no agregar más participantes a este club por ahora.`,
          detalle: { participantesActuales: total, cuposRestantes: CAPACIDAD_MAX - total },
        });
      }
    });

    // ── REGLA 3: Participantes en zona lejana ──
    const participantesFueraDeZona = participantes.filter(p => {
      if (!p.zona || !p.cod_club) return false;
      const club = clubes.find(c => c.cod_club === p.cod_club);
      if (!club) return false;
      return getDistanciaZona(p.zona, club.zona) >= UMBRAL_ZONA_LEJANA;
    });

    if (participantesFueraDeZona.length > 0) {
      // Agrupar por club de origen para hacer recomendaciones grupales
      const porClub = {};
      participantesFueraDeZona.forEach(p => {
        const key = p.cod_club;
        if (!porClub[key]) porClub[key] = [];
        porClub[key].push(p);
      });

      Object.entries(porClub).forEach(([codClub, lista]) => {
        const club = clubes.find(c => c.cod_club === codClub);
        if (!club) return;

        resultado.push({
          tipo: 'zona_lejana',
          titulo: `${lista.length} participante(s) lejos de su zona en ${codClub}`,
          descripcion: `${lista.length} participante(s) están asignados a un club que queda a 2+ zonas de distancia de su hogar.`,
          club: codClub,
          zona: club.zona,
          accion: `Revisar si hay clubes más cercanos disponibles para reubicarlos.`,
          detalle: {
            participantes: lista.slice(0, 5).map(p => ({
              nombre: `${p.nombre} ${p.apellido}`,
              zonaParticipante: p.zona,
              zonaClub: club.zona,
              distancia: getDistanciaZona(p.zona, club.zona),
            })),
            totalAfectados: lista.length,
          },
        });
      });
    }

    // ── REGLA 4: Sobrecarga de oficiales ──
    const totalPart      = participantes.length;
    const totalOficiales = Object.keys(partPorOficial).length;
    const promedio       = totalOficiales > 0 ? totalPart / totalOficiales : 0;

    Object.entries(partPorOficial).forEach(([oficial, total]) => {
      if (oficial === 'Sin asignar') return;
      if (total > promedio * UMBRAL_CARGA_OFICIAL) {
        const exceso = total - Math.round(promedio);
        resultado.push({
          tipo: 'carga_oficial',
          titulo: `${oficial} tiene sobrecarga`,
          descripcion: `Tiene ${total} participantes, un ${Math.round(((total / promedio) - 1) * 100)}% más que el promedio (${Math.round(promedio)}).`,
          accion: `Considera redistribuir ${exceso} participante(s) a otro oficial.`,
          detalle: { totalParticipantes: total, promedio: Math.round(promedio), exceso },
        });
      }
    });

    // ── REGLA 5: Clubes sin participantes registrados ──
    clubes.forEach(club => {
      const total = parseInt(conteoPorClub[club.cod_club]) || 0;
      if (total === 0) {
        resultado.push({
          tipo: 'club_vacio',
          titulo: `${club.cod_club} sin participantes`,
          descripcion: `Este club no tiene participantes registrados en el sistema.`,
          club: club.cod_club,
          zona: club.zona,
          accion: `Verificar si el club está activo o si los participantes deben ser migrados desde el Excel.`,
          detalle: { etapa: club.etapa, jornada: club.jornada, pps: club.pps_abrev },
        });
      }
    });

    // ── REGLA 6: Recomendaciones de balance entre zonas ──
    const partPorZona = {};
    participantes.forEach(p => {
      const z = p.zona || 'Sin zona';
      partPorZona[z] = (partPorZona[z] || 0) + 1;
    });

    const zonas       = Object.entries(partPorZona).filter(([z]) => z !== 'Sin zona');
    const promedioZona = zonas.reduce((s, [, v]) => s + v, 0) / (zonas.length || 1);

    zonas.forEach(([zona, total]) => {
      if (total > promedioZona * 1.3) {
        resultado.push({
          tipo: 'recomendacion',
          titulo: `Zona ${zona} concentra muchos participantes`,
          descripcion: `Tiene ${total} participantes, un ${Math.round(((total / promedioZona) - 1) * 100)}% más que el promedio por zona (${Math.round(promedioZona)}).`,
          zona,
          accion: `Revisar si hay clubes en zonas adyacentes con cupo para balancear la carga.`,
          detalle: { totalZona: total, promedioZona: Math.round(promedioZona) },
        });
      }
    });

    // Ordenar: primero las más críticas (sobrecupo > zona_lejana > casi_lleno > resto)
    const ORDEN_PRIORIDAD = { sobrecupo: 0, zona_lejana: 1, carga_oficial: 2, casi_lleno: 3, recomendacion: 4, club_vacio: 5 };
    return resultado.sort((a, b) => (ORDEN_PRIORIDAD[a.tipo] ?? 9) - (ORDEN_PRIORIDAD[b.tipo] ?? 9));
  }, [participantes, clubes, conteoPorClub, partPorOficial]);

  // ── Filtrar alertas ──
  const alertasFiltradas = useMemo(() => {
    return alertas.filter(a => {
      const matchTipo    = !filtroTipo  || a.tipo === filtroTipo;
      const matchAlertas = !soloAlertas || ['sobrecupo', 'zona_lejana', 'carga_oficial'].includes(a.tipo);
      return matchTipo && matchAlertas;
    });
  }, [alertas, filtroTipo, soloAlertas]);

  // ── Contar por tipo ──
  const conteoTipos = useMemo(() => {
    const mapa = {};
    alertas.forEach(a => { mapa[a.tipo] = (mapa[a.tipo] || 0) + 1; });
    return mapa;
  }, [alertas]);

  return (
    <div>
      {/* ── Encabezado ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 18 }}>🧠 Inteligencia del Sistema</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Análisis automático de {participantes.length} participantes y {clubes.length} clubes
            </p>
          </div>
          <button
            className={soloAlertas ? 'btn-primario' : 'btn-secundario'}
            style={{ fontSize: 13 }}
            onClick={() => setSoloAlertas(!soloAlertas)}
          >
            {soloAlertas ? '🔴 Solo alertas críticas' : 'Ver todo'}
          </button>
        </div>

        {/* Resumen por tipo */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(TIPOS).map(([tipo, cfg]) => {
            const count = conteoTipos[tipo] || 0;
            if (count === 0) return null;
            return (
              <div key={tipo}
                onClick={() => setFiltroTipo(filtroTipo === tipo ? '' : tipo)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                  background: filtroTipo === tipo ? cfg.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${filtroTipo === tipo ? cfg.color : '#334155'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: cfg.color }}>
                  {count}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{cfg.icono} {cfg.label}</div>
              </div>
            );
          })}
          {filtroTipo && (
            <button className="btn-secundario" style={{ fontSize: 12, padding: '8px 14px', alignSelf: 'center' }}
              onClick={() => setFiltroTipo('')}>
              ✕ Quitar filtro
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de alertas ── */}
      {alertasFiltradas.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14,
          background: 'rgba(34,197,94,0.05)', borderRadius: 12,
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          ✅ ¡Todo en orden! No se detectaron alertas con los filtros actuales.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertasFiltradas.map((alerta, idx) => {
            const cfg       = TIPOS[alerta.tipo] || TIPOS.recomendacion;
            const estaAbiert = expandido === idx;

            return (
              <div key={idx} style={{
                background: '#1e293b',
                border: `1px solid ${estaAbiert ? cfg.color : cfg.borde}`,
                borderLeft: `4px solid ${cfg.color}`,
                borderRadius: 12, overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Fila principal */}
                <div
                  onClick={() => setExpandido(estaAbiert ? null : idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', cursor: 'pointer',
                  }}
                >
                  {/* Ícono */}
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{cfg.icono}</div>

                  {/* Contenido */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>
                      {alerta.titulo}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
                      {alerta.descripcion}
                    </div>
                  </div>

                  {/* Badge tipo */}
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                    background: cfg.bg, border: `1px solid ${cfg.color}`,
                    color: cfg.color, fontWeight: 600,
                  }}>
                    {cfg.label}
                  </span>

                  {/* Toggle */}
                  <div style={{ color: '#94a3b8', fontSize: 12, flexShrink: 0 }}>
                    {estaAbiert ? '▲' : '▼'}
                  </div>
                </div>

                {/* Detalle expandido */}
                {estaAbiert && (
                  <div style={{
                    padding: '0 18px 16px', borderTop: `1px solid ${cfg.borde}`,
                    paddingTop: 14,
                  }}>
                    {/* Acción recomendada */}
                    <div style={{
                      padding: 12, borderRadius: 10, marginBottom: 14,
                      background: cfg.bg, border: `1px solid ${cfg.borde}`,
                      fontSize: 13, color: cfg.color,
                    }}>
                      💡 <strong>Acción sugerida:</strong> {alerta.accion}
                    </div>

                    {/* Detalle específico por tipo */}
                    {alerta.tipo === 'sobrecupo' && alerta.detalle?.alternativas?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                          Clubes compatibles con cupo disponible:
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {alerta.detalle.alternativas.map(alt => (
                            <div key={alt.cod_club} style={{
                              padding: '8px 14px', borderRadius: 10,
                              background: 'rgba(34,197,94,0.08)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              fontSize: 13,
                            }}>
                              <strong style={{ color: '#22c55e' }}>{alt.cod_club}</strong>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                {alt.zona} · {alt.disponibles} cupos · {alt.distancia === 0 ? 'Misma zona' : `${alt.distancia} zona(s) de distancia`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alerta.tipo === 'zona_lejana' && alerta.detalle?.participantes && (
                      <div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                          Participantes afectados (mostrando {Math.min(5, alerta.detalle.totalAfectados)} de {alerta.detalle.totalAfectados}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {alerta.detalle.participantes.map((p, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px', borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid #334155', fontSize: 13,
                            }}>
                              <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                                Vive en {p.zonaParticipante} · Club en {p.zonaClub} · {p.distancia} zona(s) de distancia
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alerta.tipo === 'carga_oficial' && alerta.detalle && (
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{
                          padding: '10px 16px', borderRadius: 10,
                          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                          fontSize: 13, textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#a855f7' }}>
                            {alerta.detalle.totalParticipantes}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Participantes asignados</div>
                        </div>
                        <div style={{
                          padding: '10px 16px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid #334155',
                          fontSize: 13, textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#94a3b8' }}>
                            {alerta.detalle.promedio}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Promedio por oficial</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
