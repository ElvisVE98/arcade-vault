# SPEC 01 — MVP visual: todas las pantallas del template en Next.js

> **Estado:** aprobado
> **Depende de:** ninguna (el scaffold y los estilos de `app/globals.css` ya existen en `main`)
> **Fecha:** 2026-11-03
> **Objetivo:** Portar a Next.js (App Router, TypeScript) las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) con datos mock y sin implementar ningún juego.

---

## Por qué existe este spec

El template de `references/templates/` es una SPA con React por CDN, Babel en el navegador y un router casero basado en `location.hash`. Este spec lo convierte en la base real del proyecto: rutas del App Router, componentes tipados y datos aislados en un solo módulo para poder reemplazarlos por un backend más adelante. El resultado debe verse igual que el template.

---

## Alcance

**Dentro:**

- Layout global con `Nav` (desktop + panel móvil con hamburguesa) y footer, igual que `nav.jsx` y `app.jsx`.
- Pantalla **Biblioteca** (`/`): hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt y estado vacío "NO HAY RESULTADOS".
- Pantalla **Detalle de juego** (`/juegos/[id]`): portada, tags, descripción, métricas, botón "JUGAR AHORA" y leaderboard lateral (10 filas).
- Pantalla **Reproductor** (`/juegos/[id]/jugar`): HUD, marco CRT con arena decorativa, puntaje simulado, pausa, fin de juego y modal "FIN DEL JUEGO" con guardado de puntuación.
- Pantalla **Auth** (`/auth`): pestañas iniciar sesión / crear cuenta, botón de invitado, botones sociales decorativos.
- Pantalla **Salón de la Fama** (`/salon`): pestañas por juego, podio top 3, tabla de 12 filas y fila "tu mejor marca" si hay sesión.
- Sesión mock en `localStorage` (`av_user`) y guardado de puntajes en `localStorage` (`av_scores`), como en el template.
- Datos mock tipados en `lib/data.ts`: `GAMES`, `CATS`, `PLAYERS`, `seededScores`.
- Responsive tal como lo define el CSS ya portado.

**Fuera de alcance (para futuros specs):**

- Implementación de cualquier juego (el reproductor solo simula).
- Autenticación real, base de datos o backend (Supabase u otro).
- OAuth real con Google o GitHub (los botones son decorativos).
- Lectura de `av_scores` en el salón o en el leaderboard (se escribe pero no se muestra).
- Tests automatizados (el proyecto no tiene test runner).
- Cambios a los estilos de `app/globals.css` más allá de lo estrictamente necesario para que las pantallas se vean como el template.
- Internacionalización (la interfaz queda en español).

---

## Modelo de datos

Los datos se mueven de `data.jsx` a `lib/data.ts` con tipos explícitos. Las claves de `localStorage` son las mismas del template.

```ts
// lib/data.ts
export type GameColor = "cyan" | "magenta" | "yellow" | "green";
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;          // slug, ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;       // clase CSS, ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // ya formateado, ej. "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date: "DD/MM/2026"

export const GAMES: Game[];                       // 8 juegos, idénticos al template
export const CATS: ("TODOS" | Category)[];
export const PLAYERS: string[];
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista, count por defecto 12
```

```ts
// lib/session.tsx (cliente)
export type User = { name: string };      // máx. 10 caracteres, mayúsculas
// localStorage "av_user"   → JSON de User | ausente
// localStorage "av_scores" → JSON de { game: string; score: number; name: string; at: number }[]
```

Convenciones:

- Las semillas de `seededScores` son las del template: `id.length * 17 + 3` en el detalle y `tab.length * 23 + 7` en el salón.
- Los números se formatean con `toLocaleString("es-ES")`.
- Los textos de la interfaz se copian tal cual del template.

---

## Estructura de archivos

```
app/
  layout.tsx                    (modifica: monta SessionProvider, Nav y footer)
  page.tsx                      (reemplaza: Biblioteca)
  auth/page.tsx
  salon/page.tsx
  juegos/[id]/page.tsx          (Detalle)
  juegos/[id]/jugar/page.tsx    (Reproductor)
components/
  nav.tsx  footer.tsx  game-card.tsx  library.tsx  hall-of-fame.tsx  auth-form.tsx  game-player.tsx  game-detail.tsx
lib/
  data.ts
  session.tsx                   (SessionProvider + hook useSession)
```

Las páginas son Server Components. Los componentes con estado, efectos o `localStorage` llevan `"use client"`.

---

## Plan de implementación

1. Crear `lib/data.ts` con tipos, `GAMES`, `CATS`, `PLAYERS` y `seededScores` portados de `data.jsx`. Verificación: `npm run lint` y `npx tsc --noEmit` sin errores.
2. Crear `lib/session.tsx` con `SessionProvider` y `useSession()` (`user`, `login`, `signOut`, `saveScore`), leyendo `av_user` en un efecto tras montar para evitar errores de hidratación. Verificación: compila.
3. Crear `components/nav.tsx` y `components/footer.tsx` y montarlos en `app/layout.tsx` junto al `SessionProvider`, usando `next/link` y `usePathname` para el estado activo. Verificación: `npm run dev`, la nav y el footer se ven; el panel móvil abre y cierra.
4. Reemplazar `app/page.tsx` por la Biblioteca (`components/library.tsx` y `components/game-card.tsx`), con búsqueda, filtro por categoría, tilt y estado vacío. Verificación: filtrar y buscar funciona; la tarjeta navega a `/juegos/[id]`.
5. Crear `app/juegos/[id]/page.tsx` con `components/game-detail.tsx`. Un `id` inexistente llama a `notFound()`. Verificación: `/juegos/caida` muestra el detalle y `/juegos/xxx` muestra 404.
6. Crear `app/salon/page.tsx` con `components/hall-of-fame.tsx` (pestañas, podio, tabla, fila "tu mejor marca"). Verificación: cambiar de pestaña cambia los datos; con sesión aparece la fila propia.
7. Crear `app/auth/page.tsx` con `components/auth-form.tsx`. Verificación: entrar guarda `av_user`, redirige a `/` y la nav muestra el nombre; "Jugar como invitado" redirige sin guardar usuario.
8. Crear `app/juegos/[id]/jugar/page.tsx` con `components/game-player.tsx` (HUD, CRT, pausa, fin, modal y guardado en `av_scores`). Verificación: el puntaje sube solo, la pausa lo detiene, "FIN" abre el modal y guardar escribe en `av_scores`.
9. Pasada de revisión visual contra `references/templates/Arcade Vault.html` en desktop y móvil, y corrección de diferencias. Verificación: `npm run lint` y `npm run build` pasan.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] La consola del navegador no muestra errores de hidratación en ninguna de las 5 rutas.
- [ ] `/` muestra las 8 tarjetas de juego del template.
- [ ] Escribir "caí" en el buscador deja solo la tarjeta CAÍDA.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] El chip SHOOTER muestra exactamente INVASORES y ROCAS.
- [ ] Hacer clic en una tarjeta o en "JUGAR" lleva a `/juegos/[id]` del juego correspondiente.
- [ ] `/juegos/[id]` muestra título, descripción, tags, métricas y 10 filas de puntuaciones.
- [ ] `/juegos/inexistente` muestra la página 404.
- [ ] "JUGAR AHORA" lleva a `/juegos/[id]/jugar`.
- [ ] En el reproductor el puntaje aumenta solo y deja de aumentar al pulsar PAUSA.
- [ ] Pulsar "FIN" abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] Pulsar "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia puntaje, vidas y nivel; "SALIR" vuelve a `/juegos/[id]`.
- [ ] `/salon` muestra podio y 12 filas, y cambiar de pestaña cambia los datos.
- [ ] `/salon` muestra la fila "TU MEJOR MARCA" solo cuando hay sesión.
- [ ] Enviar el formulario de `/auth` guarda `av_user` con el nombre en mayúsculas y máximo 10 caracteres, y redirige a `/`.
- [ ] La pestaña "CREAR CUENTA" muestra el campo de correo electrónico y "INICIAR SESIÓN" lo oculta.
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin crear `av_user`.
- [ ] Recargar la página con sesión iniciada mantiene el nombre en la nav; cerrar sesión elimina `av_user`.
- [ ] En un ancho de 390 px la nav muestra el botón hamburguesa y el panel lateral abre y cierra.
- [ ] La nav marca "Biblioteca" como activa en `/`, `/juegos/[id]` y `/juegos/[id]/jugar`, y "Salón de la Fama" en `/salon`.

---

## Decisiones tomadas y descartadas

- **Sí:** App Router con rutas reales (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs compartibles, idiomático en Next 16 y base para backend.
- **No:** replicar el router por hash del template. Va contra Next y complica el backend futuro.
- **Sí:** sesión mock en `localStorage` (`av_user`), igual que el template. Es suficiente para mostrar los estados con y sin sesión.
- **No:** auth real (Supabase u otro). Merece su propio spec.
- **No:** sesión solo visual sin persistencia. Dejaría sin demostrar la fila "tu mejor marca" ni el estado de la nav.
- **Sí:** reproductor con simulación del template (puntaje aleatorio por intervalo). Permite validar HUD, pausa y modal sin ningún juego.
- **Sí:** guardar en `av_scores` aunque no se lea todavía. Deja listo el punto de integración con un backend.
- **Sí:** datos mock en `lib/data.ts` tipado. Un único módulo fácil de reemplazar.
- **No:** carpeta `data/` con JSON. Más archivos sin beneficio para el MVP.
- **Sí:** páginas como Server Components y solo lo interactivo como Client Component, para respetar el modelo de `cacheComponents`.
- **Sí:** mantener los textos y clases CSS del template sin cambios, para que la comparación visual sea directa.
- **Sí:** reutilizar `app/globals.css` tal como está desde el commit `01-styles`.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Error de hidratación al leer `localStorage` en el primer render | `SessionProvider` empieza con `user = null` y lee `av_user` en un `useEffect` tras montar. |
| `cacheComponents` exige tratar los parámetros dinámicos (`[id]`) de forma explícita | Leer `node_modules/next/dist/docs/` antes de implementar. Usar `generateStaticParams` con los 8 ids de `GAMES`, o `Suspense`, según indique la guía. |
| `Math.random` en el reproductor produce valores distintos en servidor y cliente | La simulación corre solo dentro de `useEffect`, nunca durante el render. |
| `localStorage` no disponible (modo privado o bloqueado) | Envolver lecturas y escrituras en `try/catch`; la app sigue funcionando sin persistir. |
| `#root` y `.av-main` ya existen en `app/layout.tsx` y podrían duplicarse al añadir la nav | Montar `Nav` antes de `<main className="av-main">` y no añadir un segundo `<main>`. |
| Next 16.4 tiene cambios incompatibles con lo conocido (`LayoutProps`, `PageProps`, params asíncronos) | Seguir lo que indica `AGENTS.md` y consultar la guía local antes de escribir cada tipo de archivo. |

---

## Qué **no** está en este spec

- Ningún juego jugable (ni Bloque Buster, ni Caída, ni los demás).
- Backend, base de datos o autenticación real.
- OAuth real con Google o GitHub.
- Mostrar los puntajes guardados en `av_scores` en el salón o el detalle.
- Tests automatizados.
- Internacionalización o modo claro.

Cada uno de esos puntos, si se aborda, va en su propio spec.
