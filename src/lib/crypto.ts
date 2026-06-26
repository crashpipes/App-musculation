import crypto from "crypto";

// Chiffrement symétrique AES-256-GCM pour les secrets stockés en base (clés API).
// La clé de chiffrement dérive de APP_ENCRYPTION_KEY (n'importe quelle chaîne longue).

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const material = process.env.APP_ENCRYPTION_KEY;
  if (!material || material.length < 16) {
    throw new Error("APP_ENCRYPTION_KEY manquante ou trop courte");
  }
  return crypto.createHash("sha256").update(material).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(":");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, encB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !encB64) throw new Error("Charge chiffrée invalide");
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encB64, "base64")),
    decipher.final()
  ]);
  return dec.toString("utf8");
}
