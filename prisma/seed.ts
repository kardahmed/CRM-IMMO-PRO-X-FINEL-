import { PrismaClient, type PipelineStage } from "@prisma/client";
import { DEFAULT_AUTOMATION_CONFIGS } from "../src/services/automation-defaults";

const prisma = new PrismaClient();

// ============================================================================
// Seed data
// ============================================================================

const SUPER_ADMIN_SUPABASE_ID = process.env.SUPER_ADMIN_SUPABASE_ID || "supabase_superadmin_placeholder";

const DEMO_TENANT = {
  name: "Agence Immobiliere Demo",
  type: "AGENCY" as const,
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  settings: {
    whatsapp: { enabled: false },
    facebook: { enabled: false },
  },
};

const DEMO_USERS = [
  {
    supabaseId: "sb_demo_ceo",
    firstName: "Karim",
    lastName: "Benali",
    email: "karim@demo-agency.dz",
    phone: "+213555000001",
    role: "CEO" as const,
  },
  {
    supabaseId: "sb_demo_supervisor",
    firstName: "Amina",
    lastName: "Hadj",
    email: "amina@demo-agency.dz",
    phone: "+213555000002",
    role: "SUPERVISOR" as const,
  },
  {
    supabaseId: "sb_demo_agent1",
    firstName: "Youcef",
    lastName: "Mansouri",
    email: "youcef@demo-agency.dz",
    phone: "+213555000003",
    role: "AGENT" as const,
  },
  {
    supabaseId: "sb_demo_agent2",
    firstName: "Sara",
    lastName: "Boudiaf",
    email: "sara@demo-agency.dz",
    phone: "+213555000004",
    role: "AGENT" as const,
  },
];

const DEMO_PROPERTIES = [
  {
    name: "Appartement F3 Hydra",
    type: "APARTMENT" as const,
    floor: 3,
    rooms: 3,
    surface: 85,
    price: 4500000,
    status: "AVAILABLE" as const,
    transactionType: "SALE" as const,
    latitude: 36.7478,
    longitude: 3.0242,
  },
  {
    name: "Villa Contemporaine Dely Ibrahim",
    type: "VILLA" as const,
    rooms: 5,
    surface: 250,
    price: 15000000,
    status: "AVAILABLE" as const,
    transactionType: "SALE" as const,
    latitude: 36.7529,
    longitude: 2.9847,
  },
  {
    name: "Studio Meuble Alger Centre",
    type: "STUDIO" as const,
    floor: 2,
    rooms: 1,
    surface: 35,
    price: 45000,
    status: "RENTED" as const,
    transactionType: "RENT" as const,
    latitude: 36.7538,
    longitude: 3.0588,
  },
  {
    name: "Duplex Standing Bab Ezzouar",
    type: "DUPLEX" as const,
    floor: 4,
    rooms: 4,
    surface: 140,
    price: 7800000,
    status: "RESERVED" as const,
    transactionType: "SALE" as const,
    latitude: 36.7166,
    longitude: 3.1836,
  },
  {
    name: "Local Commercial Cheraga",
    type: "COMMERCIAL" as const,
    floor: 0,
    rooms: 2,
    surface: 120,
    price: 6000000,
    status: "AVAILABLE" as const,
    transactionType: "SALE" as const,
    latitude: 36.7634,
    longitude: 2.9591,
  },
];

const DEMO_CLIENTS = [
  {
    firstName: "Mohamed",
    lastName: "Rahmani",
    phone: "+213551234567",
    email: "m.rahmani@email.com",
    source: "FACEBOOK" as const,
    pipelineStage: "QUALIFIED" as const,
    budgetMin: 3000000,
    budgetMax: 5000000,
    desiredType: "APARTMENT" as const,
    desiredWilaya: "Alger",
    desiredRooms: 3,
  },
  {
    firstName: "Fatima",
    lastName: "Zerhouni",
    phone: "+213557654321",
    email: "f.zerhouni@email.com",
    source: "WEBSITE" as const,
    pipelineStage: "VISIT_SCHEDULED" as const,
    budgetMin: 10000000,
    budgetMax: 18000000,
    desiredType: "VILLA" as const,
    desiredWilaya: "Alger",
    desiredRooms: 5,
  },
  {
    firstName: "Ali",
    lastName: "Khelifi",
    phone: "+213559876543",
    email: "a.khelifi@email.com",
    source: "REFERRAL" as const,
    pipelineStage: "NEGOTIATION" as const,
    budgetMin: 6000000,
    budgetMax: 9000000,
    desiredType: "DUPLEX" as const,
    desiredWilaya: "Alger",
    desiredRooms: 4,
  },
  {
    firstName: "Nadia",
    lastName: "Benslimane",
    phone: "+213553456789",
    email: "n.benslimane@email.com",
    source: "PHONE" as const,
    pipelineStage: "NEW" as const,
    budgetMin: 30000,
    budgetMax: 50000,
    desiredType: "STUDIO" as const,
    desiredWilaya: "Alger",
    desiredRooms: 1,
  },
  {
    firstName: "Rachid",
    lastName: "Ouali",
    phone: "+213556789012",
    email: "r.ouali@email.com",
    source: "WALK_IN" as const,
    pipelineStage: "RESERVED" as const,
    budgetMin: 7000000,
    budgetMax: 8000000,
    desiredType: "DUPLEX" as const,
    desiredWilaya: "Alger",
    desiredRooms: 4,
  },
];

// ============================================================================
// Seed functions
// ============================================================================

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

  console.log(`  -> ${stages.length} automation configs`);
}

async function seedSuperAdmin(): Promise<void> {
  console.log("\n--- Super Admin ---");

  const existing = await prisma.user.findUnique({
    where: { supabaseId: SUPER_ADMIN_SUPABASE_ID },
  });

  if (existing) {
    console.log(`  Super Admin deja present (${existing.id})`);
    return;
  }

  // Super Admin needs a tenant — create a platform tenant
  const platformTenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000000" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Platform Admin",
      type: "AGENCY",
      plan: "ENTERPRISE",
      status: "ACTIVE",
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      supabaseId: SUPER_ADMIN_SUPABASE_ID,
      tenantId: platformTenant.id,
      firstName: "Super",
      lastName: "Admin",
      email: "admin@immoprox.io",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`  Super Admin cree: ${superAdmin.id}`);
}

async function seedDemoTenant(): Promise<void> {
  console.log("\n--- Tenant Demo ---");

  // Upsert demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { name: DEMO_TENANT.name },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      ...DEMO_TENANT,
    },
  });
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);

  // Users
  const userIds: string[] = [];
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { supabaseId: u.supabaseId },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: { ...u, tenantId: tenant.id, isActive: true },
    });
    userIds.push(user.id);
    console.log(`  User: ${user.firstName} ${user.lastName} (${user.role})`);
  }

  const [ceoId, _supervisorId, agent1Id, agent2Id] = userIds;

  // Properties
  const propertyIds: string[] = [];
  for (const p of DEMO_PROPERTIES) {
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        ...p,
        price: p.price,
        images: [],
        plans: [],
        documents: [],
      },
    });
    propertyIds.push(property.id);
    console.log(`  Bien: ${property.name}`);
  }

  // Clients — assigned round-robin to agents
  const agents = [agent1Id, agent2Id];
  const clientIds: string[] = [];
  for (let i = 0; i < DEMO_CLIENTS.length; i++) {
    const c = DEMO_CLIENTS[i];
    const agentId = agents[i % agents.length];

    const existing = await prisma.client.findUnique({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
    });
    if (existing) {
      clientIds.push(existing.id);
      console.log(`  Client: ${c.firstName} ${c.lastName} (existe deja)`);
      continue;
    }

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        assignedAgentId: agentId,
        ...c,
        budgetMin: c.budgetMin,
        budgetMax: c.budgetMax,
      },
    });
    clientIds.push(client.id);
    console.log(`  Client: ${client.firstName} ${client.lastName} -> ${c.pipelineStage}`);
  }

  // Tasks
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const demoTasks = [
    { title: "Rappeler M. Rahmani pour visite", type: "CALL" as const, assignedToId: agent1Id, clientId: clientIds[0], dueAt: tomorrow, status: "PENDING" as const },
    { title: "Envoyer dossier Villa a Mme Zerhouni", type: "DOCUMENT" as const, assignedToId: agent2Id, clientId: clientIds[1], dueAt: yesterday, status: "PENDING" as const },
    { title: "Preparer compromis Khelifi", type: "DOCUMENT" as const, assignedToId: agent1Id, clientId: clientIds[2], dueAt: tomorrow, status: "IN_PROGRESS" as const },
    { title: "Relance Benslimane (nouveau lead)", type: "FOLLOW_UP" as const, assignedToId: agent2Id, clientId: clientIds[3], dueAt: now, status: "PENDING" as const },
  ];

  for (const t of demoTasks) {
    await prisma.task.create({
      data: { tenantId: tenant.id, ...t },
    });
    console.log(`  Tache: ${t.title}`);
  }

  // Visits
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 3);
  const demoVisits = [
    { clientId: clientIds[1], propertyId: propertyIds[1], agentId: agent2Id, scheduledAt: nextWeek, status: "SCHEDULED" as const },
    { clientId: clientIds[0], propertyId: propertyIds[0], agentId: agent1Id, scheduledAt: tomorrow, status: "SCHEDULED" as const },
  ];

  for (const v of demoVisits) {
    await prisma.visit.create({
      data: { tenantId: tenant.id, ...v },
    });
    console.log(`  Visite: client ${v.clientId.slice(0, 8)}... -> bien ${v.propertyId.slice(0, 8)}...`);
  }

  // Payments (for the RESERVED client)
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      clientId: clientIds[4],
      propertyId: propertyIds[3],
      type: "RESERVATION",
      amount: 500000,
      status: "COMPLETED",
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      clientId: clientIds[4],
      propertyId: propertyIds[3],
      type: "INSTALLMENT",
      amount: 3000000,
      status: "PENDING",
    },
  });
  console.log("  2 paiements crees pour le client reserve");

  // Objectives
  await prisma.objective.create({
    data: {
      tenantId: tenant.id,
      createdById: ceoId,
      assignedToId: agent1Id,
      type: "SALES",
      targetValue: 5,
      currentValue: 2,
      period: "MONTHLY",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
  });
  await prisma.objective.create({
    data: {
      tenantId: tenant.id,
      createdById: ceoId,
      assignedToId: agent2Id,
      type: "VISITS",
      targetValue: 20,
      currentValue: 8,
      period: "MONTHLY",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
  });
  console.log("  2 objectifs crees");

  // Automation configs
  await seedAutomationConfigs(tenant.id);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("=== CRM IMMO PRO X — Seed Initial ===\n");

  await seedSuperAdmin();
  await seedDemoTenant();

  // Also seed automation configs for any existing tenants that don't have them
  const otherTenants = await prisma.tenant.findMany({
    where: {
      id: {
        notIn: [
          "00000000-0000-0000-0000-000000000000",
          "11111111-1111-1111-1111-111111111111",
        ],
      },
    },
    select: { id: true, name: true },
  });

  if (otherTenants.length > 0) {
    console.log("\n--- Automation configs pour autres tenants ---");
    for (const t of otherTenants) {
      console.log(`  Tenant: ${t.name}`);
      await seedAutomationConfigs(t.id);
    }
  }

  console.log("\n=== Seed termine ! ===");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Erreur seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
