# Control Ganadero Pro 🐄

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Control Ganadero Pro** es una plataforma web integral diseñada para la administración zootécnica, sanitaria, comercial y financiera de fincas y haciendas ganaderas. Integra en un solo entorno el monitoreo individual por arete/hierro, curvas de ganancia diaria de peso (GDP), rotación de potreros, mapas cartográficos interactivos y liquidación comercial en báscula.

---

## 📌 Módulos Principales

### 1. 🏷️ Gestión de Ganado & Hato
* Ficha técnica completa por animal: arete, nombre, hierro, raza, sexo, propósito (*Ceba, Cría, Leche, Reproductor*), estado (*Activo / Vendido / Baja*) y corral/potrero asignado.
* Historial de pesajes cronológicos con cálculo de ganancia acumulada y Ganancia Diaria de Peso (GDP en g/día).
* Trazabilidad mediante código QR único con visor y escáner integrado por cámara web o móvil.
* Ficha clínica veterinaria: registro de vacunas, desparasitaciones, tratamientos, exámenes y cirugías.

### 2. 🗺️ Mapa Cartográfico de la Finca (D3 Geo)
* Visualización vectorial de potreros y parcelas de pastoreo.
* Modos de inspección métrica:
  * **Densidad de cabezas**: Carga animal por potrero.
  * **Carga UGM**: Unidades de Gran Ganado por hectárea (UGM/ha) y capacidad de carga admisible.
  * **Estado de rotación**: Potreros en pastoreo, descanso, recuperación o mantenimiento.
  * **Biomasa estimada**: Estimación de forraje disponible en toneladas de materia verde.
* Drawer lateral con detalle del potrero, acceso a báscula de manga rápida y tratamientos colectivos.

### 3. ⚖️ Manga & Báscula Rápida
* Interfaz optimizada para el operario en corral y manga de trabajo.
* Pesaje individual ágil con comparación inmediata contra el último pesaje y alerta visual de desvío de GDP.
* Aplicación rápida de insumos en manga: vacunas de calendario, desparasitantes y condición corporal (BCS 1 a 5).
* Registro express de terneros y partos directamente en manga.

### 4. 🧬 Reproducción & Pedigree
* Control de servicios: monta natural e inseminación artificial con registro de pajilla/semental y técnico.
* Cálculo automático de fecha proyectada de parto (gestación de 283 días) y control de días abiertos.
* Árbol genealógico zootécnico de 3 generaciones (Padres, Abuelos paternos/maternos).

### 5. 🌿 Rotación de Potreros & Aforo
* Planificación de rotación rotacional intensiva y pastoreo Voisin.
* Registro de días de ocupación y descanso sugerido según especie forrajera (*Brachiaria, Guinea, Estrella, etc.*).
* Rotación en lote con un solo clic.

### 6. 📈 Valuación Comercial & Proyecciones de Crecimiento
* Tasación patrimonial en tiempo real del hato en pie según precios de mercado por categoría.
* **Modelo predictivo zootécnico a 3, 6 y 12 meses**:
  * Proyección de ganancia de peso a 90, 180 y 365 días ponderada por histórico real y raza.
  * Determinación automática de la **Ventana Óptima de Venta** (*Inmediata, Corto Plazo, Mediano Plazo, Levante*).
  * Simulador de régimen nutricional con ajuste de GDP (+/- 15% por suplementación o estacionalidad).

### 7. 🛒 Ventas & Liquidación Comercial
* Módulo especializado de ventas: selección de lotes comerciales de salida.
* Liquidación precisa en báscula con aplicación de porcentaje de merma por flete/desbaste.
* Emisión automática de **Acta Oficial de Liquidación y Venta en PDF** con numeración consecutiva, datos del comprador y firmas reglamentarias.
* Desincorporación automática del hato activo (traspaso a IAC) e impacto directo en el Libro Mayor Financiero.

### 8. 🚨 Alertas Sanitarias Inteligentes
* Detección preventiva de vacunas y desparasitaciones vencidas o próximas a vencer.
* Monitoreo de periodos de retiro sanitario (leche y carne) tras aplicación de antibióticos y fármacos.
* Alerta de partos inminentes y tareas veterinarias pendientes.

### 9. 📑 Generación de Reportes PDF Oficiales
* **Dossier Clínico y Pasaporte Sanitario**: Formato oficial para movilización, ferias ganaderas y entidades sanitarias (ICA).
* **Acta de Liquidación Comercial**: Soporte contable y de compraventa de ganado en pie.
* **Informe Técnico de Proyecciones de Crecimiento**: Estimación patrimonial y proyecciones de peso para entidades bancarias o inversionistas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion) |
| **Visualización** | D3.js (Cartografía y Geometría), Recharts (Curvas de peso y crecimiento) |
| **Herramientas de Documentación** | jsPDF & jsPDF-AutoTable (Generación de expedientes PDF con firmas y membretes) |
| **Trazabilidad & Captura** | jsQR (Lector óptico de códigos en manga), qrcode.react (Generador de aretes QR) |
| **Backend & Servidor** | Node.js, Express, tsx (Entorno TypeScript nativo), Vite 6 |
| **Iconografía** | Lucide Icons |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js** v18+ o v20+
* **npm** v9+ (o `pnpm` / `bun`)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/llir0/Control-Ganadero.git
   cd Control-Ganadero
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor iniciará en `http://localhost:3000`.

5. **Construir para producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/            # Módulos y componentes de interfaz
│   │   ├── AnimalCard.tsx                # Tarjeta visual con acciones rápidas
│   │   ├── AnimalDetailModal.tsx         # Ficha individual completa y edición
│   │   ├── CommercialSalesView.tsx       # Módulo especializado de ventas y facturación
│   │   ├── CommercialValuationView.tsx   # Valuación patrimonial y proyecciones a 3, 6, 12m
│   │   ├── FarmMapD3View.tsx             # Mapa vectorial cartográfico de potreros
│   │   ├── MangaChuteModeView.tsx        # Modo báscula rápida para operarios
│   │   ├── PastureRotationView.tsx       # Planificador de aforo y rotaciones
│   │   ├── ReproductionPedigreeView.tsx  # Registro reproductivo y genealogía
│   │   ├── SmartAlertsDashboardPanel.tsx # Panel de alertas sanitarias
│   │   └── ...
│   ├── lib/                   # Lógica zootécnica, cálculos y persistencia
│   │   ├── pdfExport.ts                  # Motor de generación de reportes oficiales PDF
│   │   ├── projections.ts                # Algoritmo de GDP y proyecciones de peso
│   │   ├── smartAlerts.ts                # Detección de alertas de sanidad y retiros
│   │   └── storage.ts                    # Almacenamiento local estructurado y bitácora
│   ├── types.ts               # Modelos de datos TypeScript (Animal, Paddock, etc.)
│   ├── App.tsx                # Contenedor principal y enrutamiento de módulos
│   └── index.css              # Estilos globales y Tailwind CSS
├── server.ts                  # Servidor Express con Vite middleware para SSR/Dev
├── vite.config.ts             # Configuración de compilación Vite
├── tsconfig.json              # Configuración de TypeScript
└── package.json               # Dependencias y scripts de ejecución
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
