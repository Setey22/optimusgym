## Qué se cambia

Solo frontend, en `src/pages/Index.tsx` y la tarjeta `ExerciseCard`. No se toca la base de datos.

### 1. Texto de las repeticiones
Reviso las tarjetas: ya no aparece la palabra "Repeticiones", solo el valor dentro de la píldora amarilla (ej. `5 min`, `4 x 20 seg`, `4 x 12`). Se mantiene tal cual, sin etiqueta.

### 2. Check por ejercicio
- Cada tarjeta suma un botón circular de check arriba a la derecha (sobre la imagen) y un estado "Hecho" cuando está marcado.
- Al marcar, la tarjeta baja levemente la opacidad y muestra un tilde verde, sin ocultar el contenido.
- Tap en el check no dispara el play del video.

### 3. Barra de progreso del día
- Encima de la grilla aparece una barra fina con `X de N completados` y porcentaje.
- Avanza en tiempo real al marcar / desmarcar.
- Botón sutil "Reiniciar día" al lado para limpiar los checks del día actual.

### 4. Felicitación al completar
- Cuando todos los ejercicios del día quedan marcados, aparece un cartel (banner sticky arriba de la grilla) con un mensaje tipo "¡DÍA COMPLETADO!" y un emoji/ícono.
- Una sola vez por sesión por día se dispara un `toast` celebratorio para no ser invasivo.

### 5. Persistencia
- Se guarda en `localStorage` con clave `optimus:progress:{gender}:{level}:{day}` un array con los IDs marcados.
- Al cambiar género / nivel / día, el progreso se carga del storage de esa combinación (cada día tiene su propio progreso, no se mezcla).
- No requiere login ni base de datos.

## Detalles técnicos

- Nuevo hook local `useDayProgress(gender, level, day, exerciseIds)` en el mismo archivo que devuelve `{ done: Set<string>, toggle, reset, allDone, count, total }`.
- `ExerciseCard` recibe `done` y `onToggle` por props.
- Uso del componente `Progress` ya existente en `src/components/ui/progress.tsx` y `toast` de `sonner` (ya usado en admin).
- Sin cambios de esquema, migraciones, ni RLS.