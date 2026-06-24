# Login con roles: superadmin, admin y cliente

## Resumen

Hoy la app tiene un único rol "admin" y la home pública es abierta. Vamos a sumar dos roles más (`superadmin` y `client`), un flujo de invitación, y un panel de cliente con su progreso. Nadie se registra solo: los admins crean los clientes y los superadmins crean a los admins.

## Roles y qué puede hacer cada uno

- **superadmin** (vos): todo lo que hace un admin + dar/quitar el rol admin y borrar cualquier usuario.
- **admin**: crear/editar/borrar rutinas y ejercicios, invitar clientes, aprobar/bloquear clientes, asignarles sexo y nivel, y dar/quitar admins.
- **client**: inicia sesión, ve su panel con progreso y solo las rutinas de su sexo. No ve el selector hombres/damas.
- **sin rol / bloqueado**: ve una pantalla "Tu cuenta está pendiente / bloqueada".

## Cambios en la base de datos

1. Agregar valores `'superadmin'` y `'client'` al enum `app_role`.
2. Nueva tabla `public.profiles` ligada a `auth.users`:
   - `user_id` (PK, FK a auth.users, on delete cascade)
   - `full_name`, `gender` (`hombres|damas|null`), `level` (default 1)
   - `status` (`pending|active|blocked`, default `active` para clientes creados por admin)
   - `invited_by` (uuid del admin que lo creó)
   - timestamps + trigger updated_at
3. Trigger `on_auth_user_created` que inserta un row vacío en `profiles` por cada nuevo `auth.users`.
4. Reemplazar `bootstrap_first_admin` por `bootstrap_first_superadmin`: el primer usuario que se registra recibe `superadmin` (y también `admin` para reutilizar policies existentes).
5. Nuevas funciones `security definer`:
   - `is_superadmin(uid)` y `is_admin_or_super(uid)` para usar en policies sin recursión.
6. Policies:
   - `profiles`: cada usuario ve/actualiza su propio profile (campos limitados). Admins ven/editan todos. Solo superadmin puede tocar `status` de otro admin.
   - `user_roles`: solo superadmin puede insertar/borrar `admin` o `superadmin`; admins pueden asignar `client`.
   - `routines` / `exercises`: lectura pública sigue igual; clientes activos pueden leer todo lo publicado (ya cubierto por la policy actual de `is_published`).
7. GRANTs correspondientes (`authenticated` para profiles, sin `anon`).

## Flujo de invitación de clientes

- El admin va a Admin → Clientes → "Invitar cliente". Ingresa email, nombre, sexo, nivel.
- Se llama a una edge function `invite-user` (usa `SUPABASE_SERVICE_ROLE_KEY`) que:
  1. Verifica que quien llama es admin.
  2. Llama `auth.admin.inviteUserByEmail(email)` → manda mail con link mágico.
  3. Inserta/actualiza `profiles` (gender, level, status=`active`, invited_by) y asigna rol `client` en `user_roles`.
- Misma función para "Invitar admin", pero requiere superadmin y asigna rol `admin`.
- Bloquear/desbloquear cliente = update directo de `profiles.status` desde el dashboard (cubierto por RLS, sin edge function).

## Cambios en el frontend

### Auth y ruteo
- `useAuth` ahora también expone `isSuperadmin`, `isClient`, `profile` y `status`.
- Nuevo `ProtectedRoute` genérico (`requireRole="admin" | "client" | "superadmin"`).
- Si el usuario está logueado pero `status='pending'` o `'blocked'`, mostrar pantalla bloqueante con botón "Cerrar sesión".

### Home pública (`/`)
- Si no hay sesión: pantalla landing breve con CTA "Iniciar sesión" (sin selector hombres/damas público — la app ahora es privada).
- Si hay sesión cliente activa: redirige a `/app`.
- Si hay sesión admin: redirige a `/admin`.

### Panel cliente (`/app`)
- Header con nombre del cliente + logout sutil.
- Card de "Tu progreso" mostrando días completados (lee los `localStorage` actuales por ahora; podemos migrar a DB después si querés).
- Selector de Nivel y Día (sin hombres/damas porque ya está fijado en el profile).
- Grid de ejercicios del nivel/día actual, igual que hoy, con check + celebración.

### Panel admin (`/admin`)
- Sidebar agrega ítem **Clientes** y mantiene **Rutinas** y **Administradores**.
- **Clientes**: tabla (nombre, email, sexo, nivel, estado, último acceso) con acciones: invitar, editar sexo/nivel, bloquear/activar, borrar.
- **Administradores**: solo visible para superadmin. Botones "Invitar admin", "Revocar admin", "Promover a superadmin" (este último solo para el primer superadmin). La pantalla actual que pide pegar UUID se reemplaza por invitación por email.
- **Rutinas**: queda como hoy.

### Index / data fetching
- `src/pages/Index.tsx` se parte: la lógica de selector hombres/damas se mantiene pero la home cliente la usa con el sexo fijado del profile.

## Detalles técnicos

- **Migración SQL en una sola call** con: enum nuevo, tabla profiles + grants + RLS + policies, trigger handle_new_user, funciones helper, ajuste de bootstrap, y reemplazo de policies de `user_roles` para soportar superadmin.
- **Edge function `invite-user`** (`verify_jwt = false`, validamos token en código): valida CORS, valida body con zod (`email`, `role: 'client'|'admin'`, `full_name?`, `gender?`, `level?`), verifica que el JWT del caller corresponde a admin/superadmin según el rol pedido, llama `supabaseAdmin.auth.admin.inviteUserByEmail` con `redirectTo` apuntando a `/reset-password`, y actualiza `profiles` + `user_roles`.
- **Configuración auth**: dejar signups públicos deshabilitados (`disable_signup: true`) porque todo es por invitación. Mantener email auth y agregar Google opcional (lo dejamos para después si no lo pedís ahora).
- **Migración del admin actual**: el script bootstrap garantiza que el primer registro siga siendo superadmin. Si ya hay admins, agregamos manualmente `superadmin` al user_id que indiques tras aprobar la migración.
- **Compatibilidad**: las policies actuales que usan `has_role(uid, 'admin')` siguen funcionando porque al superadmin también le asignamos rol `admin`.

## Orden de implementación

1. Migración (enum, profiles, triggers, policies, bootstrap).
2. Edge function `invite-user` + secret check (usa los secrets de Supabase ya existentes).
3. `useAuth` extendido + `ProtectedRoute` + pantalla "pending/blocked".
4. Reescritura de `/` (landing privada) y nueva ruta `/app` (panel cliente).
5. Nueva pantalla admin "Clientes" + refactor de "Administradores" con invitación por email.
6. Verificación con Playwright: login superadmin → invita admin → invita cliente → cliente entra y ve solo sus rutinas.

## Preguntas abiertas (las puedo asumir si no aclarás)

- Asumo `disable_signup = true` (nadie se registra solo). Si querés permitir auto-registro "pendiente" después, lo agregamos.
- Asumo que el progreso por día se sigue guardando en `localStorage` del navegador del cliente. Si querés que el admin vea el progreso real, hay que migrarlo a una tabla `client_progress`.
