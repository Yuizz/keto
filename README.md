# Ruta Keto — PWA offline

Tracker diario de constancia, menús y lista del súper para dieta keto.
Funciona **sin internet** tras la primera carga y guarda todo en el dispositivo.

## Correr en local

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build de producción

```bash
npm run build        # genera /dist (base /keto/ para GitHub Pages)
npm run preview      # sirve /dist para probar la PWA (service worker activo)
```

Sirve la carpeta `dist/` con cualquier static host (nginx, Caddy, Dokploy,
Netlify, etc.). En HTTPS o en `localhost` el service worker se registra solo
y la app queda instalable ("Agregar a pantalla de inicio").

### Base path

El sitio asume que vive en un subdirectorio `/keto/` (GitHub Pages de
proyecto). Para servir desde la raíz de un dominio propio, pásalo al build:

```bash
BASE="/" npm run build
```

## Deploy en GitHub Pages (automático)

El repo incluye `.github/workflows/deploy.yml`: cada push a **`master`** hace
build y publica `dist/` en GitHub Pages. Queda en:

```
https://yuizz.github.io/keto/
```

**Activación (una sola vez):** en GitHub → **Settings → Pages → Build and
deployment → Source: GitHub Actions**. Tras el primer deploy la PWA es
instalable y funciona offline.

## Cómo logra el offline

- **vite-plugin-pwa** (Workbox) precachea todo el bundle JS/CSS/fuentes/iconos,
  configurado en `vite.config.js` (`registerType: "autoUpdate"`). Abre sin red
  después de la primera visita.
- **Fuentes locales** vía `@fontsource/fraunces` y `@fontsource/inter`,
  importadas en `src/main.jsx`. No hay llamadas a Google Fonts.
- **Persistencia** en `localStorage` bajo la llave `keto:tracker:v1`
  (ver `src/App.jsx`, hooks de load/save). Sin backend ni red.
- **Respaldo exportable**: en la pestaña *Constancia* → tarjeta **Respaldo**
  puedes **exportar** todo tu progreso a un `.json` e **importarlo** en otro
  dispositivo. Sin nube ni cuenta; el archivo es tuyo.

## Estructura

```
index.html
vite.config.js          # config PWA + manifest
src/
  main.jsx              # entry, importa fuentes locales
  App.jsx               # toda la app (datos del plan + UI)
  index.css            # reset global
public/
  icon-192.png / icon-512.png / icon-maskable.png / favicon.svg
```

## Modelo de datos (localStorage `keto:tracker:v1`)

```jsonc
{
  "days": {
    "2025-06-14": {
      "aguaDespertar": true, "licuado": true,
      "desayuno": true, "comida": false, "cena": false,
      "omega3": true, "multivit": true,
      "refrigerio": false, "mineralSal": false, "magnesio": false,
      "water": 8
    }
  },
  "shopping": { "Proteínas:Huevos": true },
  "waterTarget": 12
}
```

Un día cuenta como **completo** cuando los 7 esenciales están marcados y
`water >= waterTarget`. La racha y el heatmap se derivan de ahí.

## Notas / posibles mejoras para el agente

- Los menús, refrigerios y la lista del súper (con cantidades estimadas a
  ~1 semana) están como constantes al inicio de `App.jsx`. Fáciles de editar.
- **Idea**: mover el plan a un `plan.json` editable y/o permitir que el usuario
  cargue su propio PDF/plan.
- ✅ **Hecho**: exportar/importar el estado a un archivo `.json` para respaldo
  o cambio de dispositivo (pestaña *Constancia* → *Respaldo*). Sin sync en la
  nube, por diseño.
- **Idea**: notificaciones locales (recordatorio de agua/suplementos) vía
  Notifications API — requiere permiso del usuario.
- Las cantidades del súper asumen 7 días alternando Día A / Día B; si se
  agregan más menús, conviene recalcularlas.
- Sweeteners: el plan prohíbe sucralosa y polialcoholes; usar stevia o monk
  fruit (ya reflejado en los textos).

> No es consejo médico. El plan viene de la nutrióloga del usuario; la app solo
> ayuda a seguirlo.
