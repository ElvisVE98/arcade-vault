# SPEC 03 — Envío real del formulario de contacto con Resend

> **Estado:** implementado
> **Depende de:** SPEC 02 (`specs/02-home-y-acerca-de.md`, implementado: página `/acerca`, `components/contact-form.tsx` con envío simulado y la terminal de éxito)
> **Fecha:** 2026-11-04
> **Objetivo:** Reemplazar el envío simulado del formulario de contacto de `/acerca` por un envío real de correo con Resend mediante una Server Action, manteniendo el aspecto del template `references/templates/home-about/`.

---

## Por qué existe este spec

La página Acerca de ya existe y se ve igual que el template (SPEC 02). Su formulario solo cambia de estado en el cliente y no entrega el mensaje a nadie. SPEC 02 dejó el envío real fuera de alcance porque exigía decidir destino y proveedor. Esas decisiones ya están tomadas: Resend, Server Action, remitente `onboarding@resend.dev` y destino en una variable de entorno. El diseño visual no cambia: el template sigue siendo la referencia y este spec solo cambia lo que ocurre al pulsar "ENVIAR MENSAJE".

---

## Alcance

**Dentro:**

- Instalar el paquete `resend`.
- Server Action `sendContactMessage` en `app/acerca/actions.ts` que recibe nombre, correo y mensaje, y envía un correo al equipo con Resend.
- El correo usa `from: "Arcade Vault <onboarding@resend.dev>"`, `to` desde `CONTACT_TO_EMAIL` y `replyTo` con el correo que escribió el visitante.
- Variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL`, definidas en `.env.local` (no versionado) y documentadas en `.env.example`.
- `components/contact-form.tsx` llama a la Server Action en lugar de simular el envío.
- Estado de envío: el botón queda deshabilitado con el texto "ENVIANDO…" mientras la acción está en curso.
- Estado de error: si la acción falla, se muestra un mensaje en línea sobre el botón, el formulario conserva lo escrito y no aparece la terminal de éxito.
- La terminal de éxito solo aparece cuando Resend confirma el envío. Su texto y estilo no cambian.
- Validación en el servidor de los tres campos no vacíos (después de `trim()`), con la misma regla que ya aplica el cliente.

**Fuera de alcance (para futuros specs):**

- Correo de confirmación al visitante. Con `onboarding@resend.dev` Resend solo entrega a la cuenta dueña de la API key, y requiere un dominio verificado.
- Dominio propio verificado en Resend y remitente personalizado.
- Validación de formato de correo y límites de longitud en el servidor.
- Honeypot, rate limiting, captcha u otras medidas anti-spam.
- Guardar los mensajes en una base de datos (Supabase u otra).
- Plantilla HTML con React Email. El correo se envía como texto plano.
- Cambios visuales en `/acerca`, en `globals.css` o en la terminal de éxito, salvo el estilo mínimo del mensaje de error.
- Tests automatizados (el proyecto no tiene test runner).

---

## Modelo de datos

No hay persistencia nueva. Se añaden la firma de la Server Action y las variables de entorno.

```ts
// app/acerca/actions.ts
"use server";

export type ContactInput = { name: string; email: string; msg: string };

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string }; // error: texto en español apto para mostrarse al usuario

export async function sendContactMessage(input: ContactInput): Promise<ContactResult>;
```

```bash
# .env.local (no versionado)
RESEND_API_KEY=re_xxxxxxxxxxxx      # API key de Resend
CONTACT_TO_EMAIL=tu@correo.com      # correo dueño de la cuenta Resend; recibe los mensajes
```

Convenciones:

- Asunto del correo: `[Arcade Vault] Mensaje de {name}`.
- Cuerpo en texto plano con líneas `Nombre:`, `Correo:` y `Mensaje:`.
- Mensajes de error al usuario (fijos, en español):
  - Campos vacíos: `Completa todos los campos.`
  - Falla de Resend o configuración ausente: `No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.`
- Los detalles técnicos del error (respuesta de Resend, variable faltante) se registran con `console.error` en el servidor y nunca llegan al cliente.
- La API key se lee con `process.env.RESEND_API_KEY` solo dentro de la Server Action, nunca en un componente de cliente ni con prefijo `NEXT_PUBLIC_`.

---

## Estructura de archivos

```
app/
  acerca/
    actions.ts          (nuevo: Server Action sendContactMessage)
components/
  contact-form.tsx      (modifica: llama a la acción, estados enviando y error)
.env.example            (nuevo: variables sin valores reales)
.gitignore              (modifica: excepción !.env.example)
package.json            (modifica: dependencia resend)
README.md               (modifica: sección breve de variables de entorno)
```

---

## Plan de implementación

Antes de escribir código, leer en `node_modules/next/dist/docs/` la guía de `use-server` (`01-app/03-api-reference/01-directives/use-server.md`) y la de Server Actions / formularios, como indica `CLAUDE.md`. Consultar también la documentación vigente de Resend para Node.js antes de usar su SDK.

1. Instalar `resend` (`npm install resend`), crear `.env.example` con `RESEND_API_KEY=` y `CONTACT_TO_EMAIL=`, añadir `!.env.example` a `.gitignore` y documentar las dos variables en `README.md`. Verificación: `npm run build` sin errores; `git status` muestra `.env.example` como archivo nuevo y no muestra `.env.local`.
2. Crear `app/acerca/actions.ts` con `sendContactMessage`: valida que los tres campos no estén vacíos tras `trim()`, comprueba que existan las dos variables de entorno, instancia `Resend` dentro de la función, envía el correo y devuelve `ContactResult`. Si Resend responde con `error` o lanza una excepción, registra con `console.error` y devuelve el error genérico. Verificación: `npm run lint` y `npx tsc --noEmit` sin errores.
3. Modificar `components/contact-form.tsx`: añadir estados `pending` y `error`; en `onSubmit`, tras la validación local (que conserva el `shake`), llamar a `sendContactMessage` con `useTransition` o equivalente; si `ok`, mostrar la terminal de éxito con el nombre; si no, mostrar `error`. El botón muestra "ENVIANDO…" y queda deshabilitado mientras `pending` es verdadero. Añadir en `globals.css` solo la regla mínima para el mensaje de error (color `--magenta` o el token rojo existente, fuente de los `.field`), si no existe ya una clase reutilizable. Verificación: con claves válidas en `.env.local`, enviar el formulario completo muestra la terminal y llega un correo a `CONTACT_TO_EMAIL`.
4. Revisión manual de los casos de fallo: sin `RESEND_API_KEY`, con una key inválida y con `CONTACT_TO_EMAIL` vacío. Verificación: en los tres casos aparece el mensaje de error en línea, el formulario conserva lo escrito, no aparece la terminal y `npm run lint` y `npm run build` pasan.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `package.json` incluye `resend` como dependencia.
- [ ] `.env.example` está versionado y lista `RESEND_API_KEY` y `CONTACT_TO_EMAIL` sin valores reales; `.env.local` no aparece en `git status`.
- [ ] Enviar el formulario con algún campo vacío (o solo espacios) aplica `shake` ~400 ms, no llama a la Server Action y no genera petición de red.
- [ ] Enviar el formulario completo con claves válidas muestra la terminal "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE EN MAYÚSCULAS}." solo después de que la acción devuelve `{ ok: true }`.
- [ ] Tras ese envío llega un correo a `CONTACT_TO_EMAIL` desde `Arcade Vault <onboarding@resend.dev>`, con asunto `[Arcade Vault] Mensaje de {nombre}` y con el nombre, el correo y el mensaje del visitante en el cuerpo.
- [ ] Al pulsar "Responder" en ese correo, el destinatario por defecto es el correo escrito por el visitante.
- [ ] Mientras la acción está en curso, el botón muestra "ENVIANDO…" y está deshabilitado (un doble clic no envía dos correos).
- [ ] Si Resend falla (key inválida) o falta alguna variable de entorno, aparece `No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.` sobre el botón, el formulario conserva lo escrito y no aparece la terminal.
- [ ] El mensaje de error no incluye la API key, el texto de error de Resend ni el nombre de ninguna variable de entorno.
- [ ] Tras un error, volver a pulsar "ENVIAR MENSAJE" reintenta el envío y limpia el mensaje de error previo.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos y sin mensaje de error.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente (`grep` en `.next/static` no la encuentra) ni en la consola del navegador.
- [ ] El aspecto de `/acerca` en desktop (1440 px) y móvil (390 px) es el mismo que antes, salvo el mensaje de error cuando aparece.

---

## Decisiones tomadas y descartadas

- **Sí:** Resend como proveedor, por decisión del usuario.
- **Sí:** Server Action. Menos código que un endpoint, sin ruta pública que proteger ni documentar, y SPEC 02 ya la dejó indicada como camino natural.
- **No:** Route Handler `POST /api/contacto`. Solo valdría la pena si otro cliente (app móvil, otra web) consumiera el endpoint.
- **Sí:** remitente `onboarding@resend.dev` y destino en `CONTACT_TO_EMAIL`. No requiere dominio, basta para recibir mensajes y se cambia sin tocar código.
- **No:** dominio propio verificado ahora. Se hará cuando exista un dominio de Arcade Vault; entonces también tendrá sentido el correo de confirmación.
- **Sí:** `replyTo` con el correo del visitante, para responder desde la bandeja sin copiar direcciones.
- **No:** correo de confirmación al visitante. Con `onboarding@resend.dev` Resend rechaza destinatarios distintos al dueño de la cuenta.
- **No:** validación de formato de correo, límites de longitud y anti-spam en este spec. Se descartó al definir el alcance; la mitigación parcial es el `type="email"` del input y el `trim()` en servidor.
- **Sí:** error en línea con el formulario intacto. Es lo más simple, no pierde lo que el usuario escribió y no necesita CSS nuevo de terminal.
- **No:** estado de error dentro de la terminal con botón "REINTENTAR". Más temático, pero implica markup y CSS nuevos que el template no contempla.
- **Sí:** correo en texto plano. Basta para uso interno y evita añadir React Email.
- **Sí:** errores técnicos solo en `console.error` del servidor. El mensaje al usuario es genérico para no filtrar configuración.
- **Sí:** instanciar `Resend` dentro de la acción y no a nivel de módulo, para que `next build` no falle cuando falta `RESEND_API_KEY` y para respetar `cacheComponents`.
- **Sí:** `!.env.example` en `.gitignore`, porque `.env*` lo ignoraría y el archivo sirve de documentación para quien clone el repo.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo dueño de la cuenta; si `CONTACT_TO_EMAIL` es otro, Resend rechaza el envío | Documentar en `.env.example` y `README.md` que debe ser el correo de la cuenta Resend. El fallo se ve como el error genérico y en el log del servidor. |
| Sin validación de formato de correo, un `replyTo` inválido hace fallar el envío | El input es `type="email"` y el navegador lo valida en el cliente. Si Resend lo rechaza, el usuario ve el error genérico. Validación de servidor queda para otro spec. |
| Sin anti-spam, cualquiera puede invocar la Server Action en bucle y consumir la cuota de Resend | Aceptado en este spec por decisión del alcance. Se reabre con un spec de rate limiting u honeypot si aparece abuso. |
| La API key se filtra al cliente o al repositorio | Solo se lee en `actions.ts` (`"use server"`), sin prefijo `NEXT_PUBLIC_`; `.env.local` queda ignorado por `.gitignore`; criterio de aceptación con `grep` sobre `.next/static`. |
| `next build` falla o cachea mal por leer `process.env` bajo `cacheComponents` | La lectura ocurre dentro de la acción (en tiempo de petición), nunca a nivel de módulo ni en un componente de servidor. Verificar con `npm run build` en el paso 1 y en el 4. |
| Next 16.4 cambia APIs de Server Actions respecto a lo conocido | Leer `use-server.md` y la guía de formularios en `node_modules/next/dist/docs/` antes del paso 2, como indica `AGENTS.md`. |
| Doble envío por doble clic o por reintento rápido | El botón queda deshabilitado mientras `pending` es verdadero. |

---

## Qué **no** está en este spec

- Correo de confirmación al visitante.
- Dominio propio verificado y remitente personalizado.
- Validación de formato de correo, límites de longitud y medidas anti-spam.
- Persistencia de los mensajes (Supabase u otra base de datos).
- Plantillas HTML o React Email.
- Cambios visuales en la página Acerca de.

Cada uno de esos puntos, si se aborda, va en su propio spec.
