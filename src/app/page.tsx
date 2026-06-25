import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Suivez vos <span className="text-brand-600">gains</span>
        </h1>
        <p className="mx-auto max-w-xl text-[rgb(var(--muted))]">
          Calculez vos objectifs caloriques et protéiques, enregistrez vos
          séances, et visualisez votre progression jour après jour.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/register" className="btn-primary">
          Créer un compte
        </Link>
        <Link href="/login" className="btn-ghost">
          Se connecter
        </Link>
      </div>
    </main>
  );
}
