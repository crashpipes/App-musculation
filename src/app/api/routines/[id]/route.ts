import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const routine = await prisma.routine.findFirst({
      where: { id: params.id, userId },
      include: {
        exercises: { orderBy: { order: "asc" }, include: { exercise: true } }
      }
    });
    if (!routine) throw new Error("NOT_FOUND");
    return NextResponse.json({ routine });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.routine.findFirst({
      where: { id: params.id, userId }
    });
    if (!owned) throw new Error("NOT_FOUND");
    await prisma.routine.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
