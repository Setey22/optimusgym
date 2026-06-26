## Qué está pasando

Hay dos cosas distintas mezcladas:

**1. El link de "restablecer contraseña" lleva al editor de Lovable, no a tu app.**

Cuando estás navegando en el preview (`id-preview--...lovable.app`) y pedís "recuperar contraseña", el código manda como URL de retorno `window.location.origin`, que en ese momento es el dominio del preview de Lovable. Ese dominio está protegido por el login de Lovable, así que si el usuario tiene cuenta de Lovable (como `hygaluads@gmail.com`) cae adentro del editor, y si no la tiene le pide login de Lovable. Nunca llega a la pantalla de `/reset-password` de tu app publicada (`optimusgym.lovable.app`).

Lo mismo pasa con el email de invitación que manda la edge function `invite-user`: usa el `origin` del que invita, así que si invitás desde el preview, el invitado recibe un link al preview.

**2. `eze106more@gmail.com` todavía no tiene rol de admin.**

Hay que invitarlo / asignarle el rol.

## Solución propuesta

### A) Forzar que los emails de auth siempre apunten al dominio público de la app

Definir una constante `PUBLIC_APP_URL = "https://optimusgym.lovable.app"` y usarla en lugar de `window.location.origin` en:

- `src/pages/Auth.tsx` → `resetPasswordForEmail(..., { redirectTo: PUBLIC_APP_URL + "/reset-password" })`
- `src/pages/Auth.tsx` → `signUp(..., { emailRedirectTo: PUBLIC_APP_URL + "/admin" })`
- `supabase/functions/invite-user/index.ts` → `redirectTo: PUBLIC_APP_URL + "/reset-password"` (en vez de leer del header `origin`)

Así, sin importar desde dónde se mande el email (preview, editor, o app), el link siempre cae en `https://optimusgym.lovable.app/reset-password`, que es público y no pide login de Lovable.

> Nota: además hay que asegurarse de que en la configuración de Auth de Lovable Cloud, esa URL esté permitida como Redirect URL. Te aviso si hace falta agregarla manualmente.

### B) Dar admin a `eze106more@gmail.com`

Dos opciones, vos elegís en el chat después de aprobar este plan:

- **Si todavía no tiene cuenta en la app:** lo invitamos desde el panel `/admin/admins` (vos como superadmin) — al aprobar el plan te explico el paso a paso, no hace falta tocar código.
- **Si ya creó cuenta o querés que quede asignado ya mismo sin esperar a que confirme:** corro una migración / insert puntual que cree el `profile` activo y le asigne el rol `admin` directamente por SQL.

### C) Sobre `hygaluads@gmail.com`

Una vez aplicado (A), el link de recuperación va a llevar a `optimusgym.lovable.app/reset-password` y ahí sí va a poder elegir nueva contraseña sin que Lovable se meta en el medio. No hay que hacer nada especial con ese email aparte de pedir un nuevo link de recuperación después del fix.

## Archivos a tocar

- `src/lib/config.ts` (nuevo) — exporta `PUBLIC_APP_URL`.
- `src/pages/Auth.tsx` — usar `PUBLIC_APP_URL` en redirectTo.
- `supabase/functions/invite-user/index.ts` — usar `PUBLIC_APP_URL` en redirectTo.
- (Opcional, según tu respuesta sobre eze) migración SQL o invitación desde el panel.

## Lo que necesito que me confirmes antes de implementar

1. ¿`eze106more@gmail.com` ya tiene cuenta creada en la app, o lo invito de cero?
2. ¿Confirmás que `https://optimusgym.lovable.app` es el dominio público "oficial" al que querés que vayan todos los emails? (Si más adelante ponés dominio propio tipo `optimusgym.com`, se cambia ahí nomás.)
