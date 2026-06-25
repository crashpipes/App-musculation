# 💪 App Musculation — MuscuTrack

Application web de suivi de musculation et de nutrition. Chaque utilisateur dispose d'un espace privé : profil, objectifs caloriques/protéiques calculés automatiquement, suivi quotidien, bibliothèque d'exercices et progression des performances.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (mode strict)
- **TailwindCSS** — design responsive, mode clair/sombre
- **Prisma** + **PostgreSQL**
- **NextAuth** (Credentials, sessions JWT)
- **Recharts** — graphiques
- **Zod** — validation
- **bcryptjs** — hachage des mots de passe

## Fonctionnalités

- Authentification : inscription, connexion, déconnexion, réinitialisation du mot de passe
- Profil : sexe, âge, taille, poids, objectif (prise de masse / maintien / sèche), niveau d'activité
- Calculs automatiques : **BMR** (Mifflin-St Jeor), **TDEE**, objectif calorique, protéines (1,6–2,2 g/kg), eau (~35 ml/kg)
- Suivi quotidien : calories, protéines, eau, poids — vues semaine / mois / 3 mois
- Tableau de bord : anneaux de progression, évolution du poids, streak de suivi, dernières séries
- Exercices : 25 exercices préchargés + exercices personnalisés (avec image **privée**)
- Performances : séries / reps / charge / notes, record personnel (PR), graphiques de progression

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
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
#   → renseigner DATABASE_URL et générer NEXTAUTH_SECRET :
#   openssl rand -base64 32

# 3. Base de données
npm run db:push      # crée les tables
npm run db:seed      # charge les 25 exercices préchargés

# 4. Lancement
npm run dev          # http://localhost:3000
```

## Sécurité

- Mots de passe hachés (bcrypt, coût 12).
- Toutes les routes API vérifient la session et filtrent par `userId`.
- L'espace privé est protégé par un middleware NextAuth.
- Les images uploadées sont stockées hors du dossier public et servies par une route API qui vérifie le propriétaire (`/api/uploads/[id]`).
- Validation systématique des entrées avec Zod.
- Tokens de réinitialisation hachés (SHA-256), à usage unique, expiration 30 min.

> Note : l'envoi d'email de réinitialisation n'est pas configuré. En développement, le lien est renvoyé dans la réponse de l'API. Pour la production, brancher un service d'email (Resend, SendGrid…) dans `src/app/api/password/forgot/route.ts`.

## Structure

```
prisma/                 schema.prisma · seed.ts
src/
  app/
    (auth)/             login · register · forgot-password · reset-password
    (app)/              dashboard · tracking · exercises · exercises/[id] · profile
    api/                auth · register · password · profile · logs · weight
                        exercises · sets · uploads · dashboard
  components/           Navbar · ThemeToggle · ProgressRing · StatCard · charts/
  lib/                  prisma · auth · nutrition · validation · storage · api · utils
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
