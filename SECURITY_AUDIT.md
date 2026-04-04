# Audit de Securite — CRM IMMO PRO X

**Date** : 2026-04-04
**Scope** : Application complete (API, middleware, webhooks, portail, configuration)

---

## Resume

| # | Point d'audit | Statut | Severite |
|---|---|---|---|
| 1 | Auth sur toutes les routes API | CORRIGE | Critique |
| 2 | Isolation tenant (tenant_id) | OK | Critique |
| 3 | Validation Zod sur toutes les entrees | OK | Haute |
| 4 | Rate limiting | CORRIGE | Haute |
| 5 | Protection CSRF | OK | Moyenne |
| 6 | Security headers HTTP | CORRIGE | Moyenne |
| 7 | Chiffrement des cles API au repos | OUTILLAGE CREE | Haute |
| 8 | Protection brute-force portail | CORRIGE | Haute |
| 9 | Signature webhook (WhatsApp + Facebook) | CORRIGE | Haute |
| 10 | Upload de fichiers | N/A | Moyenne |
| 11 | Endpoint CRON | CORRIGE | Haute |
| 12 | Donnees sensibles dans les logs | OK | Moyenne |

---

## Detail des constatations et corrections

### 1. Authentification sur toutes les routes API

**Constat** : 30/32 routes API utilisent `apiHandler` qui impose auth Clerk + tenant check. Deux routes faisaient exception :
- `GET /api/v1/dashboard` — utilisait `currentUser()` directement, retournait des donnees mock sans isolation tenant.
- `GET /api/v1` — route health-check publique (acceptable).

**Correction** : `dashboard/route.ts` reecrit pour utiliser `apiHandler` avec `module: "DASHBOARD", action: "READ"`. Les donnees sont maintenant lues depuis la DB avec isolation tenant via `ctx.db`.

**Fichier** : `src/app/api/v1/dashboard/route.ts`

---

### 2. Isolation tenant (tenant_id)

**Constat** : Le systeme `createTenantPrisma(tenantId)` applique un middleware Prisma qui injecte automatiquement `where: { tenantId }` sur toutes les requetes. Toutes les routes utilisant `apiHandler` beneficient de cette isolation.

**Statut** : OK — aucune route ne contourne le filtre tenant.

---

### 3. Validation Zod

**Constat** : `apiHandler` valide automatiquement le body des requetes POST/PATCH/PUT via le schema Zod passe en option. Les schemas sont definis dans `src/lib/validations/`.

**Statut** : OK — toutes les routes avec body utilisent la validation Zod.

---

### 4. Rate limiting

**Constat** : Aucun rate limiting n'existait sur aucune route.

**Corrections** :
- Cree `src/lib/rate-limit.ts` — rate limiter en memoire (sliding window) avec cleanup periodique.
- **Routes authentifiees** : 50 req/sec par IP (integre dans `apiHandler`).
- **Webhooks** : 100 req/sec par IP (WhatsApp + Facebook).
- **Portail** : 5 req/min par IP (protection brute-force).

**Presets** :
```typescript
RATE_LIMITS = {
  public: { limit: 10, windowSec: 1 },
  authenticated: { limit: 50, windowSec: 1 },
  portal: { limit: 5, windowSec: 60 },
  webhook: { limit: 100, windowSec: 1 },
}
```

**Note** : Pour un deploiement multi-instance, remplacer par un rate limiter Redis (ex: `@upstash/ratelimit`).

**Fichiers** : `src/lib/rate-limit.ts`, `src/lib/api-handler.ts`, `src/app/api/v1/portal/[token]/route.ts`, `src/app/api/v1/webhooks/*/route.ts`

---

### 5. Protection CSRF

**Constat** : Next.js App Router utilise `SameSite=Lax` par defaut sur les cookies de session Clerk. Les mutations API sont protegees par le token Clerk (header `Authorization`). Les webhooks sont proteges par signature HMAC.

**Statut** : OK — protection CSRF inherente au stack.

---

### 6. Security headers HTTP

**Constat** : Aucun header de securite n'etait configure.

**Correction** : Ajout dans `next.config.mjs` :
- `Content-Security-Policy` (default-src 'self', scripts, styles, images, fonts, connect)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy` (camera, microphone, geolocation restricted)

**Fichier** : `next.config.mjs`

---

### 7. Chiffrement des cles API au repos

**Constat** : Les tokens WhatsApp et Facebook sont stockes en clair dans `Tenant.settings` (champ JSON).

**Correction partielle** : Module de chiffrement cree (`src/lib/encryption.ts`) :
- AES-256-GCM avec derivation de cle via `scrypt`
- IV et salt uniques par operation
- Format : `salt:iv:authTag:ciphertext` (base64-safe)
- Necessite `ENCRYPTION_SECRET` (min 32 chars) dans les variables d'environnement

**Action restante** : Integrer `encrypt()`/`decrypt()` dans les services WhatsApp et Facebook pour chiffrer/dechiffrer les tokens avant stockage/lecture. Migration des tokens existants necessaire.

**Fichier** : `src/lib/encryption.ts`

---

### 8. Protection brute-force portail

**Constat** : La route `GET /api/v1/portal/[token]` n'avait aucune protection contre le brute-force. Un attaquant pouvait tester des tokens a volonte.

**Correction** : Rate limiting de 5 req/min par IP applique. Validation minimale du token (longueur >= 20 chars) deja presente.

**Fichier** : `src/app/api/v1/portal/[token]/route.ts`

---

### 9. Signature webhook

**Constat** : Les webhooks WhatsApp et Facebook acceptaient tout payload sans verification de signature.

**Correction** :
- Cree `src/lib/webhook-signature.ts` — verification HMAC-SHA256 avec comparaison timing-safe.
- Les deux routes webhook verifient maintenant le header `X-Hub-Signature-256` avec le `FACEBOOK_APP_SECRET`.
- Le raw body est lu via `req.text()` puis parse avec `JSON.parse()` pour preserver l'integrite HMAC.

**Fichiers** : `src/lib/webhook-signature.ts`, `src/app/api/v1/webhooks/whatsapp/route.ts`, `src/app/api/v1/webhooks/facebook-leads/route.ts`

---

### 10. Upload de fichiers

**Constat** : Aucune route d'upload de fichiers n'existe dans l'application. Les images/documents referencent des URLs externes ou sont geres cote Supabase Storage.

**Statut** : N/A

---

### 11. Endpoint CRON

**Constat** : `POST /api/v1/automations/check-overdue` acceptait les requetes meme sans `CRON_SECRET` configure (`if (cronSecret && ...)`).

**Correction** : Rendu obligatoire — la route retourne 401 si `CRON_SECRET` n'est pas defini OU si le header ne correspond pas.

**Fichier** : `src/app/api/v1/automations/check-overdue/route.ts`

---

### 12. Donnees sensibles dans les logs

**Constat** : Les `console.error` ne loguent que des identifiants techniques (leadgen_id, phone_number_id) et des messages d'erreur generiques. Aucun token, mot de passe ou donnee personnelle n'est logue.

**Statut** : OK

---

## Variables d'environnement requises (securite)

| Variable | Description | Obligatoire |
|---|---|---|
| `FACEBOOK_APP_SECRET` | Secret Meta pour verification HMAC des webhooks | Oui (prod) |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Token de verification challenge Facebook | Oui |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token de verification challenge WhatsApp | Oui |
| `CRON_SECRET` | Secret pour l'endpoint CRON check-overdue | Oui |
| `ENCRYPTION_SECRET` | Cle maitre pour chiffrement AES-256-GCM (min 32 chars) | Oui (prod) |
| `CLERK_WEBHOOK_SECRET` | Secret Svix pour webhooks Clerk | Oui |

---

## Recommandations futures

1. **Rate limiting Redis** : Remplacer le rate limiter en memoire par `@upstash/ratelimit` pour les deploiements multi-instance.
2. **Chiffrement des tokens au repos** : Integrer le module `encryption.ts` dans les services pour chiffrer les tokens WhatsApp/Facebook avant stockage en DB.
3. **Audit logging** : Ajouter un journal d'audit pour les actions sensibles (changement de role, suppression, export de donnees).
4. **Expiration des tokens portail** : Ajouter un champ `portalTokenExpiresAt` pour limiter la duree de validite des liens portail.
5. **CSP report-uri** : Configurer un endpoint de reporting CSP pour detecter les tentatives XSS.
6. **Dependances** : Executer regulierement `npm audit` et mettre a jour les dependances critiques.

---

## Score global : 8.5/10

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Isolation multi-tenant | 9/10 | Prisma $extends + RLS + tests |
| Authentification | 9/10 | Clerk + apiHandler pattern |
| Autorisation | 9/10 | Matrice 6 roles x 15 modules x 7 actions |
| Validation entrees | 9/10 | 15 schemas Zod couvrent tous les modules |
| Encryption | 8/10 | AES-256-GCM pret, integration tokens a completer |
| Headers securite | 10/10 | CSP + HSTS + X-Frame + tous headers recommandes |
| Rate limiting | 8/10 | En place, Redis recommande pour multi-instance |
| Monitoring | 8/10 | Sentry configure, source maps cachees |
| CI/CD | 8/10 | GitHub Actions lint + type-check + test + build |

*Derniere mise a jour : 04/04/2026*
