
## Objetivo

Permitir que los admins carguen y gestionen hasta **3 espacios publicitarios** que aparecen al final de la lista de ejercicios. Cada espacio tiene una imagen rectangular, un link y una audiencia (hombres, damas o ambos).

## Cómo lo verá el usuario final

Debajo del último ejercicio del día, aparece una sección discreta con el título **"ESPACIOS"** (mismo estilo minimal del resto) y hasta 3 tarjetas rectangulares con la imagen del anunciante. Al tocarlas abren el link en una pestaña nueva. Sólo se muestran los espacios que coincidan con el grupo del usuario (hombres/damas) y que estén activos.

## Cómo lo gestionará el admin

Nueva entrada en el sidebar del admin: **"Espacios"** (`/admin/ads`). Una pantalla simple con una lista de hasta 3 slots. Cada fila permite:

- Subir/reemplazar imagen (bucket nuevo `ad-images`, público de lectura)
- Editar el link (URL destino)
- Elegir audiencia: **Hombres / Damas / Ambos**
- Toggle **Activo**
- Reordenar (posición 1, 2, 3)
- Borrar

Si hay 3 activos, el botón "Agregar" queda deshabilitado.

## Detalles técnicos

### Base de datos (migración)

Tabla nueva `public.ads`:
```
id uuid pk default gen_random_uuid()
image_url text not null
link_url text not null
audience text not null check (audience in ('hombres','damas','both'))
is_active boolean not null default true
position smallint not null default 1  -- 1..3
created_at, updated_at timestamptz
```

Trigger `set_updated_at`. Sin FK a usuarios.

Grants + RLS:
- `GRANT SELECT ON public.ads TO anon, authenticated`
- `GRANT ALL ON public.ads TO authenticated, service_role` (admin escribe autenticado)
- Policy SELECT pública: `is_active = true OR has_role(auth.uid(),'admin')`
- Policy ALL admins: `has_role(auth.uid(),'admin')`

Límite de 3 filas: se enforza en el cliente admin (chequeo de count antes de insertar) + índice único parcial opcional sobre `position` para evitar duplicados.

### Storage

Bucket nuevo `ad-images` **público** (se crea con `supabase--storage_create_bucket`). Policies: lectura pública, escritura sólo admins autenticados. Reutilizar el patrón de `ImageUploader.tsx`.

### Frontend

**Nuevo:** `src/pages/admin/AdsManager.tsx` — CRUD simple estilo tabla/tarjeta usando `ImageUploader`, `Input`, `Select` (audiencia), `Switch` (activo).

**Nuevo:** `src/components/AdsSection.tsx` — fetch de `ads` filtrado por `is_active` y audiencia (`audience = 'both' OR audience = <gender>`), ordenado por `position`. Renderiza tarjetas con `aspect-[16/9]` (o similar), imagen full-cover y link externo (`target="_blank" rel="noopener"`).

**Edits:**
- `src/App.tsx`: nueva ruta `/admin/ads` → `AdsManager`
- `src/pages/admin/AdminLayout.tsx`: nuevo `NavItem` con icono (`Megaphone` de lucide) apuntando a `/admin/ads`
- `src/pages/Index.tsx`: al final del `<main>`, después del listado de ejercicios (dentro del bloque cuando hay `routine` y ejercicios), montar `<AdsSection gender={gender} />`. Se muestra independientemente del estado de completado del día.

### Fuera de alcance
- Métricas/impresiones/clicks
- Vencimiento por fecha (se puede sumar después con campo `expires_at`)
- Rotación aleatoria (por ahora orden fijo por `position`)

## Archivos afectados

- Migración nueva (tabla `ads` + policies + grants + trigger)
- Bucket storage `ad-images` + policies
- `src/pages/admin/AdsManager.tsx` (nuevo)
- `src/components/AdsSection.tsx` (nuevo)
- `src/App.tsx` (ruta)
- `src/pages/admin/AdminLayout.tsx` (nav item)
- `src/pages/Index.tsx` (montar sección)
