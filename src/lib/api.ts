import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Gestion centralisée des erreurs pour les API routes. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation", issues: error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  console.error("API error:", error);
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}
