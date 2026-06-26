import { redirect } from "next/navigation";
import { Landing } from "@/components/Landing";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <Landing />;
}
