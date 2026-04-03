import { PrismaClient, type PipelineStage } from "@prisma/client";
import { DEFAULT_AUTOMATION_CONFIGS } from "../src/services/automation-defaults";

const prisma = new PrismaClient();

/**
 * Seed les configs d'automatisation par défaut pour un tenant donné.
 * Utilise upsert pour être idempotent (relancer sans dupliquer).
 */
async function seedAutomationConfigs(tenantId: string): Promise<void> {
  const stages = Object.keys(DEFAULT_AUTOMATION_CONFIGS) as PipelineStage[];

  for (const stage of stages) {
    const tasks = DEFAULT_AUTOMATION_CONFIGS[stage];

    await prisma.automationConfig.upsert({
      where: {
        tenantId_pipelineStage: { tenantId, pipelineStage: stage },
      },
      update: {
        tasks: JSON.parse(JSON.stringify(tasks)),
        isActive: true,
      },
      create: {
        tenantId,
        pipelineStage: stage,
        isActive: true,
        tasks: JSON.parse(JSON.stringify(tasks)),
      },
    });
  }

  console.log(`  ✓ ${stages.length} automation configs seeded for tenant ${tenantId}`);
}

async function main(): Promise<void> {
  console.log("🌱 Seeding database...\n");

  // Trouver tous les tenants existants et seeder les configs pour chacun
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  if (tenants.length === 0) {
    console.log("  ⚠ Aucun tenant trouvé. Créez d'abord un tenant.\n");
    console.log("  Pour tester, vous pouvez créer un tenant manuellement :");
    console.log("  INSERT INTO tenants (id, name, type, plan) VALUES (uuid_generate_v4(), 'Demo', 'PROMOTION', 'PRO');\n");
    return;
  }

  for (const tenant of tenants) {
    console.log(`📁 Tenant: ${tenant.name} (${tenant.id})`);
    await seedAutomationConfigs(tenant.id);
  }

  console.log("\n✅ Seed terminé !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
