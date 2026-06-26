import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";

/**
 * Génère un token de réinitialisation et envoie le lien par email (via Resend).
 * On répond toujours 200 pour ne pas révéler l'existence d'un compte.
 * Si aucun service d'email n'est configuré, le token est renvoyé dans la
 * réponse en développement uniquement (fallback local).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const locale = body?.locale === "en" ? "en" : "fr";

    const user = await prisma.user.findUnique({ where: { email } });

    let devToken: string | undefined;
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30) // 30 min
        }
      });

      const base = process.env.NEXTAUTH_URL ?? "";
      const resetUrl = `${base}/reset-password?token=${token}`;
      const sent = await sendPasswordResetEmail({ to: email, resetUrl, locale });

      // Fallback local : si aucun email n'a été envoyé, on expose le token en dev.
      if (!sent && process.env.NODE_ENV !== "production") devToken = token;
    }

    return NextResponse.json({ ok: true, devToken });
  } catch (error) {
    return handleApiError(error);
  }
}
