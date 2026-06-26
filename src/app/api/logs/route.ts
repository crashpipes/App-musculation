import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDayStart } from "@/lib/utils";

// Liste des totaux journaliers (optionnellement depuis ?from=YYYY-MM-DD).
// Les totaux sont alimentés par les repas et les ajouts d'eau (voir /api/meals, /api/water).
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const fromParam = req.nextUrl.searchParams.get("from");
    const where = {
      userId,
      ...(fromParam ? { date: { gte: toDayStart(fromParam) } } : {})
    };
    const logs = await prisma.dailyLog.findMany({
      where,
      orderBy: { date: "asc" }
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
