import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readUploadFile } from "@/lib/storage";

// Sert le fichier image UNIQUEMENT à son propriétaire (contrôle d'accès).
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const upload = await prisma.upload.findFirst({
      where: { id: params.id, userId }
    });
    if (!upload) throw new Error("NOT_FOUND");

    const buffer = await readUploadFile(upload.filename);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": upload.mimeType,
        "Cache-Control": "private, max-age=86400"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
