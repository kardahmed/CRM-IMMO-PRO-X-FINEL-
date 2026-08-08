# RAPPORT D'AUDIT COMPLET — CRM IMMO PRO X

**Date :** 2026-08-08
**Branche :** `claude/create-claude-md-6HjDF` (branche unique du projet)
**Stack :** Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS, Prisma, Supabase PostgreSQL, Supabase Auth

---

## TABLE DES MATIERES

1. [Contexte du projet](#1-contexte-du-projet)
2. [Problemes CRITIQUES (a corriger en priorite)](#2-problemes-critiques)
3. [Problemes HAUTS](#3-problemes-hauts)
4. [Problemes MOYENS](#4-problemes-moyens)
5. [Problemes BAS](#5-problemes-bas)
6. [Points positifs](#6-points-positifs)
7. [Checklist de validation](#7-checklist-de-validation)

---

## 1. CONTEXTE DU PROJET

SaaS CRM immobilier multi-tenant pour le marche algerien. Deux types de workspace (PROMOTION, AGENCY). Pipeline de vente en 9 etapes. Le projet a recemment migre de Clerk vers Supabase Auth. Des commits ont ete faits par un autre outil AI (Antigravity) apres la migration.

---

## 2. PROBLEMES CRITIQUES

### C1 — Hook `useSupabaseAuth` : boucle infinie potentielle

- **Fichier :** `src/hooks/useSupabaseAuth.ts` lignes 37-64
- **Probleme :** `useEffect` et `useCallback` ont `[supabase.auth]` comme dependance. Si `createSupabaseBrowserClient()` retourne un nouvel objet a chaque render, le hook se re-execute a l'infini.
- **Impact :** Performance catastrophique, re-renders infinis, potentiel crash du navigateur.
- **Solution :**
  ```typescript
  // Ligne 35 : stocker le client dans un useRef ou un useState
  const [supabase] = useState(() => createSupabaseBrowserClient());
  
  // Ligne 60 : changer la dependance en tableau vide
  useEffect(() => { ... }, []);
  
  // Ligne 64 : meme chose
  const signOut = useCallback(async () => { ... }, [supabase]);
  ```
- **Verification :** `createSupabaseBrowserClient()` dans `src/lib/supabase-browser.ts` — verifier si c'est un singleton. Si oui, le probleme est mitige mais reste une mauvaise pratique.

---

### C2 — Webhook Clerk encore present (code mort + faille securite)

- **Fichier :** `src/app/api/webhooks/clerk/route.ts` (165 lignes)
- **Probleme :** Le projet a migre vers Supabase Auth, mais ce fichier ecoute encore les webhooks Clerk. Il utilise `CLERK_WEBHOOK_SECRET`, la librairie `svix`, et fait des upserts dans la base via `clerkId`.
- **Impact :** Endpoint expose inutilement. Si quelqu'un envoie un payload forge, il pourrait creer/modifier des utilisateurs dans la DB.
- **Solution :** Supprimer le fichier entierement. Verifier que `svix` peut aussi etre retire de `package.json` s'il n'est utilise nulle part ailleurs.
- **Verification :** `grep -r "svix" src/` pour confirmer qu'il n'y a pas d'autre usage.

---

### C3 — Schema Prisma : `DemoLead` model manquant ou `tenantId` optionnel

- **Fichier :** `prisma/schema.prisma`
- **Probleme :** Le model `DemoLead` est reference dans le code (`src/app/onboarding/actions.ts` ligne 109, `src/app/api/v1/admin/demo-leads/route.ts`) mais n'existe PAS dans le schema Prisma actuel (714 lignes). Soit il a ete supprime par erreur, soit il est dans un schema separe.
- **Impact :** Les routes qui utilisent `prisma.demoLead.create()` vont crasher en production.
- **Solution :** 
  1. Verifier si le model existe dans un fichier schema separe
  2. Si non, le recreer dans `schema.prisma` avec `tenantId String @map("tenant_id")` OBLIGATOIRE (pas optionnel)
  3. Ajouter les indexes necessaires : `@@index([tenantId])`, `@@unique([email, companyType])` ou similaire

---

### C4 — Schema Prisma : User email sans contrainte d'unicite par tenant

- **Fichier :** `prisma/schema.prisma` lignes 279-309
- **Probleme :** Le champ `email` du model `User` est un simple `String` sans contrainte `@@unique([tenantId, email])`. Deux utilisateurs du meme tenant peuvent avoir le meme email.
- **Impact :** Requetes par email qui retournent le mauvais utilisateur. Fuite de donnees cross-tenant possible.
- **Solution :** Ajouter dans le model User :
  ```prisma
  @@unique([tenantId, email])
  ```
- **Attention :** Verifier qu'il n'y a pas de doublons existants en DB avant d'ajouter la contrainte.

---

### C5 — Schema Prisma : Visit cascade delete supprime l'historique

- **Fichier :** `prisma/schema.prisma` ligne 479
- **Probleme :** `agent User @relation("AgentVisits", ..., onDelete: Cascade)` — quand un agent est supprime, TOUTES ses visites sont supprimees.
- **Impact :** Perte de donnees historiques irreversible. Un superviseur qui desactive un agent perd tout l'historique des visites.
- **Solution :** Changer en `onDelete: SetNull` et rendre `agentId` nullable :
  ```prisma
  agentId  String?  @map("agent_id")
  agent    User?    @relation("AgentVisits", fields: [agentId], references: [id], onDelete: SetNull)
  ```

---

### C6 — Pattern `as unknown as` dans 7 routes API (contournement TypeScript)

- **Fichiers concernes :**
  1. `src/app/api/v1/visits/route.ts`
  2. `src/app/api/v1/tasks/route.ts`
  3. `src/app/api/v1/properties/route.ts`
  4. `src/app/api/v1/projects/route.ts`
  5. `src/app/api/v1/payments/route.ts`
  6. `src/app/api/v1/objectives/route.ts`
  7. `src/app/api/v1/interactions/route.ts`
- **Probleme :** Le pattern `(ctx.db.model.create as unknown as (...a: unknown[]) => Promise<unknown>)` contourne completement la securite TypeScript. Si le schema Prisma change, aucune erreur de compilation ne sera levee.
- **Cause :** Le middleware `createTenantPrisma()` (Prisma `$extends`) casse l'inference de types sur les methodes `create`/`update`.
- **Solution :** Soit :
  1. Typer correctement le retour de `createTenantPrisma()` avec un type generique
  2. Soit utiliser `// @ts-expect-error` avec un commentaire explicatif (plus honnete)
  3. Soit restructurer le middleware pour preserver les types Prisma

---

### C7 — `console.log` restants dans le code production

- **Fichier :** `src/services/email.service.ts` lignes 89-91
- **Probleme :** 3 appels `console.log` qui affichent le destinataire, le sujet et le corps de l'email.
- **Nuance :** Ces logs sont gates derriere une condition "SMTP non configure" (mode dev). Mais en production si SMTP n'est pas configure, ces logs exposeront des donnees sensibles dans les logs serveur.
- **Solution :** Remplacer par `Sentry.captureMessage()` :
  ```typescript
  Sentry.captureMessage("[EMAIL] SMTP non configure", {
    level: "warning",
    extra: { to: input.to, subject: input.subject },
  });
  ```

---

## 3. PROBLEMES HAUTS

### H1 — Indexes manquants dans le schema Prisma

- **Fichier :** `prisma/schema.prisma`
- **Indexes a ajouter :**

| Model | Index manquant | Raison |
|-------|---------------|--------|
| User | `@@index([tenantId, email])` | Recherche utilisateur par email |
| Visit | `@@index([tenantId, clientId])` | Visites d'un client |
| Payment | `@@index([tenantId, propertyId])` | Paiements d'un bien |
| Objective | `@@index([tenantId, period])` | Objectifs par periode |
| Interaction | `@@index([tenantId, type, createdAt])` | Filtrage par type d'interaction |

---

### H2 — `TaskExecutionDialog.tsx` trop volumineux (586 lignes)

- **Fichier :** `src/components/tasks/TaskExecutionDialog.tsx` (586 lignes)
- **Probleme :** Un seul composant gere : dialog, state management, affichage des interactions, execution de tache, generation IA.
- **Solution :** Decouvper en sous-composants :
  - `TaskDialog.tsx` — wrapper dialog
  - `TaskDetails.tsx` — informations de la tache
  - `InteractionsList.tsx` — historique des interactions
  - `TaskActions.tsx` — boutons d'action (appeler, WhatsApp, SMS)
  - `AIScriptGenerator.tsx` — generation de script IA

---

### H3 — `useNotifications` dependance circulaire potentielle

- **Fichier :** `src/hooks/useNotifications.ts` ligne 72
- **Probleme :** Le premier useEffect depend de `fetchNotifications` qui est defini dans le meme hook. Si `fetchNotifications` n'est pas stabilise avec `useCallback`, il se recree a chaque render, declenchant l'effect en boucle.
- **Solution :** Verifier que `fetchNotifications` est bien dans un `useCallback` avec les bonnes dependances. Sinon, le stabiliser.

---

### H4 — ErrorBoundary defini mais jamais utilise

- **Fichier defini :** `src/components/shared/error-boundary.tsx` (exporte `ErrorBoundary`)
- **Probleme :** Ce composant n'est importe dans AUCUN layout (`src/app/(dashboard)/layout.tsx`, `src/app/layout.tsx`, etc.).
- **Impact :** Une erreur React non catchee crashe la page entiere sans fallback.
- **Solution :** Wrapper le contenu du dashboard layout avec ErrorBoundary :
  ```tsx
  // src/app/(dashboard)/layout.tsx
  import { ErrorBoundary } from "@/components/shared/error-boundary";
  
  <ErrorBoundary>
    <main>{children}</main>
  </ErrorBoundary>
  ```

---

### H5 — `GlobalSearch` : debounce non nettoye au unmount

- **Fichier :** `src/components/layout/GlobalSearch.tsx` ligne 38
- **Probleme :** Le `setTimeout` du debounce n'est pas annule quand le composant se demonte. Le callback `search()` peut s'executer sur un composant demonte, causant un memory leak et un warning React.
- **Solution :** Ajouter un useEffect de cleanup :
  ```typescript
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
  ```

---

### H6 — Validation manquante sur les filtres audit-log

- **Fichier :** `src/app/api/v1/audit-log/route.ts` lignes 15-23
- **Probleme :** Les parametres `entity` et `action` sont lus depuis `searchParams` et passes directement dans la requete Prisma sans validation.
- **Impact :** Bien que Prisma empeche l'injection SQL, des valeurs arbitraires peuvent causer des erreurs inattendues.
- **Solution :** Valider avec un enum Zod :
  ```typescript
  const entitySchema = z.enum(["Client", "User", "Property", "Task", "Visit", "Payment"]);
  const actionSchema = z.enum(["CREATE", "UPDATE", "DELETE", "ASSIGN", "STAGE_CHANGE"]);
  ```

---

### H7 — Rate limit trop permissif sur le portail public

- **Fichier :** `src/app/api/v1/portal/[token]/route.ts` lignes 21-28
- **Config actuelle :** 5 requetes par minute par IP
- **Probleme :** Le token du portail donne acces aux donnees client. 5 req/min permet le brute-force.
- **Solution :** Reduire a 2 req/min : `{ limit: 2, windowSec: 60 }`

---

### H8 — Index comme key dans les boucles (anti-pattern React)

- **Fichier :** `src/components/shared/page-skeleton.tsx`
- **Probleme :** Pattern `[...Array(x)].map((_, i) => <div key={i}>` — utilise l'index comme key.
- **Impact :** Bug d'etat si la liste change de taille (rare pour des skeletons, mais mauvaise pratique).
- **Solution :** Utiliser un identifiant stable ou `crypto.randomUUID()` si necessaire.

---

## 4. PROBLEMES MOYENS

### M1 — Route webhook Facebook retourne 200 meme en erreur

- **Fichier :** `src/app/api/v1/webhooks/facebook-leads/route.ts` ligne 69
- **Probleme :** `JSON.parse()` peut throw mais n'est pas dans un try-catch. La route retourne 200 meme quand le traitement echoue.
- **Solution :** Wrapper dans try-catch et retourner 422 si le parsing echoue.

---

### M2 — Query params (page/limit) sans validation Zod dans certaines routes

- **Fichier :** `src/app/api/v1/clients/route.ts` lignes 12-23
- **Probleme :** `parseInt` sur page/limit sans validation min/max avant `Math.max`. Fonctionne mais fragile.
- **Solution :** Utiliser Zod :
  ```typescript
  const querySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  ```

---

### M3 — Filtres enum non valides dans routes Properties et Tasks

- **Fichiers :** `src/app/api/v1/properties/route.ts` lignes 27-30, `src/app/api/v1/tasks/route.ts` lignes 24-26
- **Probleme :** `if (type) where.type = type;` — assigne directement l'input utilisateur comme filtre sans verifier qu'il fait partie des valeurs valides de l'enum.
- **Solution :** Valider contre les enums Prisma avant d'assigner.

---

### M4 — Type casting sans validation dans useNotifications (Realtime)

- **Fichier :** `src/hooks/useNotifications.ts` lignes 89-98
- **Probleme :** Utilise `as` pour caster les donnees du Realtime Supabase sans verifier leur structure.
- **Solution :** Ajouter un type guard ou une validation Zod runtime.

---

### M5 — Dependance `shadcn` inutilisee dans package.json

- **Fichier :** `package.json` ligne 48
- **Probleme :** `"shadcn": "^4.1.2"` est en dependance de production. Ce package est un CLI (pour generer les composants), pas une lib runtime.
- **Solution :** Deplacer en `devDependencies` :
  ```bash
  npm uninstall shadcn && npm install -D shadcn
  ```

---

### M6 — i18n ne couvre que le module Automations

- **Fichier :** `src/lib/i18n/translations.ts` (518 lignes)
- **Probleme :** Seul le module Automations a des traductions (FR, AR, DZ, EN). Tous les autres modules (clients, pipeline, projets, paiements, parametres) ont des strings hardcodes en francais.
- **Impact :** L'app n'est pas reellement multilingue — changer la langue ne traduit que les pages d'automatisation.
- **Solution :** Soit etendre les traductions a tous les modules, soit retirer le selecteur de langue des pages non-traduites pour eviter la confusion.

---

### M7 — Indexes supplementaires recommandes dans le schema

- **Fichier :** `prisma/schema.prisma`
- CadastralData : ajouter `@@index([tenantId, verifiedById, verifiedAt])`
- DemoLead (si recreee) : `@@index([tenantId, status])`

---

## 5. PROBLEMES BAS

### B1 — Sidebar.tsx pourrait etre decoupe (209 lignes)

- **Fichier :** `src/components/layout/Sidebar.tsx`
- Gere desktop + mobile + collapse dans un seul fichier. Pourrait etre split en SidebarNav et SidebarMobile.

---

### B2 — TODO non implemente

- **Fichier :** `src/components/clients/TabSuggestions.tsx` ligne 150
- **Code :** `// TODO: API call to send selected properties to client`
- La fonction `handleSend()` ne fait rien.

---

### B3 — Repertoire `/src/types/` vide

- Contient uniquement `.gitkeep`. Aucun fichier de types partages.
- Soit l'utiliser pour centraliser les interfaces (`IClient`, `IProperty`, etc.), soit le supprimer.

---

### B4 — Rate limit admin identique aux routes normales

- Les routes admin (`/api/v1/admin/*`) utilisent le meme rate limit que les routes authentifiees (50 req/sec).
- Recommande : limiter a 10 req/sec pour les routes admin.

---

### B5 — Pas de pagination dans audit-log

- **Fichier :** `src/app/api/v1/audit-log/route.ts` ligne 29
- `.take(100)` hardcode, pas de parametres `page`/`limit`.

---

## 6. POINTS POSITIFS

| Aspect | Evaluation |
|--------|------------|
| Isolation tenant | Excellente — `createTenantPrisma()` avec `tenantId` fige dans le closure |
| 0 usage de `any` | Aucun `any` dans le code production (sauf 1 route dashboard) |
| 0 import mort | Aucun import inutilise detecte |
| 0 code duplique | Pas de duplication significative |
| Validation Zod | Presente sur la majorite des routes POST/PUT |
| Sentry | Integre sur les chemins critiques |
| Codes HTTP | Corrects (401/403/404/422/429) |
| Client dedup | `@@unique([tenantId, phone])` sur Client — fonctionne |
| Pipeline complet | Les 9 etapes sont dans l'enum et supportees |
| Auth Supabase | Migration complete, 0 reference a `@clerk` dans le code source |

---

## 7. CHECKLIST DE VALIDATION

Apres correction, verifier :

```bash
# 1. TypeScript — 0 erreur
npx tsc --noEmit

# 2. ESLint — 0 erreur
npx next lint

# 3. Build production — doit reussir
npm run build

# 4. Plus aucune reference Clerk
grep -r "@clerk" src/
# Doit retourner 0 resultat

# 5. Plus de console.log en production
grep -rn "console\." src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "__tests__"
# Ne doit retourner que des fichiers de config/debug

# 6. Plus de "as unknown as"
grep -rn "as unknown as" src/app/api/
# Doit retourner 0 resultat apres correction

# 7. Schema Prisma valide
npx prisma validate

# 8. Tests passent
npm run test
```

---

## RESUME QUANTITATIF

| Severite | Nombre | Actions |
|----------|--------|--------|
| CRITIQUE | 7 | A corriger AVANT mise en production |
| HAUTE | 8 | A corriger dans le sprint courant |
| MOYENNE | 7 | A planifier dans le prochain sprint |
| BASSE | 5 | Nice-to-have, a faire quand le temps le permet |
| **TOTAL** | **27** | |

---

*Rapport genere le 2026-08-08 — Branche `claude/create-claude-md-6HjDF`*
