"""
scripts/exportar_datos.py
=========================
Script para regenerar los archivos JSON desde el Excel actualizado.

USO:
  1. Pon el archivo Excel actualizado en la carpeta raíz del proyecto
     con el nombre: COPIA_BD_ASJ_CAMBIOS.xlsx
  2. Ejecuta desde la raíz del proyecto:
     python3 scripts/exportar_datos.py

RESULTADO:
  Actualiza src/data/participantes.json y src/data/clubes.json
"""

import pandas as pd
import json
import os

# ── Ruta al Excel (relativa a la carpeta raíz del proyecto) ──
EXCEL_PATH = "COPIA_BD_ASJ_CAMBIOS.xlsx"
HOJA = "Participantes CCJ"

# ── Ruta de salida de los JSON ──
OUT_PARTICIPANTES = "src/data/participantes.json"
OUT_CLUBES        = "src/data/clubes.json"

# ── Zonas válidas en el sistema ──
ZONAS_VALIDAS = ['COL-J01', 'COL-J02', 'COL-J03', 'COL-J04']


def exportar():
    print(f"Leyendo {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH, sheet_name=HOJA)

    # Limpiar espacios en los nombres de columna
    df.columns = df.columns.str.strip()

    # Filtrar solo filas con zonas válidas
    df = df[df['Zona'].str.strip().isin(ZONAS_VALIDAS)]
    print(f"Participantes con zona válida: {len(df)}")

    # ── Exportar participantes ──
    participantes = df.rename(columns={
        'Zona': 'zona', 'Sector': 'sector', 'Código': 'codigo',
        'Nombre Completo': 'nombre', 'Apellido del Participante': 'apellido',
        'Edad Actual': 'edad_actual', 'Edad 2026': 'edad_2026',
        'Etapa de vida': 'etapa', 'Nombre de  club': 'nombre_club',
        '# de club': 'num_club', 'Cod. Club': 'cod_club',
        'Nombre de Club PTA\nNuevo': 'club_nuevo',
        'Nombre de Club PTA\nAnterior': 'club_anterior',
        'Género': 'genero', 'Estado del Participante': 'estado',
        'Jornada Asignada': 'jornada', 'Oficial Responsable': 'oficial',
        'Facilitador Asignado': 'facilitador',
        'Contacto Principal del Participante': 'contacto',
        'Telefono': 'telefono', 'Horario 1': 'horario1', 'Horario 2': 'horario2',
        'PPS Asignado': 'pps_nombre', 'Abreviatura PPS': 'pps_abrev',
    })[[
        'codigo', 'nombre', 'apellido', 'edad_actual', 'edad_2026', 'etapa',
        'zona', 'sector', 'cod_club', 'nombre_club', 'num_club',
        'jornada', 'horario1', 'horario2', 'oficial', 'facilitador',
        'estado', 'pps_nombre', 'pps_abrev', 'contacto', 'telefono',
        'club_nuevo', 'club_anterior', 'genero',
    ]]

    # Rellenar NaN y convertir todo a string para JSON limpio
    participantes = participantes.fillna('').astype(str)
    participantes.to_json(OUT_PARTICIPANTES, orient='records', force_ascii=False, indent=2)
    print(f"✅ Participantes exportados: {len(participantes)} → {OUT_PARTICIPANTES}")

    # ── Exportar catálogo de clubes ──
    clubes_raw = df.groupby([
        'Cod. Club', 'Nombre de  club', 'Zona', 'Jornada Asignada', 'Etapa de vida',
        'PPS Asignado', 'Abreviatura PPS'
    ]).agg(
        participantes=('Código', 'count'),
        horario1=('Horario 1', lambda x: x.mode()[0] if len(x) > 0 else ''),
        horario2=('Horario 2', lambda x: x.mode()[0] if len(x) > 0 else ''),
        oficial=('Oficial Responsable', lambda x: x.mode()[0] if len(x) > 0 else ''),
    ).reset_index()

    clubes_raw.columns = [
        'cod_club', 'nombre_club', 'zona', 'jornada', 'etapa',
        'pps_nombre', 'pps_abrev', 'participantes', 'horario1', 'horario2', 'oficial'
    ]

    # Eliminar duplicados: quedarse con la entrada de mayor ocupación por club
    clubes_final = (clubes_raw
        .sort_values('participantes', ascending=False)
        .drop_duplicates('cod_club')
        .fillna('')
        .astype(str))

    clubes_final.to_json(OUT_CLUBES, orient='records', force_ascii=False, indent=2)
    print(f"✅ Clubes exportados: {len(clubes_final)} → {OUT_CLUBES}")
    print("\n¡Listo! Reinicia el servidor con: npm start")


if __name__ == "__main__":
    # Verificar que el Excel existe antes de arrancar
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ No se encontró el archivo: {EXCEL_PATH}")
        print("   Asegúrate de estar en la carpeta raíz del proyecto.")
    else:
        exportar()
