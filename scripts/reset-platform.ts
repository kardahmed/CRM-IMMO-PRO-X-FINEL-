import { PrismaClient, UserRole, WorkspaceType, PlanType, TenantStatus } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🛑 ATTENTION : Suppression de toutes les données en cours...");

  try {
    // 1. Liste des tables à vider (ordre respectant les clés étrangères si possible, mais CASCADE gère tout)
    const tables = [
      "activity_logs",
      "notifications",
      "ai_generations",
      "automation_configs",
      "cadastral_data",
      "mandates",
      "owner_mandates",
      "objectives",
      "payments",
      "interactions",
      "visits",
      "tasks",
      "clients",
      "properties",
      "projects",
      "users",
      "tenants",
      "demo_leads"
    ];

    console.log("🧹 Vidage des tables...");
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    console.log("✅ Base de données vidée avec succès.");

    // 2. Création du Tenant Maître (Sensium X)
    console.log("🏗️ Création du Tenant Maître...");
    const masterTenant = await prisma.tenant.create({
      data: {
        name: "Sensium X HQ",
        type: WorkspaceType.PROMOTION,
        plan: PlanType.ENTERPRISE,
        status: TenantStatus.ACTIVE,
        settings: {
          isMaster: true,
          description: "Tenant principal de gestion de la plateforme"
        }
      }
    });

    // 3. Création du Super Admin
    // Email par défaut : contact@sensium-x.com 
    // IMPORTANT: Remplacez 'placeholder-id' par l'ID Supabase Auth de l'admin après connexion
    console.log("👤 Création du compte Super Admin...");
    const superAdmin = await prisma.user.create({
      data: {
        email: "contact@sensium-x.com",
        firstName: "Super",
        lastName: "Admin",
        role: UserRole.SUPER_ADMIN,
        tenantId: masterTenant.id,
        clerkId: "placeholder-admin-id", // À mettre à jour avec l'ID Supabase réel
        isActive: true
      }
    });

    console.log("\n✨ RÉINITIALISATION TERMINÉE ✨");
    console.log("-----------------------------------");
    console.log(`Tenant Créé : ${masterTenant.name} (${masterTenant.id})`);
    console.log(`Super Admin : ${superAdmin.email}`);
    console.log("-----------------------------------");
    console.log("\n👉 NOTE : Connectez-vous avec cet email sur la plateforme.");
    console.log("👉 Récupérez votre UUID dans Supabase Auth et mettez à jour le champ 'clerk_id' dans la table 'users'.");

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation :", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
