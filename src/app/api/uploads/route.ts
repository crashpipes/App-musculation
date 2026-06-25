import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedImage, saveUploadFile } from "@/lib/storage";

// Upload d'une image (multipart/form-data, champ "file"). Privée par utilisateur.
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (!isAllowedImage(file.type, file.size)) {
      return NextResponse.json(
        { error: "Image invalide (JPEG/PNG/WebP, max 5 Mo)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = await saveUploadFile(buffer, file.type);

    const upload = await prisma.upload.create({
      data: {
        userId,
        filename,
        mimeType: file.type,
        sizeBytes: file.size
      }
    });

    return NextResponse.json({ uploadId: upload.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
