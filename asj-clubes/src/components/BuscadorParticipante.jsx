// ============================================================
// BuscadorParticipante.jsx
// ============================================================
// Componente principal de búsqueda.
// Permite buscar un participante por nombre, apellido o código,
// ver su perfil completo, y lanzar el proceso de reasignación de club.

import React, { useState, useMemo } from 'react';
import { buscarParticipantes, getEtapaColor } from '../utils/clubUtils';
import RecomendadorClub from './RecomendadorClub';

// ─────────────────────────────────────────────────────────────
// BuscadorParticipante
// Props:
//   - participantes: array con todos los participantes
//   - clubes: array con todos los clubes disponibles
// ─────────────────────────────────────────────────────────────
export default function BuscadorParticipante({ participantes, clubes }) {
  // Texto que el usuario escribe en la caja de búsqueda
  const [termino, setTermino] = useState('');

  // Participante que el usuario seleccionó de los resultados
  const [seleccionado, setSeleccionado] = useState(null);

  // Controla si se muestra el panel de reasignación de club
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);

  // ── Resultados de búsqueda ──
  // useMemo evita recalcular en cada render si el término no cambia.
  // Solo muestra resultados cuando hay al menos 2 caracteres escritos.
  const resultados = useMemo(() => {
    if (termino.length < 2) return [];
    const encontrados = buscarParticipantes(participantes, termino);
    return encontrados.slice(0, 12); // Limitar a 12 resultados visibles
  }, [termino, participantes]);

  // ── Seleccionar un participante ──
  // Al hacer clic en un resultado, se guarda y se limpia la búsqueda
  function seleccionar(participante) {
    setSeleccionado(participante);
    setTermino('');
    setMostrarRecomendador(false); // Ocultar recomendador si estaba abierto
  }

  // ── Limpiar selección ──
  function limpiar() {
    setSeleccionado(null);
    setMostrarRecomendador(false);
  }

  return (
    <div>
      {/* ── Barra de búsqueda ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          🔍 Buscar Participante
        </h2>

        {/* Input de búsqueda */}
        <div style={{ position: 'relative' }}>
          <input
            className="input-base"
            type="text"
            placeholder="Escribe nombre, apellido o código..."
            value={termino}
            onChange={e => setTermino(e.target.value)}
          />

          {/* Dropdown de resultados — aparece solo si hay resultados */}
          {resultados.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 12,
              marginTop: 6,
              zIndex: 100,
              maxHeight: 320,
              overflowY: 'auto',
            }}>
              {resultados.map(p => (
                <button
                  key={p.codigo}
                  onClick={() => seleccionar(p)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #334155',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {/* Inicial del nombre */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#f97316', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {p.nombre?.[0] || '?'}
                  </div>

                  <div>
                    {/* Nombre completo */}
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {p.nombre} {p.apellido}
                    </div>
                    {/* Datos secundarios */}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Cód: {p.codigo} · {p.zona} · {p.etapa}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje cuando se escribe pero no hay resultados */}
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

          {/* Encabezado del perfil */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {/* Avatar con inicial */}
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
                  {/* Badge de etapa de vida */}
                  <span className={`badge ${getEtapaColor(seleccionado.etapa)}`}>
                    {seleccionado.etapa}
                  </span>
                  {/* Badge de jornada */}
                  <span className="badge badge-azul">
                    Jornada {seleccionado.jornada}
                  </span>
                  {/* Badge de estado */}
                  <span className={`badge ${seleccionado.estado === 'Registrado' ? 'badge-verde' : 'badge-amarillo'}`}>
                    {seleccionado.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón cerrar perfil */}
            <button
              className="btn-secundario"
              onClick={limpiar}
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Grid de datos del perfil */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <Campo label="Código" valor={seleccionado.codigo} />
            <Campo label="Edad actual" valor={`${seleccionado.edad_actual} años`} />
            <Campo label="Edad 2026" valor={`${seleccionado.edad_2026} años`} />
            <Campo label="Género" valor={seleccionado.genero} />
            <Campo label="Zona" valor={seleccionado.zona} />
            <Campo label="Sector" valor={seleccionado.sector} />
            <Campo label="Club actual" valor={seleccionado.cod_club} destaca />
            <Campo label="Horario 1" valor={seleccionado.horario1} />
            <Campo label="Horario 2" valor={seleccionado.horario2} />
            <Campo label="Lugar" valor={seleccionado.pps_nombre} />
            <Campo label="Oficial" valor={seleccionado.oficial} />
            <Campo label="Facilitador" valor={seleccionado.facilitador} />
            <Campo label="Contacto" valor={seleccionado.contacto} />
            <Campo label="Teléfono" valor={seleccionado.telefono} />
          </div>

          {/* Historial de cambios de club */}
          {(seleccionado.club_nuevo || seleccionado.club_anterior) && (
            <div style={{
              marginTop: 16, padding: 14, background: 'rgba(249,115,22,0.07)',
              borderRadius: 10, border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                📋 Historial de club
              </div>
              {seleccionado.club_nuevo && (
                <div style={{ fontSize: 13 }}>
                  <strong>Club nuevo:</strong> {seleccionado.club_nuevo}
                </div>
              )}
              {seleccionado.club_anterior && (
                <div style={{ fontSize: 13 }}>
                  <strong>Club anterior:</strong> {seleccionado.club_anterior}
                </div>
              )}
            </div>
          )}

          {/* Botón para abrir el recomendador de clubs */}
          <div style={{ marginTop: 20 }}>
            <button
              className="btn-primario"
              onClick={() => setMostrarRecomendador(!mostrarRecomendador)}
            >
              {mostrarRecomendador ? '▲ Ocultar recomendaciones' : '🔄 Ver clubes disponibles para reasignar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Panel de recomendación de clubes ── */}
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

// ─────────────────────────────────────────────────────────────
// Campo — componente auxiliar para mostrar un dato del perfil
// Props:
//   - label: texto de la etiqueta
//   - valor: contenido a mostrar
//   - destaca: si es true, muestra el valor en naranja
// ─────────────────────────────────────────────────────────────
function Campo({ label, valor, destaca }) {
  if (!valor) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: destaca ? '#f97316' : '#e2e8f0', fontWeight: destaca ? 600 : 400 }}>
        {valor}
      </div>
    </div>
  );
}
