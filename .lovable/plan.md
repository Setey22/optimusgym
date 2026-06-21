# Plan: Panel de admin y gestión de rutinas

## 1. Cambios en la interfaz pública

- Eliminar el botón hamburguesa y el `SideMenu` del header en `src/pages/Index.tsx`.
- En su lugar, en la esquina derecha del header: botón **"Iniciar sesión"** (si no hay sesión) o **"Admin"** + **"Salir"** (si hay sesión admin).
- Mantener los controles actuales de Grupo (Hombres/Damas), Nivel (1–7) y Día.
- El selector de Día se vuelve dinámico: muestra solo la cantidad de días configurada para la rutina activa (1 a 5).
- Las tarjetas de ejercicios se leen desde la base de datos (no del archivo mock). Si no hay rutina cargada para esa combinación, mostrar estado vacío amable.
- Cada tarjeta sigue mostrando: foto de portada, número, nombre, tip, y botón play que abre el video (YouTube embed o archivo subido).

## 2. Login (solo admin)

- Habilitar Lovable Cloud (backend, auth, storage).
- Login por **email + contraseña** en `/auth`.
- Sin registro público: el primer admin se crea manualmente; nuevos admins solo se agregan desde el panel.
- Rol `admin` en tabla `user_roles` aparte (nunca en profiles), validado server-side con función `has_role`.
- Ruta `/admin` protegida: redirige a `/auth` si no hay sesión o si no tiene rol admin.

## 3. Modelo de datos

```text
routines
  id, gender ('hombres'|'damas'), level (1-7),
  name, description, cover_image_url,
  days_count (1-5), is_published, sort_order, timestamps
  UNIQUE (gender, level)  -- una rutina por combinación

exercises
  id, routine_id (FK), day (1-5), position (orden),
  title, tip,
  cover_image_url,
  video_type ('youtube'|'upload'|'none'),
  youtube_id (nullable),
  video_url (nullable, path en storage),
  timestamps

user_roles
  id, user_id (FK auth.users), role ('admin')
```

- RLS:
  - `routines` y `exercises`: SELECT público solo si `is_published=true`; INSERT/UPDATE/DELETE solo admin.
  - `user_roles`: solo lectura para el propio usuario y admins; modificación solo admin.
- Storage buckets públicos: `routine-covers`, `exercise-covers`, `exercise-videos`. Subida solo admin (policies en `storage.objects`).

## 4. Panel admin (`/admin`)

Layout: sidebar con "Rutinas" y "Administradores", contenido a la derecha.

- **Lista de rutinas**: tabla con género, nivel, nombre, días, publicada, acciones (editar/eliminar). Botón "Nueva rutina".
- **Editor de rutina** (`/admin/routines/:id`):
  - Campos: nombre, descripción, género, nivel, días (1–5), publicada, imagen de portada (subir/cambiar).
  - Tabs por día (Día 1 … Día N según `days_count`).
  - Dentro de cada día: lista ordenable de ejercicios con thumbnail, título, tip, badge del tipo de video.
  - Editor de ejercicio (modal o panel lateral): título, tip, imagen de portada (subir), tipo de video:
    - **YouTube**: campo para link o ID (parseado a ID, recomendamos "no listado").
    - **Subida directa**: input file → sube a bucket `exercise-videos`.
    - **Ninguno**.
  - Reordenar ejercicios (drag o flechas) actualiza `position`.
- **Administradores**: listar usuarios con rol admin, agregar admin por email (busca usuario existente y le asigna rol), revocar.

## 5. Reproducción de video en la app pública

- Click en play abre un dialog con:
  - YouTube → `<iframe>` embed (`youtube-nocookie.com/embed/{id}`).
  - Upload → `<video controls>` apuntando a la URL pública del bucket.

## 6. Notas técnicas

- Stack: React + Vite + Tailwind + shadcn ya existentes; React Router para `/`, `/auth`, `/admin`, `/admin/routines/:id`.
- Validación de formularios con `zod` + `react-hook-form`.
- `react-query` para data fetching/caché.
- Mantener paleta y tipografía actuales (negro/amarillo/blanco, Oswald/Inter).
- El archivo mock `src/data/routines.ts` queda solo como fallback inicial / seed opcional; la fuente real de datos pasa a ser la base.

## 7. Entregables

1. Migraciones SQL (tablas, RLS, grants, función `has_role`, enum `app_role`).
2. Buckets de storage y policies.
3. Páginas `/auth`, `/admin`, `/admin/routines/:id`.
4. Componentes: `ProtectedAdminRoute`, `RoutineForm`, `ExerciseForm`, `VideoPlayerDialog`, `ImageUploader`.
5. Header actualizado sin hamburguesa, con botón de login/admin.
6. `Index.tsx` leyendo rutinas desde la base.

## 8. Pendientes para confirmar luego de aprobar el plan

- Email del primer admin (para asignarle el rol después del primer signup).
- Si querés que las rutinas no publicadas se vean en preview para el admin logueado.