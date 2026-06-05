// ============================================================
// VistaHorario.jsx — Vista de horario interactiva
// ============================================================
// Muestra los clubes organizados en una grilla de días x horas.
// Permite filtrar por PPS, zona y oficial.
// Los bloques se pueden arrastrar para reorganizar.
// Los cambios se confirman antes de guardarse en Google Sheets.

import React, { useState, useMemo, useRef } from 'react';
import { getEtapaColor, NOMBRE_PPS } from '../utils/clubUtils';

// ── Colores por etapa de vida ──
const COLORES_ETAPA = {
  '2-3 Años':   { bg: 'rgba(34,197,94,0.15)',  borde: '#22c55e',  texto: '#22c55e'  },
  '4-5 Años':   { bg: 'rgba(59,130,246,0.15)', borde: '#3b82f6',  texto: '#60a5fa'  },
  '6-9 Años':   { bg: 'rgba(249,115,22,0.15)', borde: '#f97316',  texto: '#f97316'  },
  '10-14 Años': { bg: 'rgba(234,179,8,0.15)',  borde: '#eab308',  texto: '#eab308'  },
  '15-18 Años': { bg: 'rgba(168,85,247,0.15)', borde: '#a855f7',  texto: '#c084fc'  },
};

// ── Orden de los días ──
const DIAS_ORDEN = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

// ─────────────────────────────────────────────────────────────
// Normalizar horario — limpia espacios y formatos inconsistentes
// Ej: "8:30 - 9:30" → "8:30-9:30"
// ─────────────────────────────────────────────────────────────
function normalizarHorario(h) {
  return (h || '').trim().replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────────────────────
// parsearHorario — separa "Lunes 8:30-9:30" en { dia, hora }
// ─────────────────────────────────────────────────────────────
function parsearHorario(horario) {
  const h = normalizarHorario(horario);
  const partes = h.split(' ');
  if (partes.length < 2) return null;
  const dia = partes[0];
  const hora = partes.slice(1).join(' ').trim();
  if (!DIAS_ORDEN.includes(dia)) return null;
  return { dia, hora };
}

// ─────────────────────────────────────────────────────────────
// VistaHorario
// Props:
//   - clubes: catálogo de clubes
//   - participantes: para contar ocupación
//   - apiUrl: para guardar cambios en Google Sheets
// ─────────────────────────────────────────────────────────────
export default function VistaHorario({ clubes, participantes, apiUrl }) {
  // Filtros activos — ahora son arrays para selección múltiple
  const [filtroPPS,         setFiltroPPS]         = useState([]);
  const [filtroZona,        setFiltroZona]        = useState([]);
  const [filtroOficial,     setFiltroOficial]     = useState([]);
  const [filtroFacilitador, setFiltroFacilitador] = useState([]);

  // Bloques con cambios pendientes (antes de confirmar)
  // { cod_club: { horario1: nuevo, horario2: nuevo } }
  const [cambiosPendientes, setCambiosPendientes] = useState({});

  // Club arrastrado actualmente
  const [dragging, setDragging] = useState(null); // { cod_club, horarioOrigen, slot: 'horario1'|'horario2' }

  // Modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(null);

  // Club seleccionado para ver detalle
  const [clubDetalle, setClubDetalle] = useState(null);

  // Conteo de participantes por club
  const conteoPorClub = useMemo(() => {
    const mapa = {};
    participantes.forEach(p => {
      if (p.cod_club) mapa[p.cod_club] = (mapa[p.cod_club] || 0) + 1;
    });
    return mapa;
  }, [participantes]);

  // Valores únicos para filtros
  const ppsList   = useMemo(() => [...new Set(clubes.map(c => c.pps_abrev).filter(Boolean))].sort(), [clubes]);
  const zonas     = useMemo(() => [...new Set(clubes.map(c => c.zona).filter(Boolean))].sort(), [clubes]);
  const oficiales      = useMemo(() => [...new Set(participantes.map(p => p.oficial).filter(Boolean))].sort(), [participantes]);
  // Separar facilitadores que vienen con "/" y generar lista única de todos
  const facilitadores = useMemo(() => {
    const todos = new Set();
    participantes.forEach(p => {
      if (!p.facilitador) return;
      // Separar por "/" y limpiar espacios de cada nombre
      p.facilitador.split('/').forEach(f => {
        const nombre = f.trim();
        if (nombre) todos.add(nombre);
      });
    });
    return [...todos].sort();
  }, [participantes]);

  // ── Clubes con cambios aplicados (para mostrar en la grilla) ──
  const clubesActuales = useMemo(() => {
    return clubes.map(c => ({
      ...c,
      horario1: cambiosPendientes[c.cod_club]?.horario1 ?? c.horario1,
      horario2: cambiosPendientes[c.cod_club]?.horario2 ?? c.horario2,
    }));
  }, [clubes, cambiosPendientes]);

  // ── Filtrar clubes — soporta selección múltiple (arrays) ──
  const clubesFiltrados = useMemo(() => {
    return clubesActuales.filter(c => {
      // Si el array está vacío, no hay filtro activo
      const matchPPS     = filtroPPS.length === 0     || filtroPPS.includes(c.pps_abrev);
      const matchZona    = filtroZona.length === 0    || filtroZona.includes(c.zona);
      const matchOficial = filtroOficial.length === 0 || filtroOficial.includes(c.oficial);
      // Facilitador: separa por "/" y verifica si alguno del array coincide
      const matchFacilitador = filtroFacilitador.length === 0 ||
        filtroFacilitador.some(filt =>
          participantes.some(p =>
            p.cod_club === c.cod_club &&
            (p.facilitador || '').split('/').map(f => f.trim()).includes(filt)
          )
        );
      return matchPPS && matchZona && matchOficial && matchFacilitador;
    });
  }, [clubesActuales, filtroPPS, filtroZona, filtroOficial, filtroFacilitador, participantes]);

  // ── Construir grilla: { dia: { hora: [clubes] } } ──
  const grilla = useMemo(() => {
    const mapa = {};
    const horasSet = new Set();

    clubesFiltrados.forEach(club => {
      [club.horario1, club.horario2].forEach(h => {
        const parsed = parsearHorario(h);
        if (!parsed) return;
        const { dia, hora } = parsed;
        horasSet.add(hora);
        if (!mapa[dia]) mapa[dia] = {};
        if (!mapa[dia][hora]) mapa[dia][hora] = [];
        mapa[dia][hora].push({ ...club, _slot: h });
      });
    });

    // Ordenar horas por hora de inicio en formato 24h
    // Convierte "1:30" → 90min, "8:30" → 510min, "13:30" → 810min
    const horasOrdenadas = [...horasSet].sort((a, b) => {
      const getMin = h => {
        const inicio = h.split('-')[0].trim();
        const [hh, mm] = inicio.split(':').map(Number);
        // Si la hora es menor a 6, asumimos que es PM (ej: 1:30 → 13:30)
        // Las jornadas AM están entre 6:00 y 12:00
        // Las jornadas PM están entre 1:00 y 5:59
        const hora24 = hh < 6 ? hh + 12 : hh;
        return hora24 * 60 + (mm || 0);
      };
      return getMin(a) - getMin(b);
    });

    return { mapa, horas: horasOrdenadas };
  }, [clubesFiltrados]);

  // ── Días que tienen al menos un club ──
  const diasActivos = useMemo(() => {
    return DIAS_ORDEN.filter(d => grilla.mapa[d] && Object.keys(grilla.mapa[d]).length > 0);
  }, [grilla]);

  // ── Drag and Drop ──
  function onDragStart(club, slot) {
    setDragging({ cod_club: club.cod_club, horarioOrigen: club[slot], slot });
  }

  function onDragOver(e) {
    e.preventDefault(); // Necesario para permitir el drop
  }

  function onDrop(e, dia, hora) {
    e.preventDefault();
    if (!dragging) return;

    // Construir el nuevo horario: "Dia Hora"
    const nuevoHorario = `${dia} ${hora}`;

    // Registrar el cambio como pendiente
    setCambiosPendientes(prev => ({
      ...prev,
      [dragging.cod_club]: {
        ...(prev[dragging.cod_club] || {}),
        [dragging.slot]: nuevoHorario,
      },
    }));

    setDragging(null);
  }

  // ── Contar cambios pendientes ──
  const totalCambios = Object.keys(cambiosPendientes).length;

  // ── Descartar todos los cambios ──
  function descartarCambios() {
    setCambiosPendientes({});
    setMostrarConfirmacion(false);
    setMensajeGuardado(null);
  }

  // ── Guardar cambios en Google Sheets ──
  async function guardarCambios() {
    setGuardando(true);
    setMensajeGuardado(null);
    let errores = 0;

    for (const [cod_club, cambios] of Object.entries(cambiosPendientes)) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({
            accion: 'actualizarHorario',
            codigo: cod_club,
            datos: cambios,
          }),
        });
        const r = await res.json();
        if (!r.ok) errores++;
      } catch {
        errores++;
      }
    }

    setGuardando(false);

    if (errores === 0) {
      setMensajeGuardado({ tipo: 'ok', texto: `✅ ${totalCambios} cambio(s) guardados correctamente en Google Sheets.` });
      setCambiosPendientes({});
      setMostrarConfirmacion(false);
    } else {
      setMensajeGuardado({ tipo: 'error', texto: `⚠️ ${errores} cambio(s) no se pudieron guardar. Intenta de nuevo.` });
    }
  }

  return (
    <div>
      {/* ── Encabezado y filtros ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 18 }}>📅 Horario de Clubes</h2>

          {/* Botón de cambios pendientes */}
          {totalCambios > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primario"
                onClick={() => setMostrarConfirmacion(true)}
                style={{ fontSize: 13 }}
              >
                💾 Guardar {totalCambios} cambio{totalCambios > 1 ? 's' : ''}
              </button>
              <button
                className="btn-secundario"
                onClick={descartarCambios}
                style={{ fontSize: 13 }}
              >
                ✕ Descartar
              </button>
            </div>
          )}
        </div>

        {/* Filtros múltiples */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <MultiSelect
            label="PPS"
            opciones={ppsList.map(p => ({ valor: p, etiqueta: `${p} — ${NOMBRE_PPS?.[p] || p}` }))}
            seleccionados={filtroPPS}
            onChange={setFiltroPPS}
          />
          <MultiSelect
            label="Zona"
            opciones={zonas.map(z => ({ valor: z, etiqueta: z }))}
            seleccionados={filtroZona}
            onChange={setFiltroZona}
          />
          <MultiSelect
            label="Oficial"
            opciones={oficiales.map(o => ({ valor: o, etiqueta: o }))}
            seleccionados={filtroOficial}
            onChange={setFiltroOficial}
          />
          <MultiSelect
            label="Facilitador"
            opciones={facilitadores.map(f => ({ valor: f, etiqueta: f }))}
            seleccionados={filtroFacilitador}
            onChange={setFiltroFacilitador}
          />
          {/* BLOQUE ELIMINADO — era el antiguo select de facilitador */}
          {false && <select className="input-base" style={{ width: 'auto', minWidth: 200 }}
            value={""} onChange={e => {}}>
            <option value="">Todos los facilitadores</option>
          </select>}

          {/* Botón limpiar — aparece si hay algún filtro activo */}
          {(filtroPPS.length > 0 || filtroZona.length > 0 || filtroOficial.length > 0 || filtroFacilitador.length > 0) && (
            <button className="btn-secundario" style={{ fontSize: 12, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 2 }}
              onClick={() => { setFiltroPPS([]); setFiltroZona([]); setFiltroOficial([]); setFiltroFacilitador([]); }}>
              ✕ Limpiar todo
            </button>
          )}
        </div>

        {/* Leyenda de colores por etapa */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(COLORES_ETAPA).map(([etapa, color]) => (
            <span key={etapa} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: color.bg, border: `1px solid ${color.borde}`,
              color: color.texto, fontWeight: 600,
            }}>
              {etapa}
            </span>
          ))}
          <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>
            · Arrastra los bloques para reorganizar
          </span>
        </div>
      </div>

      {/* Mensaje de guardado */}
      {mensajeGuardado && (
        <div style={{
          marginBottom: 16, padding: 14, borderRadius: 12, fontSize: 13,
          background: mensajeGuardado.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
          border: `1px solid ${mensajeGuardado.tipo === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
          color: mensajeGuardado.tipo === 'ok' ? '#22c55e' : '#eab308',
        }}>
          {mensajeGuardado.texto}
        </div>
      )}

      {/* ── Grilla de horario ── */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(${diasActivos.length}, minmax(150px, 1fr))`,
          gap: 2,
          minWidth: 600,
        }}>

          {/* Encabezados de días */}
          <div style={{
            background: '#1e293b', borderRadius: 10, padding: '12px 10px',
            fontSize: 12, color: '#94a3b8', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Hora
          </div>
          {diasActivos.map(dia => (
            <div key={dia} style={{
              background: '#1e293b', borderRadius: 10, padding: '12px 10px',
              fontSize: 13, fontWeight: 700, color: '#e2e8f0', textAlign: 'center',
              fontFamily: 'Syne, sans-serif',
            }}>
              {dia}
            </div>
          ))}

          {/* Filas por hora */}
          {grilla.horas.map(hora => (
            <React.Fragment key={hora}>
              {/* Celda de hora */}
              <div style={{
                background: 'rgba(249,115,22,0.06)', borderRadius: 8,
                padding: '10px 10px', fontSize: 12, color: '#f97316',
                fontWeight: 600, display: 'flex', alignItems: 'center',
              }}>
                {hora}
              </div>

              {/* Celdas por día */}
              {diasActivos.map(dia => {
                const clubesEnCelda = grilla.mapa[dia]?.[hora] || [];
                const esCeldaVacia = clubesEnCelda.length === 0;

                return (
                  <div
                    key={`${dia}-${hora}`}
                    onDragOver={onDragOver}
                    onDrop={e => onDrop(e, dia, hora)}
                    style={{
                      minHeight: 80,
                      background: dragging ? 'rgba(249,115,22,0.04)' : 'rgba(255,255,255,0.01)',
                      border: dragging ? '1px dashed rgba(249,115,22,0.3)' : '1px solid transparent',
                      borderRadius: 8, padding: 4,
                      display: 'flex', flexDirection: 'column', gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    {esCeldaVacia && dragging && (
                      <div style={{
                        height: '100%', minHeight: 72,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: 'rgba(249,115,22,0.4)',
                      }}>
                        Soltar aquí
                      </div>
                    )}

                    {clubesEnCelda.map((club, idx) => {
                      const color = COLORES_ETAPA[club.etapa] || COLORES_ETAPA['6-9 Años'];
                      const ocupados = parseInt(conteoPorClub[club.cod_club]) || 0;
                      const tieneCambio = !!cambiosPendientes[club.cod_club];

                      return (
                        <div
                          key={`${club.cod_club}-${idx}`}
                          draggable
                          onDragStart={() => onDragStart(club, club._slot === club.horario1 ? 'horario1' : 'horario2')}
                          onClick={() => setClubDetalle(club)}
                          style={{
                            background: color.bg,
                            border: `1px solid ${tieneCambio ? '#f97316' : color.borde}`,
                            borderRadius: 8, padding: '8px 10px',
                            cursor: 'grab', fontSize: 12,
                            position: 'relative',
                            boxShadow: tieneCambio ? '0 0 0 2px rgba(249,115,22,0.4)' : 'none',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {/* Indicador de cambio pendiente */}
                          {tieneCambio && (
                            <div style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 8, height: 8, borderRadius: '50%',
                              background: '#f97316',
                            }} />
                          )}

                          {/* Código del club */}
                          <div style={{ fontWeight: 700, color: color.texto, fontSize: 12 }}>
                            {club.cod_club}
                          </div>

                          {/* Etapa */}
                          <div style={{ fontSize: 11, color: color.texto, opacity: 0.8 }}>
                            {club.etapa}
                          </div>

                          {/* PPS — nombre del lugar */}
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            📍 {club.pps_abrev || club.pps_nombre || ''}
                          </div>

                          {/* Oficial */}
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            👤 {club.oficial || 'Sin oficial'}
                          </div>

                          {/* Ocupación */}
                          <div style={{ marginTop: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                              <span style={{ color: '#94a3b8' }}>{ocupados}/30</span>
                            </div>
                            <div style={{ height: 3, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min((ocupados / 30) * 100, 100)}%`,
                                background: ocupados >= 30 ? '#ef4444' : ocupados >= 21 ? '#eab308' : '#22c55e',
                                borderRadius: 2,
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Modal de detalle de club ── */}
      {clubDetalle && (
        <div
          onClick={() => setClubDetalle(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, color: '#f97316' }}>{clubDetalle.cod_club}</h3>
              <button onClick={() => setClubDetalle(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FilaDetalle label="Tipo"       valor={clubDetalle.nombre_club} />
              <FilaDetalle label="Etapa"      valor={clubDetalle.etapa} />
              <FilaDetalle label="Zona"       valor={clubDetalle.zona} />
              <FilaDetalle label="Jornada"    valor={clubDetalle.jornada} />
              <FilaDetalle label="PPS"        valor={`${clubDetalle.pps_abrev} — ${clubDetalle.pps_nombre}`} />
              <FilaDetalle label="Horario 1"  valor={clubDetalle.horario1} />
              <FilaDetalle label="Horario 2"  valor={clubDetalle.horario2} />
              <FilaDetalle label="Oficial"    valor={clubDetalle.oficial} />
              <FilaDetalle label="Participantes" valor={`${parseInt(conteoPorClub[clubDetalle.cod_club]) || 0}/30`} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación de guardado ── */}
      {mostrarConfirmacion && (
        <div
          onClick={() => setMostrarConfirmacion(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 16, padding: 24, maxWidth: 480, width: '100%',
            }}
          >
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>💾 Confirmar cambios de horario</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Se guardarán los siguientes cambios en Google Sheets:
            </p>

            {/* Lista de cambios pendientes */}
            <div style={{
              maxHeight: 240, overflowY: 'auto', marginBottom: 16,
              border: '1px solid #334155', borderRadius: 10,
            }}>
              {Object.entries(cambiosPendientes).map(([cod_club, cambios]) => (
                <div key={cod_club} style={{
                  padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 13,
                }}>
                  <strong style={{ color: '#f97316' }}>{cod_club}</strong>
                  {cambios.horario1 && (
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>
                      Horario 1 → <span style={{ color: '#e2e8f0' }}>{cambios.horario1}</span>
                    </div>
                  )}
                  {cambios.horario2 && (
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>
                      Horario 2 → <span style={{ color: '#e2e8f0' }}>{cambios.horario2}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primario" onClick={guardarCambios}
                disabled={guardando} style={{ opacity: guardando ? 0.6 : 1 }}>
                {guardando ? '⏳ Guardando...' : '✅ Confirmar y guardar'}
              </button>
              <button className="btn-secundario" onClick={() => setMostrarConfirmacion(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FilaDetalle — fila de dato en el modal de detalle ──
function FilaDetalle({ label, valor }) {
  if (!valor) return null;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', width: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{valor}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MultiSelect — Dropdown con checkboxes para selección múltiple
// Props:
//   - label: texto del botón cuando no hay selección
//   - opciones: [{ valor, etiqueta }]
//   - seleccionados: array de valores seleccionados
//   - onChange: función que recibe el nuevo array
// ─────────────────────────────────────────────────────────────
function MultiSelect({ label, opciones, seleccionados, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const ref = React.useRef(null);

  // Cerrar al hacer clic fuera del dropdown
  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Toggle de un valor individual
  function toggleValor(valor) {
    if (seleccionados.includes(valor)) {
      onChange(seleccionados.filter(v => v !== valor));
    } else {
      onChange([...seleccionados, valor]);
    }
  }

  const hay = seleccionados.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón principal del dropdown */}
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          background: hay ? 'rgba(249,115,22,0.1)' : '#0f172a',
          border: `1px solid ${hay ? '#f97316' : '#334155'}`,
          color: hay ? '#f97316' : '#94a3b8',
          cursor: 'pointer', fontSize: 13,
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap', minWidth: 140,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>
          {hay
            ? seleccionados.length === 1
              ? seleccionados[0].length > 18 ? seleccionados[0].slice(0, 18) + '…' : seleccionados[0]
              : `${label}: ${seleccionados.length} selec.`
            : `Todos — ${label}`}
        </span>
        {/* Badge con cantidad */}
        {hay && (
          <span style={{
            background: '#f97316', color: '#fff',
            borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
          }}>
            {seleccionados.length}
          </span>
        )}
        <span style={{ fontSize: 10 }}>{abierto ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown con checkboxes */}
      {abierto && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          marginTop: 6, zIndex: 200,
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 12, minWidth: 220, maxWidth: 300,
          maxHeight: 280, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {/* Opción "Seleccionar todos" */}
          <div
            onClick={() => onChange(seleccionados.length === opciones.length ? [] : opciones.map(o => o.valor))}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', cursor: 'pointer', fontSize: 12,
              borderBottom: '1px solid #334155', color: '#94a3b8',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${seleccionados.length === opciones.length ? '#f97316' : '#475569'}`,
              background: seleccionados.length === opciones.length ? '#f97316' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {seleccionados.length === opciones.length && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
            </div>
            <span>Seleccionar todos</span>
          </div>

          {/* Lista de opciones con checkbox */}
          {opciones.map(op => {
            const activo = seleccionados.includes(op.valor);
            return (
              <div
                key={op.valor}
                onClick={() => toggleValor(op.valor)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                  background: activo ? 'rgba(249,115,22,0.07)' : 'transparent',
                  borderBottom: '1px solid rgba(51,65,85,0.4)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = activo ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = activo ? 'rgba(249,115,22,0.07)' : 'transparent'}
              >
                {/* Checkbox visual */}
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${activo ? '#f97316' : '#475569'}`,
                  background: activo ? '#f97316' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {activo && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                </div>
                {/* Etiqueta */}
                <span style={{ color: activo ? '#f97316' : '#e2e8f0', lineHeight: 1.3 }}>
                  {op.etiqueta}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
