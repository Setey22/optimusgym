# Diagnóstico real

Verifiqué directamente contra el proyecto Supabase `zicurmdhggnqcxsskhtq` (el mismo al que apunta `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` del `.env`). La conexión de Lovable **es la correcta**. El problema es otro:

### 1. La base está prácticamente vacía
Resultado de la consulta de verificación que pediste:

```
id                                   | name          | gender  | level | is_published | ejercicios_dia_1
1f61b3b1-b5da-41e3-b971-e91ceb46830c | Nueva rutina  | hombres | 1     | true         | 0
```

- Hay **1 sola rutina** (creada desde el admin, llamada "Nueva rutina", `days_count = 1`).
- La tabla `public.exercises` está **vacía** (0 filas en total).
- Los 13 ejercicios que decís haber cargado **no están en este proyecto**. O el SQL se corrió contra otra base, o falló silenciosamente, o se hizo sobre otra `routine_id`.

### 2. La columna `repetitions` no existe
`information_schema.columns` para `public.exercises` devuelve:
`id, routine_id, day, position, title, tip, cover_image_url, video_type, youtube_id, video_url, created_at, updated_at`.

No hay `repetitions`. Por eso:
- El front (`Index.tsx`) y el admin (`RoutineEditor.tsx` / `ExerciseEditor.tsx`) ya leen/escriben `ex.repetitions`, pero **cualquier INSERT/UPDATE que incluya `repetitions` falla** con error de columna inexistente.
- En la app pública no se ve nada de "4 x 15" porque ni la columna ni los datos existen.

### 3. RLS y permisos están OK
- `routines`: lectura pública si `is_published = true`, admins gestionan todo.
- `exercises`: lectura pública si la rutina padre está publicada, admins gestionan todo.
- GRANTs presentes para `anon`, `authenticated`, `service_role`.
- Los network logs confirman 200 OK en `/rest/v1/routines` y `/rest/v1/exercises` — devuelven `[]` simplemente porque no hay filas.

### 4. Conclusión
No hay bug de conexión, ni de RLS, ni de keys, ni de código de consulta. Faltan dos cosas concretas: **la columna `repetitions`** y **los 13 ejercicios reales**.

---

# Plan de corrección

### Paso A — Migración: agregar columna `repetitions`
```sql
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS repetitions text;
```
Con esto el admin puede guardar/editar ejercicios sin error, y el front muestra el bloque amarillo "Repeticiones" cuando hay valor.

### Paso B — Cargar los 13 ejercicios de Hombres / Nivel 1 / Día 1
Acá necesito tu ayuda porque no tengo el contenido real. Dos opciones:

1. **Pegame el SQL** (o la lista título + repeticiones + tip + video) de los 13 ejercicios y los inserto vía `supabase--insert` apuntando al `routine_id = 1f61b3b1-b5da-41e3-b971-e91ceb46830c`.
2. **Los cargás desde el panel admin** (`/admin` → la rutina ya existe) una vez aplicada la migración del Paso A.

### Paso C — Verificación final
Después de A + B vuelvo a correr la consulta esperada y confirmo:
- 1 rutina publicada para hombres nivel 1.
- `ejercicios_dia_1 = 13`.
- En `/` con HOMBRES + Nivel 1 se ven las 13 tarjetas con su campo "Repeticiones".
- En `/admin` el guardado de un ejercicio con `repetitions` no devuelve error.

---

**Necesito que me confirmes:**
- ¿Avanzo con el Paso A (migración de `repetitions`) ahora?
- Para el Paso B, ¿me pasás el SQL/datos de los 13 ejercicios o preferís cargarlos vos por el admin?
