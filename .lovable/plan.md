## Objetivo

Agregar un gráfico tipo calendario en la vista "Mi historial" para que el usuario vea de un vistazo qué días asistió, pudiendo navegar entre meses con flechas. Los días completados se marcan con una estrella ⭐.

## Qué se agrega

### 1. Nuevo bloque "Calendario" dentro de `HistorySheet`

Se ubica arriba de la lista cronológica (debajo de las estadísticas Totales / Racha / Este mes).

Contenido:
- **Encabezado del mes** con flechas a los costados:
  - `‹`  **Enero 2026**  `›`
  - Flecha izquierda: mes anterior.
  - Flecha derecha: mes siguiente (deshabilitada si sería un mes futuro respecto a hoy).
- **Fila de nombres de días**: L M M J V S D (semana empieza en lunes).
- **Cuadrícula de días del mes** (6 filas × 7 columnas):
  - Cada celda muestra el número del día.
  - Si el usuario completó al menos un día ese día → se superpone una estrella ⭐ (emoji) y la celda se resalta (fondo amarillo suave).
  - El día de hoy tiene un borde destacado.
  - Los días fuera del mes actual se muestran en gris tenue (relleno para completar la grilla).
- **Contador debajo del calendario**: "X días este mes con actividad".

### 2. Comportamiento

- Al abrir el sheet, el mes visible es el mes actual.
- Los datos usados son los mismos `rows` que ya trae `HistorySheet` desde `completed_days` (no se hace query extra).
- Se calcula un `Set<string>` con las fechas (formato `YYYY-MM-DD`) que tienen al menos un registro, para lookup O(1) por celda.
- Cambiar de mes es puramente cliente, no dispara nuevas queries.

### 3. Estética

- Usa los tokens del proyecto (`bg-surface`, `bg-yellow`, `text-ink`, `border-border`).
- Celdas cuadradas, tipografía display para el número, estrella emoji encima a la derecha.
- Consistente con el estilo del resto del sheet (bordes redondeados, uppercase tracking en labels).

## Detalles técnicos

- Se modifica solo `src/components/HistorySheet.tsx`.
- Nuevo subcomponente interno `MonthCalendar({ rows })` que maneja su propio `useState<Date>` para el mes visible.
- Helpers locales:
  - `monthKey(date)` → `YYYY-MM`
  - `dayKey(date)` → `YYYY-MM-DD`
  - `buildMonthGrid(year, month)` → arreglo de 42 celdas `{ date, inMonth }` empezando por lunes.
- El set de días completados se deriva con `useMemo` a partir de `rows` (una sola vez).
- La flecha "siguiente" se deshabilita si `visibleMonth >= startOfMonth(today)`.
- Sin cambios en la base de datos ni en `Index.tsx`.

## Fuera de alcance

- No se agrega vista anual ni heatmap tipo GitHub.
- No se permite tocar una celda para ver detalle del día (se puede sumar más adelante).
- No se cambia el guardado de `completed_days`.
