// ============================================================
// RecomendadorClub.jsx
// ============================================================
// Motor de recomendación de clubs.
// Dados un participante y la lista de clubes,
// muestra los clubs compatibles ordenados por cercanía.
// El usuario puede seleccionar uno y confirmar el cambio.

import React, { useMemo, useState } from 'react';
import { filtrarClubesCompatibles, getEtapaColor } from '../utils/clubUtils';

// ─────────────────────────────────────────────────────────────
// RecomendadorClub
// Props:
//   - participante: objeto con todos los datos del participante
//   - clubes: array con el catálogo de clubes
//   - todosParticipantes: array completo para contar ocupación actual
// ─────────────────────────────────────────────────────────────
export default function RecomendadorClub({ participante, clubes, todosParticipantes }) {
  // Club seleccionado por el usuario en la tabla de recomendaciones
  const [clubElegido, setClubElegido] = useState(null);

  // Confirmar el cambio: muestra mensaje de éxito (en producción, aquí iría la lógica de guardado)
  const [cambioConfirmado, setCambioConfirmado] = useState(false);

  // Filtro adicional por zona: el usuario puede filtrar solo su zona o ver todas
  const [soloMismaZona, setSoloMismaZona] = useState(false);

  // ── Calcular clubes compatibles ──
  // useMemo evita recalcular si el participante o clubes no cambian
  const compatibles = useMemo(() => {
    return filtrarClubesCompatibles({ participante, clubes, todosParticipantes });
  }, [participante, clubes, todosParticipantes]);

  // Aplicar filtro adicional de zona si está activado
  const visibles = soloMismaZona
    ? compatibles.filter(c => c.esMismaZona)
    : compatibles;

  // ── Confirmar reasignación ──
  function confirmarCambio() {
    // En esta versión, solo muestra el mensaje de éxito.
    // En producción: aquí se llamaría a una API o se actualizaría el JSON.
    setCambioConfirmado(true);
  }

  // ── Reiniciar selección ──
  function reiniciar() {
    setClubElegido(null);
    setCambioConfirmado(false);
  }

  return (
    <div className="card">
      {/* ── Encabezado del recomendador ── */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>
          🎯 Clubes disponibles para reasignar
        </h3>
        {/* Resumen del participante para contexto */}
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Buscando clubs de{' '}
          <span className={`badge ${getEtapaColor(participante.etapa)}`} style={{ margin: '0 4px' }}>
            {participante.etapa}
          </span>
          · Jornada <strong style={{ color: '#e2e8f0' }}>{participante.jornada}</strong>
          · Zona origen: <strong style={{ color: '#f97316' }}>{participante.zona}</strong>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {/* Botón para mostrar solo clubes de la misma zona */}
        <button
          className={soloMismaZona ? 'btn-primario' : 'btn-secundario'}
          onClick={() => setSoloMismaZona(!soloMismaZona)}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          📍 {soloMismaZona ? 'Mostrando solo mi zona' : 'Filtrar: solo mi zona'}
        </button>

        {/* Contador de resultados */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#94a3b8',
        }}>
          {visibles.length} club{visibles.length !== 1 ? 'es' : ''} encontrado{visibles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Tabla de clubes compatibles ── */}
      {visibles.length === 0 ? (
        // Mensaje si no hay resultados
        <div style={{
          padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14,
          background: 'rgba(255,255,255,0.02)', borderRadius: 12,
        }}>
          No se encontraron clubs disponibles con los filtros actuales.
        </div>
      ) : (
        <div className="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th>Club</th>
                <th>Zona</th>
                <th>Lugar</th>
                <th>Horario 1</th>
                <th>Horario 2</th>
                <th>Ocupación</th>
                <th>Cercanía</th>
                <th>Elegir</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(club => {
                // Calcular color de la barra de ocupación
                const porcentaje = (club.participantesActuales / 30) * 100;
                const colorBarra = porcentaje >= 90 ? '#ef4444' : porcentaje >= 70 ? '#eab308' : '#22c55e';

                // Determinar ícono de cercanía
                const iconoCercania = club.distanciaZona === 0 ? '🟢' : club.distanciaZona === 1 ? '🟡' : '🔴';
                const textoCercania = club.distanciaZona === 0 ? 'Misma zona'
                  : club.distanciaZona === 1 ? 'Zona adyacente'
                  : 'Zona lejana';

                const estaSeleccionado = clubElegido?.cod_club === club.cod_club;

                return (
                  <tr
                    key={club.cod_club}
                    style={{
                      // Resaltar la fila seleccionada con fondo naranja suave
                      background: estaSeleccionado ? 'rgba(249,115,22,0.1)' : 'transparent',
                    }}
                  >
                    {/* Nombre del club */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{club.cod_club}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{club.nombre_club}</div>
                    </td>

                    {/* Zona */}
                    <td>
                      <span className="badge badge-azul">{club.zona}</span>
                    </td>

                    {/* Lugar / PPS */}
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{club.pps_abrev}</div>
                      <div style={{ fontSize: 12 }}>{club.pps_nombre}</div>
                    </td>

                    {/* Horarios */}
                    <td style={{ fontSize: 12, color: '#e2e8f0' }}>{club.horario1}</td>
                    <td style={{ fontSize: 12, color: '#e2e8f0' }}>{club.horario2}</td>

                    {/* Barra de ocupación */}
                    <td>
                      <div style={{ fontSize: 12, marginBottom: 4, color: '#94a3b8' }}>
                        {club.participantesActuales}/30
                      </div>
                      {/* Barra visual de progreso */}
                      <div style={{ height: 5, background: '#334155', borderRadius: 3, width: 80 }}>
                        <div style={{
                          height: '100%', width: `${Math.min(porcentaje, 100)}%`,
                          background: colorBarra, borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      {/* Indicador de espacio disponible */}
                      <div style={{ fontSize: 11, color: colorBarra, marginTop: 3 }}>
                        {club.hayEspacio ? `${club.capacidadDisponible} disponibles` : 'Sin espacio'}
                      </div>
                    </td>

                    {/* Cercanía a la zona del participante */}
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {iconoCercania} {textoCercania}
                      </span>
                    </td>

                    {/* Botón de selección */}
                    <td>
                      <button
                        className={estaSeleccionado ? 'btn-primario' : 'btn-secundario'}
                        style={{ fontSize: 12, padding: '6px 14px', opacity: !club.hayEspacio ? 0.4 : 1 }}
                        disabled={!club.hayEspacio}
                        onClick={() => {
                          setClubElegido(estaSeleccionado ? null : club);
                          setCambioConfirmado(false);
                        }}
                      >
                        {estaSeleccionado ? '✓ Elegido' : 'Elegir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Confirmación del cambio ── */}
      {clubElegido && !cambioConfirmado && (
        <div style={{
          marginTop: 20, padding: 18,
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            <strong>¿Confirmar cambio de club?</strong>
          </div>
          {/* Resumen del cambio */}
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            <strong style={{ color: '#e2e8f0' }}>{participante.nombre} {participante.apellido}</strong>
            {' '} pasaría de{' '}
            <span className="badge badge-gris">{participante.cod_club}</span>
            {' '} a{' '}
            <span className="badge badge-naranja">{clubElegido.cod_club}</span>
            {' '} · Zona: {clubElegido.zona} · {clubElegido.horario1}
          </div>
          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primario" onClick={confirmarCambio}>
              ✅ Confirmar cambio
            </button>
            <button className="btn-secundario" onClick={reiniciar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Mensaje de éxito tras confirmar ── */}
      {cambioConfirmado && (
        <div style={{
          marginTop: 20, padding: 18,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 16, color: '#22c55e', fontWeight: 700, marginBottom: 8 }}>
            ✅ Cambio registrado
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            <strong style={{ color: '#e2e8f0' }}>{participante.nombre} {participante.apellido}</strong>
            {' '}fue asignado a <strong style={{ color: '#f97316' }}>{clubElegido.cod_club}</strong>.
            {' '}Recuerda actualizar el archivo Excel y notificar al oficial responsable.
          </div>
          <button className="btn-secundario" onClick={reiniciar} style={{ fontSize: 13 }}>
            Hacer otro cambio
          </button>
        </div>
      )}
    </div>
  );
}
