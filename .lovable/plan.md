# Rediseño lista de ejercicios (dirección "% grande + sello")

Solo cambia el área de la lista de ejercicios y su barra de progreso en `src/pages/Index.tsx`. No toco lógica, ni datos, ni auth, ni admin.

## Cambios

### 1. Header sticky de sesión (nuevo bloque debajo del nav actual)
- Fondo `bg-ink` negro, texto blanco.
- Izquierda: label chico "ENTRENAMIENTO HOY" + fecha de hoy en español (ej: **MIÉ 01 JUL**) usando `toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })` en mayúsculas.
- Derecha: `%` grande en amarillo (`text-yellow`) y debajo `8 / 12 EJERCICIOS`.
- Barra de progreso fina (`h-1.5`) amarilla sobre track oscuro, ancho = %.
- Reemplaza el bloque de progreso actual (el que está sobre las cards).

### 2. Filas de ejercicio (reemplaza `ExerciseCard` grid)
- Lista vertical de filas full-width (sin grid).
- Estructura por fila: `[barra lateral 1.5px color] [contenido] [botón HECHO ancho 96px]`.
- Contenido: número `#08` chico + ícono play chiquito (abre video si `video_type !== 'none'`), título en display uppercase bold, chip amarillo con `repetitions`.
- Barra lateral: amarilla si pendiente, gris si hecha.
- Botón derecho HECHO: check grande + label "HECHO". Toggle del estado. Fondo `stone-50` normal, se pone amarillo al presionar.
- Estado completado: fila con opacity + `line-through` en el título + sello rotado "COMPLETADO" con borde y `mix-blend-multiply`.

### 3. Se remueve/oculta
- Aspect-video con imagen cover del ejercicio (ya no es card visual).
- Botón play gigante centrado.
- Tip largo (se oculta en el rediseño para mantener minimal; el ícono play sigue disponible).

## Detalles técnicos

- Fecha: `new Date().toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()`.
- Se mantienen: hooks `useDayProgress`, `toggle`, `reset`, `VideoPlayerDialog`, `CompletionCelebration`, `EmptyState`, `ErrorState`, filtros del Sheet.
- Colores por tokens ya existentes (`bg-ink`, `text-yellow`, `bg-yellow`, `border-border`, `bg-surface`). No hardcodeo hex nuevos.
- El botón "Reiniciar" del día se mueve como texto chico al costado del conteo en el header sticky.

## Archivo a editar

- `src/pages/Index.tsx` — reescribir el header de progreso y el bloque de `dayExercises` (reemplazar `ExerciseCard` por `ExerciseRow`).
