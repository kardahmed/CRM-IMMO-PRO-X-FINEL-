# CRM IMMO PRO X

SaaS CRM immobilier multi-tenant pour promoteurs et agences immobilieres.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **UI** : React, Tailwind CSS, shadcn/ui
- **ORM** : Prisma
- **Base de donnees** : Supabase PostgreSQL
- **Auth** : Clerk
- **Temps reel** : Supabase Realtime
- **Deploiement** : Vercel

## Demarrage rapide

```bash
# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Editer .env.local avec vos valeurs

# Generer le client Prisma
npm run db:generate

# Lancer le serveur de dev
npm run dev
```

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run format` | Formater le code avec Prettier |
| `npm run type-check` | Verification TypeScript |
| `npm run db:generate` | Generer le client Prisma |
| `npm run db:push` | Pousser le schema vers la DB |
| `npm run db:migrate` | Creer une migration |
| `npm run db:studio` | Interface Prisma Studio |

## Structure du projet

```
src/
  app/
    (auth)/          # Pages authentification
    (dashboard)/     # Pages dashboard
    api/v1/          # Routes API RESTful
  components/
    ui/              # Composants shadcn/ui
    layout/          # Composants de mise en page
    shared/          # Composants partages
  lib/               # Utilitaires (prisma, supabase, utils)
  types/             # Types TypeScript
  hooks/             # Custom React hooks
  services/          # Logique metier
prisma/
  schema.prisma      # Schema Prisma
```
