
## Objetivo

Que cada día que el usuario termina quede grabado en su cuenta (no solo en el navegador) y que pueda ver su historial + un contador de días totales completados desde el menú.

## Qué se agrega

### 1. Nueva tabla en la base de datos: `completed_days`

Guarda cada vez que un usuario completa un día de rutina.

Campos relevantes:
- `user_id` — dueño del registro
- `routine_id` — a qué rutina pertenece
- `gender`, `level`, `day` — combinación completada (para poder mostrar historial aunque la rutina cambie)
- `routine_name` — copia del nombre en ese momento (así queda legible aunque la rutina se edite/borre)
- `completed_at` — fecha/hora de finalización

Reglas de acceso:
- Cada usuario ve, crea y borra solo sus propios registros.
- Los admins pueden ver los registros de todos (útil a futuro para seguimiento).
- Índice único por `(user_id, gender, level, day, fecha)` para no duplicar si el usuario reinicia y completa el mismo día dos veces en la misma jornada.

### 2. Guardado automático al completar el día

En la pantalla principal (`src/pages/Index.tsx`), cuando el progreso pasa a "todos los ejercicios marcados":
- Se sigue guardando el progreso en `localStorage` (para no perder marcados si recarga).
- Además se inserta un registro en `completed_days` una sola vez por día/rutina.
- Si el usuario reinicia el día con el botón de reset, el registro histórico queda (no se borra el pasado).

### 3. Nueva sección "Mi historial" en el menú lateral

Dentro del `Sheet` del menú (ícono ☰ arriba a la izquierda), se agrega un botón "Mi historial" que abre una vista con:

- **Resumen arriba:**
  - Total de días completados
  - Racha actual (días consecutivos con al menos un día completado)
  - Días completados este mes
- **Lista cronológica** (más reciente arriba) con:
  - Fecha (ej: "Lun 6 Ene")
  - Rutina + nivel + día (ej: "Hombres · Nivel 2 · Día 3")
  - Nombre de la rutina

Vacío: mensaje motivacional "Todavía no completaste ningún día. ¡Vamos!".

### 4. Indicador visual en la lista de días

En los "pills" de días del menú de filtros, marcar con un check chico los días que ya fueron completados alguna vez para esa rutina (opcional pero recomendado, poca fricción).

## Detalles técnicos

- Migración crea `public.completed_days` con RLS + GRANTs (`authenticated`, `service_role`) y policies:
  - SELECT: `auth.uid() = user_id` OR `is_admin_or_super(auth.uid())`
  - INSERT: `auth.uid() = user_id`
  - DELETE: `auth.uid() = user_id`
- Inserción desde el cliente usa `.upsert(..., { onConflict: 'user_id,gender,level,day,completed_date' })` con `completed_date` generado como columna `date` a partir de `completed_at`.
- Nuevo componente `src/components/HistorySheet.tsx` con la vista de historial (Sheet lateral o dialog).
- Se agrega link "Mi historial" dentro del menú existente en `Index.tsx`.
- Query de historial ordenada por `completed_at desc`, limitada a últimos 200 registros con scroll.
- Cálculo de racha y "este mes" en el cliente sobre los datos ya traídos.

## Fuera de alcance

- No se toca el flujo admin.
- No se migra el historial existente en `localStorage` (arranca desde cero al desplegar).
- No se agregan notificaciones ni recordatorios.
