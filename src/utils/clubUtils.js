// ============================================================
// clubUtils.js — Lógica de filtrado y recomendación de clubes
// ============================================================
// Este archivo contiene todas las funciones "inteligentes" del sistema:
// - cómo se ordena la cercanía entre zonas y sectores
// - cómo se filtran clubes compatibles para un participante
// - cómo se genera el ranking de recomendaciones

// ─────────────────────────────────────────────────────────────
// MAPA DE CERCANÍA ENTRE ZONAS
// Define qué tan "cerca" está una zona de otra.
// La zona propia tiene distancia 0. Las adyacentes, 1. Las lejanas, 2+.
// Esto permite ordenar las recomendaciones por proximidad geográfica.
// ─────────────────────────────────────────────────────────────
const DISTANCIA_ZONAS = {
  'COL-J01': { 'COL-J01': 0, 'COL-J02': 1, 'COL-J03': 2, 'COL-J04': 3 },
  'COL-J02': { 'COL-J01': 1, 'COL-J02': 0, 'COL-J03': 1, 'COL-J04': 2 },
  'COL-J03': { 'COL-J01': 2, 'COL-J02': 1, 'COL-J03': 0, 'COL-J04': 1 },
  'COL-J04': { 'COL-J01': 3, 'COL-J02': 2, 'COL-J03': 1, 'COL-J04': 0 },
};

// ─────────────────────────────────────────────────────────────
// getDistanciaZona
// Recibe dos zonas y devuelve su distancia numérica.
// Si no se encuentra en el mapa, devuelve 99 (muy lejos).
// ─────────────────────────────────────────────────────────────
export function getDistanciaZona(zonaOrigen, zonaDestino) {
  if (!zonaOrigen || !zonaDestino) return 99;
  const mapa = DISTANCIA_ZONAS[zonaOrigen];
  if (!mapa) return 99;
  return mapa[zonaDestino] ?? 99;
}

// ─────────────────────────────────────────────────────────────
// getDistanciaSector
// Compara dos sectores como strings numéricos (ej: "COL-J0101").
// Extrae los últimos 4 dígitos y calcula la diferencia absoluta.
// Menor diferencia = sectores más cercanos entre sí.
// ─────────────────────────────────────────────────────────────
export function getDistanciaSector(sectorOrigen, sectorDestino) {
  if (!sectorOrigen || !sectorDestino) return 99;
  // Extraer los 4 últimos caracteres como número (ej: "0101" → 101)
  const numA = parseInt(sectorOrigen.slice(-4), 10);
  const numB = parseInt(sectorDestino.slice(-4), 10);
  if (isNaN(numA) || isNaN(numB)) return 99;
  return Math.abs(numA - numB);
}

// ─────────────────────────────────────────────────────────────
// CAPACIDAD MÁXIMA POR CLUB
// Basado en los datos reales, los clubes tienen entre 20-35 participantes.
// Usamos 30 como límite razonable por defecto.
// ─────────────────────────────────────────────────────────────
const CAPACIDAD_MAX = 30;

// ─────────────────────────────────────────────────────────────
// filtrarClubesCompatibles
// Dado un participante y la lista completa de clubes + participantes,
// devuelve los clubes que son compatibles según:
//   1. Misma etapa de vida (obligatorio)
//   2. Misma jornada escolar (obligatorio)
//   3. Que no sea el club actual del participante
// Luego los ordena por cercanía (zona primero, sector como desempate).
// Devuelve también cuántos participantes hay en cada club.
// ─────────────────────────────────────────────────────────────
export function filtrarClubesCompatibles({ participante, clubes, todosParticipantes }) {
  // Conteo actual de participantes por club
  const conteoClub = {};
  todosParticipantes.forEach(p => {
    if (p.cod_club) {
      conteoClub[p.cod_club] = (conteoClub[p.cod_club] || 0) + 1;
    }
  });

  // Filtrar por etapa + jornada + distinto al club actual
  const compatibles = clubes.filter(club => {
    const mismaEtapa = club.etapa?.trim() === participante.etapa?.trim();
    const mismaJornada = club.jornada?.trim() === participante.jornada?.trim();
    const esDistinto = club.cod_club !== participante.cod_club;
    return mismaEtapa && mismaJornada && esDistinto;
  });

  // Calcular puntaje de cercanía y enriquecer cada club con datos útiles
  const enriquecidos = compatibles.map(club => {
    const distZona = getDistanciaZona(participante.zona, club.zona);
    const esMismaZona = distZona === 0;
    const totalActual = parseInt(conteoClub[club.cod_club]) || 0;
    const disponibles = Math.max(0, CAPACIDAD_MAX - totalActual);

    return {
      ...club,
      distanciaZona: distZona,          // 0 = misma zona, 1 = zona adyacente, etc.
      esMismaZona,                       // booleano para resaltar en la UI
      participantesActuales: totalActual,
      capacidadDisponible: disponibles,
      hayEspacio: disponibles > 0,
    };
  });

  // Ordenar: primero por distancia de zona, luego por disponibilidad (más espacio = mejor)
  enriquecidos.sort((a, b) => {
    if (a.distanciaZona !== b.distanciaZona) return a.distanciaZona - b.distanciaZona;
    return b.capacidadDisponible - a.capacidadDisponible;
  });

  return enriquecidos;
}

// ─────────────────────────────────────────────────────────────
// getEtapaColor
// Devuelve la clase CSS de badge según la etapa de vida.
// Así cada franja etaria tiene su propio color en la UI.
// ─────────────────────────────────────────────────────────────
export function getEtapaColor(etapa) {
  const map = {
    '2-3 Años': 'badge-verde',
    '4-5 Años': 'badge-azul',
    '6-9 Años': 'badge-naranja',
    '10-14 Años': 'badge-amarillo',
    '15-18 Años': 'badge-gris',
  };
  return map[etapa] || 'badge-gris';
}

// ─────────────────────────────────────────────────────────────
// normalizarTexto
// Convierte texto a minúsculas y elimina tildes.
// Sirve para hacer búsquedas robustas sin importar acentos.
// Ej: "Jiménez" → "jimenez"
// ─────────────────────────────────────────────────────────────
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ─────────────────────────────────────────────────────────────
// buscarParticipantes
// Filtra la lista de participantes según un término de búsqueda.
// Busca en: nombre, apellido, código, zona, sector, club y oficial.
// ─────────────────────────────────────────────────────────────
export function buscarParticipantes(participantes, termino) {
  const t = normalizarTexto(termino);
  if (!t) return participantes;

  return participantes.filter(p => {
    const campos = [p.nombre, p.apellido, p.codigo, p.zona,
                    p.sector, p.cod_club, p.oficial, p.etapa];
    return campos.some(c => normalizarTexto(c).includes(t));
  });
}
