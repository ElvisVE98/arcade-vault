"use server";

import { Resend } from "resend";

export type ContactInput = { name: string; email: string; msg: string };

export type ContactResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR =
  "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.";

export async function sendContactMessage(
  input: ContactInput,
): Promise<ContactResult> {
  const name = String(input?.name ?? "").trim();
  const email = String(input?.email ?? "").trim();
  const msg = String(input?.msg ?? "").trim();

  if (!name || !email || !msg) {
    return { ok: false, error: "Completa todos los campos." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] Falta RESEND_API_KEY o CONTACT_TO_EMAIL");
    return { ok: false, error: GENERIC_ERROR };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    });
    if (error) {
      console.error("[contact] Resend error:", error);
      return { ok: false, error: GENERIC_ERROR };
    }
    return { ok: true };
  } catch (err) {
    console.error("[contact] Excepción al enviar:", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
