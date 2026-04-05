import { prisma } from "@/lib/prisma";
import { 
  WorkspaceType, 
  PropertyType, 
  PropertyStatus, 
  PipelineStage, 
  ClientSource, 
  InteractionType, 
  InteractionDirection,
  TaskType,
  TaskStatus,
  PaymentType,
  PaymentStatus 
} from "@prisma/client";

/**
 * Injecte des données de démonstration réalistes dans un tenant spécifié.
 */
export async function seedDemoData(tenantId: string, userId: string) {
  // 1. Trouver ou vérifier le tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new Error("Tenant introuvable");

  // 2. Créer un Projet (Promotion)
  const project = await prisma.project.create({
    data: {
      tenantId,
      name: "Résidence El Bahia - Vue Mer",
      address: "Front de Mer, Oran",
      wilaya: "Oran",
      status: "IN_PROGRESS",
      progressPercentage: 65,
    }
  });

  // 3. Créer des Biens (Properties)
  const propertyData = [
    { name: "Appartement F4 - Bloc A", type: PropertyType.APARTMENT, rooms: 4, surface: 145, price: 28000000, status: PropertyStatus.AVAILABLE },
    { name: "Studio Moderne - Bloc B", type: PropertyType.STUDIO, rooms: 1, surface: 45, price: 9500000, status: PropertyStatus.RESERVED },
    { name: "Penthouse Prestige", type: PropertyType.PENTHOUSE, rooms: 6, surface: 320, price: 65000000, status: PropertyStatus.SOLD },
    { name: "Villa Jasmine", type: PropertyType.VILLA, rooms: 5, surface: 450, price: 85000000, status: PropertyStatus.AVAILABLE },
    { name: "Bureau Commercial G1", type: PropertyType.COMMERCIAL, rooms: 3, surface: 85, price: 18000000, status: PropertyStatus.AVAILABLE },
  ];

  const properties = await Promise.all(
    propertyData.map(p => prisma.property.create({
      data: { ...p, tenantId, projectId: project.id }
    }))
  );

  // 4. Créer des Clients
  const clientData = [
    { firstName: "Mohamed", lastName: "Belaid", phone: "0550112233", email: "m.belaid@email.com", pipelineStage: PipelineStage.QUALIFIED, source: ClientSource.FACEBOOK },
    { firstName: "Sarah", lastName: "Mansouri", phone: "0661445566", email: "s.mansouri@email.com", pipelineStage: PipelineStage.VISIT_SCHEDULED, source: ClientSource.WEBSITE },
    { firstName: "Karim", lastName: "Zitouni", phone: "0770778899", email: "k.zitouni@email.com", pipelineStage: PipelineStage.NEGOTIATION, source: ClientSource.REFERRAL },
    { firstName: "Amine", lastName: "Hocine", phone: "0560223344", email: "a.hocine@email.com", pipelineStage: PipelineStage.RESERVED, source: ClientSource.PHONE },
    { firstName: "Lydia", lastName: "Saidi", phone: "0662334455", email: "l.saidi@email.com", pipelineStage: PipelineStage.NEW, source: ClientSource.OTHER },
  ];

  const clients = await Promise.all(
    clientData.map(c => prisma.client.create({
      data: { ...c, tenantId, assignedAgentId: userId }
    }))
  );

  // 5. Ajouter des Interactions (Historique)
  await prisma.interaction.createMany({
    data: [
      { tenantId, clientId: clients[0].id, userId, type: InteractionType.CALL, direction: InteractionDirection.OUT, content: "Premier contact téléphonique. Intéressé par le F4 bloc A." },
      { tenantId, clientId: clients[1].id, userId, type: InteractionType.NOTE, direction: InteractionDirection.IN, content: "A visité le site hier. Demande une simulation de crédit." },
      { tenantId, clientId: clients[2].id, userId, type: InteractionType.WHATSAPP, direction: InteractionDirection.OUT, content: "Envoi de la plaquette commerciale et du plan de masse." },
    ]
  });

  // 6. Ajouter des Tâches
  await prisma.task.createMany({
    data: [
      { tenantId, clientId: clients[0].id, assignedToId: userId, title: "Rappeler pour confirmation", type: TaskType.CALL, status: TaskStatus.PENDING, dueAt: new Date(Date.now() + 864e5) },
      { tenantId, clientId: clients[4].id, assignedToId: userId, title: "Qualifier le nouveau lead", type: TaskType.FOLLOW_UP, status: TaskStatus.IN_PROGRESS },
    ]
  });

  // 7. Ajouter des Paiements (pour la démo finances)
  if (clients[3].pipelineStage === PipelineStage.RESERVED) {
    await prisma.payment.create({
      data: {
        tenantId,
        clientId: clients[3].id,
        propertyId: properties[1].id,
        amount: 2000000,
        type: PaymentType.RESERVATION,
        status: PaymentStatus.COMPLETED
      }
    });
  }

  return { 
    projectCount: 1, 
    propertyCount: properties.length, 
    clientCount: clients.length 
  };
}
