
# Integrar logo G23 en la app

## Paso 1 — Subir el logo como asset CDN
Subir la imagen a Lovable Assets desde `/mnt/user-uploads/...` y guardar el pointer en `src/assets/logo-g23.png.asset.json`. Así se reutiliza en toda la app con una sola URL.

## Paso 2 — Usos del logo (siempre sobre fondo negro/ink)

1. **Login (`src/pages/Auth.tsx`)**
   - Agregar el logo centrado arriba del título dentro de la tarjeta. Como la tarjeta es blanca, envolverlo en un círculo/bloque `bg-ink` con padding para mantener fondo negro. Tamaño ~88px.
   - También un logo pequeño en el header negro superior (reemplaza/acompaña al "Volver").

2. **Admin sidebar (`src/pages/admin/AdminLayout.tsx`)**
   - El sidebar ya es `bg-ink`. Reemplazar/acompañar el texto "RUTINAS" por el logo (40–48px) + label "ADMIN/SUPERADMIN" debajo.
   - En el header móvil negro: logo pequeño (28px) al lado de "ADMIN".

3. **App cliente (`src/pages/Index.tsx`)**
   - Logo pequeño en el header de la app (donde hoy aparece "HOMBRES · NIVEL X · DÍA Y"). Solo si el header tiene fondo oscuro; si no, envolverlo en un chip negro redondeado.

4. **Pantalla de felicitación (`src/components/CompletionCelebration.tsx`)**
   - El componente ya tiene `bg-ink`. Mostrar el logo arriba del trofeo, o reemplazar el ícono del trofeo por el logo dentro del círculo amarillo (en este caso el fondo sería amarillo → no sirve porque "solo funciona en fondo negro"). 
   - Solución: mantener el trofeo amarillo y agregar el logo G23 como marca de agua/encabezado encima del bloque de texto, sobre el fondo negro existente (~64px, centrado).

## Detalles técnicos
- Componente reutilizable `src/components/BrandLogo.tsx` que renderiza `<img src={logo.url} alt="G23" />` con prop `size` y opcional `wrapDark` (envuelve en `bg-ink rounded-full p-2` cuando se usa sobre fondos claros).
- No tocar lógica de negocio ni rutas.
- Importar via `import logo from "@/assets/logo-g23.png.asset.json"`.

## Fuera de alcance
- No cambiar paleta, tipografía ni layouts existentes.
- No usar el logo sobre fondos claros sin el wrapper oscuro.
