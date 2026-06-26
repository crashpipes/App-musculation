import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
