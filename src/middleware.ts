export { default } from "next-auth/middleware";

// Protège l'espace privé : toute route du groupe (app) exige une session.
export const config = {
  matcher: ["/dashboard/:path*", "/tracking/:path*", "/exercises/:path*", "/profile/:path*", "/settings/:path*"]
};
