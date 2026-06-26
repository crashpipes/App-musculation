# 💪 MuscuTrack — Suivi de musculation

Application web (et PWA installable) de suivi de musculation et de nutrition. Chaque utilisateur dispose d'un espace privé : profil, objectifs caloriques/protéiques calculés automatiquement, suivi quotidien par repas, bibliothèque d'exercices, progression des performances, et un assistant IA optionnel pour estimer les calories d'un plat.

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict
- **TailwindCSS** — responsive, mode clair/sombre, bilingue FR/EN
- **Prisma** + **PostgreSQL** (ex. Neon)
- **NextAuth** (Credentials, sessions JWT)
- **Recharts** — graphiques
- **Zod** — validation · **bcryptjs** — hachage des mots de passe
- **Resend** — email de réinitialisation (optionnel)
- **PWA** — manifest + service worker (installable sur Android)

## Fonctionnalités

- **Authentification** : inscription, connexion, déconnexion, réinitialisation du mot de passe par email.
- **Profil** : sexe, âge, taille, poids, objectif (prise de masse / maintien / sèche), niveau d'activité.
- **Calculs automatiques** : BMR (Mifflin-St Jeor), TDEE, objectif calorique, protéines (1,6–2,2 g/kg), eau (~35 ml/kg).
- **Suivi quotidien par repas** : chaque repas (calories + protéines) s'additionne au total du jour ; ajout d'eau additif ; poids du jour. Vues semaine / mois / 3 mois.
- **Tableau de bord** : anneaux de progression, évolution du poids, streak, dernières séries.
- **Exercices** : 25 exercices préchargés + exercices personnalisés. Saisie rapide d'une performance (nb de séries × répétitions × charge), record personnel (PR), volume total, graphiques.
- **Assistant IA (optionnel)** : l'utilisateur connecte sa propre clé API (OpenAI, Anthropic ou Google Gemini, chiffrée en base). Estimation des calories/protéines d'un plat par **photo** (vision, fichier ou caméra) ou par **liste d'aliments en grammes**, avec ajout en un clic à la journée.
- **Bilingue FR/EN** : bouton de bascule, choix mémorisé.
- **Mobile / PWA** : barre de navigation inférieure, bouton flottant d'ajout rapide, retour haptique, zones sûres (encoches), installable comme une app.

## Logique métier (sources)

| Calcul | Formule / référence |
|---|---|
| BMR | Mifflin-St Jeor (1990) |
| TDEE | BMR × facteur d'activité (1,2 → 1,9) |
| Calories | Maintien = TDEE · Prise +10 % · Sèche −20 % |
| Protéines | 1,6 (maintien) / 2,0 (prise) / 2,2 (sèche) g/kg — ISSN/ACSM |
| Eau | ≈ 35 ml/kg de poids |

## Installation

```bash
npm install
cp .env.example .env   # remplir les variables (voir ci-dessous)
npm run db:push        # crée les tables
npm run db:seed        # charge les 25 exercices préchargés
npm run dev            # http://localhost:3000
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (ex. Neon). |
| `NEXTAUTH_SECRET` | Secret de session — `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | URL de base (local : `http://localhost:3000` ; prod : l'URL Vercel). |
| `APP_ENCRYPTION_KEY` | Chiffrement des clés API IA (AES-256) — `openssl rand -base64 32`. **Ne pas changer une fois en place.** |
| `RESEND_API_KEY` | (optionnel) Clé Resend pour l'envoi d'email de reset. Sans elle, le lien est affiché en dev. |
| `EMAIL_FROM` | Expéditeur des emails (par défaut `onboarding@resend.dev`). |

## Assistant IA — fournisseurs

| Fournisseur | API gratuite ? | Où obtenir la clé |
|---|---|---|
| Google Gemini | **Oui** (palier gratuit, modèles Flash) | aistudio.google.com/app/apikey |
| OpenAI | Non (crédits prépayés requis) | platform.openai.com/api-keys |
| Anthropic | Non (crédits prépayés requis) | console.anthropic.com/settings/keys |

Modèle Gemini par défaut : `gemini-2.5-flash` (modifiable dans Réglages). Les estimations sont approximatives et facturées sur le compte du fournisseur de l'utilisateur. Les images sont envoyées au fournisseur puis non stockées.

## Déploiement (Vercel + PWA)

1. Pousser le code sur un dépôt GitHub privé.
2. Importer le projet sur Vercel (Next.js détecté automatiquement).
3. Renseigner les variables d'environnement (table ci-dessus) ; `NEXTAUTH_URL` = URL Vercel.
4. Chaque `git push` redéploie automatiquement.

**Installer sur Android** : ouvrir l'URL dans Chrome → menu → « Installer l'application ». Pour un APK autonome, utiliser [PWABuilder](https://www.pwabuilder.com) avec l'URL déployée.

## Sécurité

- Mots de passe hachés (bcrypt, coût 12).
- Toutes les routes API vérifient la session et filtrent par `userId`.
- Espace privé protégé par middleware NextAuth.
- Clés API IA chiffrées (AES-256-GCM) ; jamais renvoyées au client.
- Tokens de réinitialisation hachés (SHA-256), usage unique, expiration 30 min.
- Validation systématique des entrées (Zod) ; le service worker ne met jamais en cache `/api`.

## Structure

```
prisma/                 schema.prisma · seed.ts
public/                 manifest.webmanifest · sw.js · icons/
src/
  app/
    (auth)/             login · register · forgot-password · reset-password
    (app)/              dashboard · tracking · exercises · exercises/[id] · profile · settings
    api/                auth · register · password · profile · logs · meals · water
                        weight · exercises · sets · ai/settings · ai/estimate · dashboard
  components/           Navbar · BottomNav · QuickAddButton · ThemeToggle · LanguageToggle
                        ProgressRing · StatCard · AIEstimator · charts/ · ServiceWorkerRegister
  lib/                  prisma · auth · nutrition · validation · crypto · ai · email
                        i18n · exercise-i18n · haptics · fetcher · api · utils
  types/
```

## Scripts

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run db:push` | Synchronise le schéma |
| `npm run db:seed` | Charge les exercices préchargés |
| `npm run db:studio` | Interface Prisma Studio |
