import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./uploads");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

export function isAllowedImage(mime: string, size: number): boolean {
  return ALLOWED_MIME.has(mime) && size > 0 && size <= MAX_BYTES;
}

/**
 * Enregistre un fichier sur disque dans un dossier privé.
 * Le nom physique est aléatoire ; l'accès est contrôlé via la table Upload + API route.
 */
export async function saveUploadFile(buffer: Buffer, mime: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return filename;
}

export async function readUploadFile(filename: string): Promise<Buffer> {
  // Empêche tout path traversal : on ne garde que le basename.
  const safe = path.basename(filename);
  return readFile(path.join(UPLOAD_DIR, safe));
}

export async function deleteUploadFile(filename: string): Promise<void> {
  const safe = path.basename(filename);
  try {
    await unlink(path.join(UPLOAD_DIR, safe));
  } catch {
    // fichier déjà absent : on ignore
  }
}
