import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";

/**
 * Génère un token de réinitialisation. En production, ce token serait envoyé
 * par email. Ici, sans service d'email configuré, on le renvoie dans la réponse
 * (à remplacer par un envoi réel). On répond toujours 200 pour ne pas révéler
 * l'existence d'un compte.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = forgotPasswordSchema.parse(await req.json());
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
      // TODO: envoyer `token` par email. Exposé ici uniquement en développement.
      if (process.env.NODE_ENV !== "production") devToken = token;
    }

    return NextResponse.json({ ok: true, devToken });
  } catch (error) {
    return handleApiError(error);
  }
}
