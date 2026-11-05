# SPEC 02 — Home (landing) y Acerca de

> **Estado:** aprobado
> **Depende de:** SPEC 01 (`specs/01-mvp-pantallas-visuales.md`, implementado: nav, footer, Biblioteca, sesión mock y `app/globals.css`)
> **Fecha:** 2026-11-04
> **Objetivo:** Añadir a Next.js la página Home (landing) en `/` y la página Acerca de con formulario de contacto simulado en `/acerca`, mover la Biblioteca a `/juegos` y actualizar la nav, tal como en `references/templates/home-about/`.

---

## Por qué existe este spec

La carpeta `references/templates/home-about/home-about/` contiene la evolución del template: dos pantallas nuevas (`home.jsx`, `about.jsx`), una `nav.jsx` con los enlaces "Inicio" y "Acerca de", y un `styles.css` con ~800 líneas nuevas respecto al anterior. El SPEC 01 portó solo las 5 pantallas originales, con la Biblioteca como página principal. Este spec convierte la Home en la puerta de entrada del sitio y reubica la Biblioteca. El resultado debe verse igual que el template.

---

## Alcance

**Dentro:**

- Página **Home** (`/`): hero con siluetas flotantes y CTAs, sección "¿POR QUÉ ARCADE VAULT?" (4 features), "JUEGOS DISPONIBLES AHORA" (6 mini-tarjetas), franja de 3 stats, "ACTIVIDAD EN VIVO" (últimas puntuaciones + top de hoy), "PRECIOS" (plan único + 3 FAQ) y CTA final. Todas las secciones con animación `reveal` al hacer scroll.
- Página **Acerca de** (`/acerca`): hero con misión y 3 highlights, divisor de píxeles y sección de contacto con formulario.
- Formulario de contacto **solo simulado en cliente**: valida que los 3 campos no estén vacíos (animación `shake` si falla) y, si es válido, muestra la terminal de éxito con el nombre en mayúsculas y el botón "ENVIAR OTRO MENSAJE". No envía nada a ningún sitio.
- **Mover la Biblioteca** de `/` a `/juegos` (el componente `Library` no cambia).
- **Nav** (desktop y panel móvil): añadir "Inicio" (`/`) y "Acerca de" (`/acerca`); orden final: Inicio, Biblioteca, Salón de la Fama, Acerca de. El logo sigue llevando a `/`.
- Actualizar los enlaces existentes que apuntaban a la Biblioteca en `/` para que apunten a `/juegos`.
- Portar a `app/globals.css` solo las secciones `HOME PAGE`, `ABOUT PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` del nuevo `styles.css`.
- Mover a `lib/data.ts` los datos que en el futuro vendrán de un backend: últimas puntuaciones y top de hoy.

**Fuera de alcance (para futuros specs):**

- Envío real del formulario de contacto (email, Supabase, Server Action).
- Datos reales de actividad en vivo, ranking del día o contadores de partidas (siguen siendo mock).
- Las secciones `GAMEPAD` y `Theme variants` del nuevo `styles.css` (~470 líneas que ningún componente del template usa). Se portan cuando exista un juego que las necesite.
- Cambios a `Library`, `GameDetail`, `GamePlayer`, `HallOfFame` o `AuthForm` más allá de cambiar enlaces.
- Cambiar el destino tras iniciar sesión o entrar como invitado (sigue siendo `/`, que ahora es la Home).
- SEO avanzado (Open Graph, sitemap) e internacionalización.
- Tests automatizados (el proyecto no tiene test runner).

---

## Modelo de datos

Se añaden dos listas tipadas a `lib/data.ts`. El resto del contenido de la Home y de Acerca de es copy estático que vive en sus componentes. No hay persistencia nueva ni claves nuevas en `localStorage`.

```ts
// lib/data.ts (añadir)
export type NeonColor = "cyan" | "magenta" | "yellow" | "green"; // mismo conjunto que GameColor

export type RecentScore = {
  p: string;        // jugador, ej. "NEONFOX"
  g: string;        // nombre del juego tal cual se muestra, ej. "Bloque Buster"
  s: number;        // puntaje; se muestra "+184.220" con toLocaleString("es-ES")
  t: string;        // ej. "hace 2 min"
  c: NeonColor;     // clase neon-{c} del nombre del jugador
};

export type TopPlayer = { r: number; p: string; s: number }; // r: 1..5

export const RECENT_SCORES: RecentScore[]; // 7 filas, idénticas a home.jsx
export const TOP_TODAY: TopPlayer[];       // 5 filas, idénticas a home.jsx
```

Convenciones:

- Valores, textos y orden se copian tal cual de `home.jsx`, incluido "12+ JUEGOS" en la franja de stats aunque `GAMES` tenga 8 elementos.
- Las mini-tarjetas usan `GAMES.slice(0, 6)`.
- El ancho de cada barra del top es `100 - i * 16` (%), y las filas 1, 2 y 3 llevan las clases `top1`, `top2`, `top3`.
- `animationDelay` / `transitionDelay` escalonados igual que el template (`i * 60`, `i * 80`, `i * 90` ms).

---

## Estructura de archivos

```
app/
  page.tsx                  (reemplaza: Home; antes era la Biblioteca)
  juegos/page.tsx           (nuevo: Biblioteca, renderiza <Library />)
  acerca/page.tsx           (nuevo: Acerca de)
  globals.css               (modifica: añade 4 secciones de CSS)
components/
  home.tsx                  (Server Component: secciones de la Home)
  floating-silhouettes.tsx  (SVG decorativos s1–s8)
  feature-icon.tsx          (GAMEPAD, FREE, TROPHY, ROCKET)
  mini-card.tsx             (tarjeta pequeña, <Link> a /juegos/[id])
  about.tsx                 (Server Component: hero, highlights, divisor, contacto)
  highlight-icon.tsx        (HEART, BROWSER, PLANT)
  contact-form.tsx          ("use client": formulario + terminal de éxito)
  reveal-observer.tsx       ("use client": IntersectionObserver sobre .reveal)
  nav.tsx                   (modifica)
  game-detail.tsx, game-player.tsx, hall-of-fame.tsx  (modifican solo enlaces)
lib/
  data.ts                   (modifica: RECENT_SCORES, TOP_TODAY)
```

`home.tsx` y `about.tsx` son Server Components sin estado. Lo interactivo (`contact-form.tsx`, `reveal-observer.tsx`) lleva `"use client"`. `reveal-observer.tsx` no renderiza nada: al montar observa todos los `.reveal` y añade `in` al entrar en pantalla (umbral 0.12, `unobserve` después).

---

## Plan de implementación

Antes de escribir código, leer en `node_modules/next/dist/docs/` la guía de `page.tsx`, `Link` y `cacheComponents`, como indica `CLAUDE.md`.

1. Añadir a `app/globals.css` las secciones `HOME PAGE`, `ABOUT PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/home-about/styles.css` (en el template: líneas ~930–1150 y ~1621–final), sin tocar `GAMEPAD` ni `Theme variants`. Comprobar que no falten reglas que Home o About usen (`.reveal`, `.fade-in`, `.pulse`, `.btn.xl`, `.btn.magenta`, `.btn.ghost`, `.press`, `.neon-*`). Verificación: `npm run build` sin errores y las pantallas existentes se ven igual.
2. Añadir `RECENT_SCORES`, `TOP_TODAY` y los tipos a `lib/data.ts`. Verificación: `npm run lint` y `npx tsc --noEmit` sin errores.
3. Mover la Biblioteca: crear `app/juegos/page.tsx` con `<Library />` y actualizar los enlaces a la Biblioteca (`components/game-detail.tsx`, `components/game-player.tsx`, `components/hall-of-fame.tsx`) de `/` a `/juegos`. En este paso `/` sigue mostrando la Biblioteca. Verificación: `/juegos` muestra las 8 tarjetas y los enlaces "volver" llevan a `/juegos`.
4. Actualizar `components/nav.tsx`: añadir "Inicio" y "Acerca de" en desktop y panel móvil, con estado activo (`/` exacto → Inicio; `/juegos*` → Biblioteca; `/salon*` → Salón; `/acerca*` → Acerca de). Verificación: los 4 enlaces aparecen y el panel móvil abre y cierra.
5. Crear `components/reveal-observer.tsx`, `floating-silhouettes.tsx`, `feature-icon.tsx`, `mini-card.tsx` y `home.tsx`, y reemplazar `app/page.tsx` por la Home. Los botones de navegación del template pasan a `<Link>` con clase `btn`: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" y "INSERTAR MONEDA →" → `/juegos`; "CREAR CUENTA" y "EMPEZAR GRATIS →" → `/auth`; "VER SALÓN →" → `/salon`; cada mini-tarjeta → `/juegos/[id]`. Verificación: `/` muestra las 6 secciones y las animaciones `reveal` se disparan al hacer scroll.
6. Crear `components/highlight-icon.tsx`, `contact-form.tsx`, `about.tsx` y `app/acerca/page.tsx`. Verificación: enviar vacío hace shake; enviar completo muestra la terminal con el nombre en mayúsculas; "ENVIAR OTRO MENSAJE" restaura el formulario vacío.
7. Pasada de revisión visual contra `references/templates/home-about/home-about/arcade-vault-standalone.html` en desktop (1440 px) y móvil (390 px) para `/`, `/acerca` y `/juegos`, y corrección de diferencias. Verificación: `npm run lint` y `npm run build` pasan.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] La consola del navegador no muestra errores de hidratación en `/`, `/acerca` ni `/juegos`.
- [ ] `/` muestra el hero con el título "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y los botones "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [ ] `/` muestra 4 tarjetas de features, 6 mini-tarjetas de juego, 3 bloques de stats, 7 filas de últimas puntuaciones, 5 filas de top de hoy, el plan "JUGADOR VAULT $0 / SIEMPRE" con 3 preguntas FAQ y el CTA final "¿LISTO PARA JUGAR?".
- [ ] Las secciones con clase `reveal` empiezan ocultas y pasan a visibles al hacer scroll hasta ellas.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" llevan a `/juegos`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS →" llevan a `/auth`; "VER SALÓN →" lleva a `/salon`.
- [ ] Hacer clic en una mini-tarjeta lleva a `/juegos/[id]` del juego correspondiente.
- [ ] `/juegos` muestra las 8 tarjetas de la Biblioteca con búsqueda y chips funcionando como en SPEC 01.
- [ ] Los enlaces "volver a la Biblioteca" de detalle, reproductor y salón llevan a `/juegos`.
- [ ] La nav muestra, en este orden, "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de", en desktop y en el panel móvil.
- [ ] La nav marca "Inicio" activo solo en `/`, "Biblioteca" en `/juegos`, `/juegos/[id]` y `/juegos/[id]/jugar`, "Salón de la Fama" en `/salon` y "Acerca de" en `/acerca`.
- [ ] El logo lleva a `/`.
- [ ] `/acerca` muestra el título "ACERCA DE ARCADE VAULT", la misión, 3 highlights, el divisor de píxeles y el formulario "CONTÁCTANOS".
- [ ] Enviar el formulario con algún campo vacío (o solo espacios) no muestra la terminal y aplica la clase `shake` durante ~400 ms.
- [ ] Enviar el formulario completo muestra "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE EN MAYÚSCULAS}." y no genera ninguna petición de red.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] En 390 px de ancho no hay scroll horizontal en `/` ni en `/acerca`.
- [ ] Iniciar sesión o "JUGAR COMO INVITADO" en `/auth` redirige a `/` (la Home).
- [ ] `app/globals.css` no contiene los selectores `.gp` ni `.gp-vapor`.

---

## Decisiones tomadas y descartadas

- **Sí:** Home en `/`, Biblioteca en `/juegos`, Acerca de en `/acerca`. Sigue el orden de la nav del template y deja `/juegos/[id]` como hija natural de `/juegos`.
- **No:** Biblioteca en `/biblioteca` o Home en `/inicio`. La primera aleja la URL de `/juegos/[id]`; la segunda contradice el template, donde Inicio es la entrada del sitio.
- **Sí:** portar solo `HOME PAGE`, `ABOUT PAGE`, `ACTIVITY` y `PRICING` del CSS. Evita ~470 líneas de CSS que nada usa.
- **No:** portar `GAMEPAD` y `Theme variants` ahora. Se hará en el spec del primer juego que use controles en pantalla.
- **Sí:** formulario de contacto simulado en cliente, igual que el template. Un envío real exige decidir destino y es otro spec.
- **No:** Server Action con envío real en este spec.
- **Sí:** `RECENT_SCORES` y `TOP_TODAY` tipados en `lib/data.ts`. Son lo que más probablemente venga de un backend.
- **Sí:** features, stats, FAQ, precios y highlights como copy estático en sus componentes. No tiene sentido sacarlos a un módulo de datos.
- **Sí:** `home.tsx` y `about.tsx` como Server Components, con `reveal-observer.tsx` y `contact-form.tsx` como únicas islas de cliente, para respetar `cacheComponents`.
- **Sí:** botones de navegación del template convertidos a `<Link className="btn …">` y no a `<button onClick>`. Mantiene el aspecto y mejora accesibilidad y prefetch.
- **Sí:** copiar el copy tal cual, incluidos "12+ JUEGOS" y la promesa "Nuevos juegos cada mes". Se trata de contenido de marketing, no de un dato que deba coincidir con `GAMES.length`.
- **Sí:** tras login o invitado se sigue redirigiendo a `/`. Cambia el contenido de esa ruta, no el flujo.
- **Sí:** este spec reemplaza el criterio de SPEC 01 "la nav marca Biblioteca como activa en `/`": ahora en `/` se marca "Inicio".

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` deja el contenido en `opacity: 0` si el observer no se ejecuta (JS desactivado, error) | El contenido es accesible tras la hidratación; verificar que `reveal-observer` se monta en `/` y en `/acerca`. No se añade un fallback `noscript` en este spec. |
| `reveal-observer` se ejecuta en cada navegación cliente pero los `.reveal` nuevos no se observan | El efecto se monta con la página (no en el layout), así que corre en cada visita a `/` y `/acerca` y limpia con `io.disconnect()` al desmontar. |
| `toLocaleString("es-ES")` y fechas dan resultados distintos entre servidor y cliente | Formatear solo números con locale fijo `es-ES`, nunca fechas ni hora actual. Los "hace X min" son texto fijo. |
| Mover la Biblioteca rompe enlaces internos o el estado activo de la nav | Paso 3 y 4 actualizan los enlaces; el criterio de aceptación comprueba cada uno. Buscar `href="/"` y `router.push("/")` con grep antes de cerrar. |
| Colisión entre reglas CSS nuevas y las de SPEC 01 (clases `.btn`, `.kicker`, `.field`, `.shake`) | Comparar con `diff` que las secciones portadas solo añaden reglas; revisar visualmente `/auth` y `/juegos` tras el paso 1. |
| `.field` y `.shake` ya existen para `/auth` y el formulario de contacto podría heredar estilos distintos | Revisar en el paso 6 que el formulario de contacto se ve igual que en el template. |
| Next 16.4 cambia APIs conocidas (`PageProps`, `Link`, caché) | Consultar `node_modules/next/dist/docs/` antes de escribir cada tipo de archivo, como indica `AGENTS.md`. |

---

## Qué **no** está en este spec

- Envío real de mensajes de contacto.
- Actividad en vivo, ranking diario o contadores reales: son datos mock.
- Gamepad en pantalla y variantes de tema (`gp-vapor`, `gp-cabinet`).
- Cambios de comportamiento en Biblioteca, detalle, reproductor, salón o auth.
- SEO avanzado, internacionalización y tests automatizados.

Cada uno de esos puntos, si se aborda, va en su propio spec.
