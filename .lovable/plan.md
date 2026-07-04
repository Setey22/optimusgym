## Problema

Los espacios publicitarios no se pueden gestionar bien:
1. Las policies de la tabla `ads` y del bucket `ad-images` sólo permiten al rol `admin`. Si el usuario es `superadmin` sin `admin`, la subida y el guardado fallan silenciosamente.
2. Al subir una imagen no se normaliza al formato de la tarjeta (16:9), así que quedan imágenes con proporciones raras.
3. Al eliminar un espacio no se borra el archivo del bucket (queda basura).

## Cambios

### 1. Permisos (migración)
Reemplazar las policies para aceptar `admin` **o** `superadmin` usando la función ya existente `public.is_admin_or_super(auth.uid())`:

- `public.ads`:
  - SELECT pública: `is_active = true OR public.is_admin_or_super(auth.uid())`
  - ALL admins/superadmins: `public.is_admin_or_super(auth.uid())`
- `storage.objects` bucket `ad-images`: INSERT / UPDATE / DELETE permitidos si `is_admin_or_super(auth.uid())`. SELECT pública queda igual.

### 2. Normalizar imagen a 16:9 al subir
En `AdsManager.tsx`, antes de llamar a `uploadFile`, procesar el `File` con un canvas: recorte centrado (`object-cover`-style) a 1600×900 y export a JPEG calidad 0.85. Así todas las imágenes coinciden con el formato de la tarjeta y pesan menos.

Se hace inline en `AdsManager` (no toca `ImageUploader` que se usa en otras pantallas). El flujo:
- input file → `normalizeTo16x9(file)` → `uploadFile(bucket, normalizedFile)` → guardar path en `ads.image_url`.
- Reemplazo del `ImageUploader` genérico por un uploader propio del manager con este preproceso y un botón visible de "Eliminar imagen".

### 3. Borrar archivo al eliminar espacio
En `deleteAd`: antes del `delete` en la tabla, si `ad.image_url` existe, llamar `removeFile("ad-images", ad.image_url)`. Igual al reemplazar imagen (ya lo hace `ImageUploader`, se replica en el nuevo uploader).

### 4. Feedback de errores
Mostrar el mensaje real del `error` de Supabase (ya está en `toast.error`) y además loggear en consola para debug. Añadir un `toast` explícito cuando falla la subida por permisos.

## Archivos afectados

- **Nueva migración** con las policies corregidas de `public.ads` y `storage.objects` (drop + create).
- `src/pages/admin/AdsManager.tsx`: uploader propio con recorte 16:9, borrado de archivo al eliminar/reemplazar, mejor manejo de errores.

## Fuera de alcance
- Cambiar `ImageUploader` global.
- Métricas o vencimiento.
