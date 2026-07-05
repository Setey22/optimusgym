## Diagnóstico

El "TypeError: Failed to fetch" no es un problema de permisos ni de backend. En los network logs se ve que:

1. La subida de la imagen al bucket `ad-images` devuelve **200 OK**.
2. Inmediatamente después, el `PATCH /rest/v1/ads?id=eq...` que guarda la nueva `image_url` en la fila falla con `Failed to fetch` (la request ni siquiera llega al servidor).
3. El siguiente `GET /rest/v1/ads` funciona bien.

**Causa real: un bloqueador de anuncios (uBlock Origin, AdBlock, Brave Shields, DNS pi-hole, etc.) está bloqueando cualquier URL que contenga `/ads`.** Es una regla de filtro clásica de las listas EasyList. Por eso:
- La subida al bucket `/storage/v1/object/ad-images/...` pasa (la palabra completa es `ad-images`, no matchea).
- El `PATCH` a `/rest/v1/ads?...` se cancela en el navegador antes de salir → `Failed to fetch`.

Resultado: la imagen queda subida al storage pero la fila de `ads` nunca se actualiza, así que la tarjeta sigue mostrándose vacía.

## Solución propuesta

Renombrar la tabla `ads` a un nombre que los bloqueadores no filtren, por ejemplo **`promo_slots`**. Es el fix definitivo; cualquier otra alternativa (proxy, edge function, renombrar campos) no evita que el filtro bloquee la URL.

### Cambios

1. **Migración**
   - `ALTER TABLE public.ads RENAME TO promo_slots;`
   - Recrear las policies con los nuevos nombres (mismas reglas: SELECT si `is_active` o `is_admin_or_super`; ALL si `is_admin_or_super`).
   - Mantener `ad-images` como bucket (el nombre del bucket no lo bloquean los filtros porque no matchea `/ads` como segmento).
   - Opcional: renombrar el bucket también a `promo-images` para máxima seguridad. Recomiendo hacerlo por consistencia y para evitar sorpresas con filtros más agresivos.

2. **Frontend**
   - `src/pages/admin/AdsManager.tsx`: cambiar `.from("ads")` → `.from("promo_slots")` y `BUCKET = "promo-images"`.
   - `src/components/AdsSection.tsx`: mismo reemplazo en la query pública.
   - Mantengo los nombres de componentes/rutas internas (`AdsManager`, `/admin/ads`) porque son solo strings del cliente y no viajan al servidor — pero si querés te lo cambio también.

3. **Types**
   - `src/integrations/supabase/types.ts` se regenera automático después de la migración.

### Alternativa mínima (si preferís no renombrar)

Documentar en el panel de admin que hay que desactivar el bloqueador para el dominio del preview. No lo recomiendo: los usuarios finales admin también van a chocar con esto.

## Fuera de alcance
- Cambiar la UI, layout o lógica de recorte 16:9 (ya funciona).
- Tocar `ImageUploader` global.

¿Voy con el rename completo (`ads` → `promo_slots`, `ad-images` → `promo-images`)?
