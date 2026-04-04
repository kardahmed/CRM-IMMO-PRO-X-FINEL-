# Deploiement — CRM IMMO PRO X

## 1. CI/CD (GitHub Actions)

Le workflow `.github/workflows/ci.yml` s'execute automatiquement :
- **Sur push vers `main`** : lint + type-check + tests + build
- **Sur Pull Request vers `main`** : lint + type-check + tests + build

Les 4 jobs (lint, type-check, test, build) tournent en parallele. Le build ne se lance que si les 3 premiers passent.

## 2. Deploiement Vercel

### Configuration initiale

1. Importer le repo GitHub dans Vercel (vercel.com/new)
2. Framework preset : **Next.js**
3. Root directory : `.` (racine)
4. Build command : `prisma generate && next build`
5. Activer **Auto Deploy** sur la branche `main`

### Auto-deploy sur merge

Vercel deploie automatiquement quand un push arrive sur `main`. Avec le CI GitHub Actions, le flow est :
1. PR ouverte -> CI lint/test/build
2. PR mergee sur `main` -> Vercel deploie automatiquement
3. Preview deploys sur chaque PR (automatique Vercel)

### Variables d'environnement Vercel

Aller dans **Settings > Environment Variables** et ajouter :

| Variable | Scope | Description |
|---|---|---|
| `DATABASE_URL` | Production, Preview | URL PostgreSQL Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | All | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Cle publique Supabase |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | All | Cle publique Clerk |
| `CLERK_SECRET_KEY` | Production, Preview | Secret Clerk |
| `CLERK_WEBHOOK_SECRET` | Production, Preview | Secret webhook Clerk (Svix) |
| `FACEBOOK_APP_SECRET` | Production | Secret Meta pour HMAC webhooks |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Production | Token challenge Facebook |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Production | Token challenge WhatsApp |
| `WHATSAPP_ACCESS_TOKEN` | Production | Token API WhatsApp Cloud |
| `WHATSAPP_PHONE_NUMBER_ID` | Production | Phone number ID WhatsApp |
| `ENCRYPTION_SECRET` | Production | Min 32 chars, chiffrement AES-256 |
| `CRON_SECRET` | Production | Bearer token pour endpoint CRON |
| `ANTHROPIC_API_KEY` | Production | Cle API Claude |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | All | Cle API Google Maps |
| `NEXT_PUBLIC_SENTRY_DSN` | All | DSN Sentry |
| `SENTRY_AUTH_TOKEN` | Production, Preview | Token pour upload source maps |
| `SENTRY_ORG` | Production, Preview | Organisation Sentry |
| `SENTRY_PROJECT` | Production, Preview | Projet Sentry |

## 3. Sentry (Error Tracking)

### Configuration

1. Creer un projet Next.js sur sentry.io
2. Recuperer le DSN et l'ajouter comme `NEXT_PUBLIC_SENTRY_DSN`
3. Creer un auth token (Settings > Auth Tokens) pour l'upload des source maps
4. Les fichiers de config sont deja en place :
   - `sentry.client.config.ts` — config client (browser)
   - `sentry.server.config.ts` — config serveur (Node.js)
   - `sentry.edge.config.ts` — config edge runtime
   - `src/instrumentation.ts` — hook Next.js pour init Sentry
   - `src/app/global-error.tsx` — capture les erreurs React et les envoie a Sentry

### Sampling

- **Production** : 10% des transactions tracees (`tracesSampleRate: 0.1`)
- **Dev** : 100% des transactions tracees
- **Replay** : 100% des sessions avec erreur, 0% des sessions normales

## 4. Supabase — Mode Production

Verifier dans le dashboard Supabase :

1. **Project Settings > General** : le projet NE doit PAS etre en mode "Paused"
2. **Authentication > Settings** : desactiver "Enable email confirmations" si gere par Clerk
3. **Database > Extensions** : activer `uuid-ossp` (pour les UUID)
4. **Database > Roles** : verifier que le role `postgres` a bien les permissions
5. **API Settings** : noter que les cles anon/service ne sont utilisees que pour Realtime, pas pour les queries (on passe par Prisma + connection string directe)
6. **Database > Connection Pooling** : activer PgBouncer en mode "Transaction" pour la production (modifier DATABASE_URL pour utiliser le port 6543)

### RLS (Row Level Security)

Les policies RLS sont gerees au niveau applicatif par le middleware Prisma (`createTenantPrisma`). Si vous souhaitez une double protection au niveau DB :

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON clients
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## 5. Domaine Custom (immoprox.io)

### Sur Vercel

1. **Settings > Domains** > Ajouter `immoprox.io` et `www.immoprox.io`
2. Vercel fournira les records DNS a configurer

### Chez le registrar DNS

Ajouter ces records :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

### SSL

Le SSL est **automatique** via Vercel. Un certificat Let's Encrypt est provisionne des que le domaine est verifie. Aucune action necessaire.

### Clerk

Mettre a jour les URLs dans le dashboard Clerk :
- **Application > Paths** : changer les URLs de callback vers `https://immoprox.io/...`
- **Application > Domains** : ajouter `immoprox.io` comme domaine autorise

### Meta (Facebook / WhatsApp)

Mettre a jour l'URL du webhook dans le dashboard Meta Developers :
- Webhook URL : `https://immoprox.io/api/v1/webhooks/whatsapp`
- Lead Ads Webhook : `https://immoprox.io/api/v1/webhooks/facebook-leads`

## 6. Seed Initial

Apres le premier deploiement, executer le seed :

```bash
# Definir le clerk ID du super admin
export SUPER_ADMIN_CLERK_ID="user_..."

# Executer le seed
npm run db:seed
```

Cela cree :
- 1 Super Admin (lie au compte Clerk specifie)
- 1 Tenant demo "Agence Immobiliere Demo" avec :
  - 4 utilisateurs (CEO, Superviseur, 2 Agents)
  - 5 biens immobiliers (Alger)
  - 5 clients a differentes etapes du pipeline
  - 4 taches, 2 visites, 2 paiements, 2 objectifs
  - 9 configurations d'automatisation

## 7. Checklist Pre-Production

- [ ] Variables d'environnement configurees sur Vercel
- [ ] Supabase en mode production (pas paused)
- [ ] Connection pooling active (PgBouncer)
- [ ] Domaine DNS configure et verifie
- [ ] SSL actif (automatique Vercel)
- [ ] Clerk URLs mises a jour pour le domaine custom
- [ ] Meta webhook URLs mises a jour
- [ ] Sentry DSN configure
- [ ] CRON_SECRET et ENCRYPTION_SECRET generes (min 32 chars aleatoires)
- [ ] Seed initial execute
- [ ] Premier login Super Admin teste
