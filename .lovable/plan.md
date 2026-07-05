## Diagnóstico

El bucket `promo-images` se creó como **privado**. En `AdsSection` y `AdsManager` las imágenes se muestran con `publicUrl(...)`, que arma la URL `/storage/v1/object/public/promo-images/...`. Ese endpoint solo devuelve el archivo si el bucket está marcado como público — la RLS policy de SELECT no alcanza. Por eso la imagen no carga aunque no haya adblock.

(El bucket viejo `ad-images` estaba en la misma situación, pero por casualidad la subida fallaba antes de mostrarla, así que no se notaba.)

## Fix

Marcar `promo-images` como público con `supabase--storage_update_bucket`. Las policies que ya escribí siguen protegiendo escritura/borrado a admins/superadmins; solo la lectura pasa a ser abierta, que es lo que queremos para servir las imágenes en la web.

Si el workspace bloquea buckets públicos, aviso y armamos un fallback con signed URLs.

Sin cambios de código.
