// Envoi d'email via Resend (API REST, sans dépendance).
// Si RESEND_API_KEY n'est pas défini, l'envoi est désactivé (retourne false)
// et l'appelant peut retomber sur le lien de dev.

interface ResetEmailArgs {
  to: string;
  resetUrl: string;
  locale: "fr" | "en";
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  locale
}: ResetEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  if (!apiKey) return false;

  const isEn = locale === "en";
  const subject = isEn
    ? "Reset your password"
    : "Réinitialisation de votre mot de passe";
  const intro = isEn
    ? "Click the button below to reset your password. This link expires in 30 minutes."
    : "Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans 30 minutes.";
  const btn = isEn ? "Reset password" : "Réinitialiser le mot de passe";
  const ignore = isEn
    ? "If you didn't request this, you can safely ignore this email."
    : "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.";

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
    <h1 style="font-size:20px">MuscuTrack</h1>
    <p>${intro}</p>
    <p style="margin:24px 0">
      <a href="${resetUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${btn}</a>
    </p>
    <p style="font-size:12px;color:#666;word-break:break-all">${resetUrl}</p>
    <p style="font-size:12px;color:#666">${ignore}</p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}
