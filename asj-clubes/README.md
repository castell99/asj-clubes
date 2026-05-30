# 🏫 ASJ Clubes — Sistema de Gestión

Sistema web para gestionar participantes, clubes, oficiales y facilitadores de la fundación ASJ.

## ✨ Funcionalidades

- 🔍 **Búsqueda de participantes** por nombre o código
- 📋 **Perfil completo** de cada participante (zona, etapa, jornada, club actual)
- 🔄 **Reasignación inteligente de club**: filtra clubes disponibles por etapa de vida, jornada y zona más cercana
- 📊 **Panel de estadísticas** por oficial, zona y etapa de vida
- 👥 **Vista de clubes** con capacidad y facilitadores asignados

---

## 🚀 Cómo correr el proyecto localmente

### Requisitos
- [Node.js](https://nodejs.org/) versión 16 o superior
- npm (viene incluido con Node.js)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/asj-clubes.git

# 2. Entrar a la carpeta
cd asj-clubes

# 3. Instalar dependencias
npm install

# 4. Correr en modo desarrollo
npm start
```

El navegador abrirá automáticamente en `http://localhost:3000`

---

## 📁 Estructura del proyecto

```
asj-clubes/
├── public/
│   └── index.html          ← Página base HTML
├── src/
│   ├── data/
│   │   ├── participantes.json  ← Base de datos de participantes
│   │   └── clubes.json         ← Catálogo de clubes
│   ├── utils/
│   │   └── clubUtils.js        ← Lógica de filtrado y recomendación
│   ├── components/
│   │   ├── BuscadorParticipante.jsx  ← Búsqueda y perfil
│   │   ├── RecomendadorClub.jsx      ← Motor de reasignación
│   │   ├── PanelEstadisticas.jsx     ← Resumen general
│   │   └── VistaClubes.jsx           ← Listado de clubes
│   ├── App.jsx             ← Componente raíz
│   ├── App.css             ← Estilos globales
│   └── index.js            ← Punto de entrada
└── package.json
```

---

## 🌐 Publicar en GitHub Pages (opcional)

```bash
# 1. Instalar gh-pages
npm install --save-dev gh-pages

# 2. En package.json agregar:
#    "homepage": "https://TU_USUARIO.github.io/asj-clubes"
#    "predeploy": "npm run build"
#    "deploy": "gh-pages -d build"

# 3. Publicar
npm run deploy
```

---

## 📝 Cómo actualizar los datos

Los datos viven en `src/data/participantes.json` y `src/data/clubes.json`.  
Cuando actualicen el Excel, vuelvan a ejecutar el script de exportación:

```bash
python3 scripts/exportar_datos.py
```

---

## 👥 Equipo

Fundación ASJ — Área de Gestión de Participantes
