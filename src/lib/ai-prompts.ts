import type { PipelineStage } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type AILanguage = "FR" | "AR_CLASSIC" | "AR_DIALECT" | "EN";
export type AIChannel = "EMAIL" | "SMS" | "WHATSAPP" | "INTERNAL";

interface IClientContext {
  firstName: string;
  lastName: string;
  pipelineStage: PipelineStage;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredType: string | null;
  desiredWilaya: string | null;
  desiredRooms: number | null;
  desiredSurface: number | null;
}

interface IPropertyContext {
  name: string;
  type: string;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  projectName: string | null;
  status: string;
}

interface IInteractionContext {
  type: string;
  direction: string;
  content: string;
  createdAt: Date;
}

export interface IPromptContext {
  clientId: string;
  client: IClientContext;
  taskTitle: string;
  taskType: string;
  channel: AIChannel;
  language: AILanguage;
  property: IPropertyContext | null;
  recentInteractions: IInteractionContext[];
  taskNotes: string | null;
}

// ============================================================================
// Langue
// ============================================================================

const LANGUAGE_INSTRUCTIONS: Record<AILanguage, string> = {
  FR: "Réponds en français formel et professionnel.",
  AR_CLASSIC: "أجب باللغة العربية الفصحى بأسلوب مهني ورسمي.",
  AR_DIALECT: "أجب بالدارجة الجزائرية بأسلوب ودي ومهني.",
  EN: "Reply in professional English.",
};

// ============================================================================
// Canal — contraintes de format
// ============================================================================

const CHANNEL_INSTRUCTIONS: Record<AIChannel, string> = {
  EMAIL: [
    "Format : email professionnel avec objet, salutation, corps structuré, et signature.",
    "Longueur : 150-300 mots.",
    "Ton : formel et courtois.",
  ].join("\n"),
  SMS: [
    "Format : message SMS court.",
    "Longueur : max 160 caractères.",
    "Ton : direct, amical, pas de formules longues.",
  ].join("\n"),
  WHATSAPP: [
    "Format : message WhatsApp conversationnel.",
    "Longueur : 50-150 mots.",
    "Ton : professionnel mais chaleureux, émojis autorisés avec modération.",
  ].join("\n"),
  INTERNAL: [
    "Format : note interne pour l'équipe.",
    "Longueur : libre.",
    "Ton : factuel et concis.",
  ].join("\n"),
};

// ============================================================================
// Prompts par étape pipeline
// ============================================================================

const STAGE_PROMPTS: Record<PipelineStage, string> = {
  NEW: [
    "Objectif : message de BIENVENUE pour un nouveau lead.",
    "- Présente-toi (agent immobilier de l'agence)",
    "- Remercie le client pour son intérêt",
    "- Mentionne brièvement que tu as des biens correspondant à ses critères",
    "- Propose un appel ou un rendez-vous pour discuter de son projet",
  ].join("\n"),

  CONTACTED: [
    "Objectif : RÉCAPITULATIF après premier contact.",
    "- Résume les points discutés lors du premier échange",
    "- Confirme les critères du client (budget, type de bien, localisation)",
    "- Annonce les prochaines étapes (sélection de biens, visites)",
    "- Propose des créneaux pour avancer",
  ].join("\n"),

  QUALIFIED: [
    "Objectif : PRÉSENTATION de biens correspondant aux critères.",
    "- Présente une sélection de biens adaptés au budget et aux critères",
    "- Mets en avant les points forts de chaque bien",
    "- Propose des dates de visite",
    "- Montre ta disponibilité et ton écoute",
  ].join("\n"),

  VISIT_SCHEDULED: [
    "Objectif : CONFIRMATION et rappel de visite programmée.",
    "- Confirme la date, l'heure et le lieu de la visite",
    "- Rappelle les biens qui seront visités",
    "- Donne les informations pratiques (adresse, accès, parking)",
    "- Encourage le client à préparer ses questions",
  ].join("\n"),

  VISITED: [
    "Objectif : SUIVI post-visite et recueil d'impressions.",
    "- Remercie le client pour sa visite",
    "- Demande ses impressions et son avis",
    "- Récapitule les biens visités avec les points clés",
    "- Propose les prochaines étapes (autre visite, offre, réflexion)",
  ].join("\n"),

  NEGOTIATION: [
    "Objectif : ACCOMPAGNEMENT dans la phase de négociation.",
    "- Récapitule l'offre en cours et les conditions",
    "- Rassure le client sur le processus",
    "- Mentionne les points forts du bien pour justifier le prix",
    "- Propose un rendez-vous pour finaliser les termes",
  ].join("\n"),

  RESERVED: [
    "Objectif : FÉLICITATIONS et étapes post-réservation.",
    "- Félicite le client pour sa réservation",
    "- Détaille les prochaines étapes administratives",
    "- Liste les documents à fournir",
    "- Mentionne le rendez-vous notaire à venir",
  ].join("\n"),

  SIGNED: [
    "Objectif : CONFIRMATION de signature et suivi administratif.",
    "- Confirme la signature du contrat",
    "- Récapitule les termes de la transaction",
    "- Détaille les prochaines étapes (paiements, remise des clés)",
    "- Rassure sur l'accompagnement jusqu'à la remise des clés",
  ].join("\n"),

  CLOSED: [
    "Objectif : MESSAGE de satisfaction et fidélisation.",
    "- Félicite pour la finalisation de l'acquisition",
    "- Souhaite au client de profiter de son nouveau bien",
    "- Propose de rester en contact pour tout besoin futur",
    "- Demande poliment un avis / recommandation",
  ].join("\n"),
};

// ============================================================================
// Constructeur de prompt complet
// ============================================================================

export function buildPrompt(ctx: IPromptContext): string {
  const sections: string[] = [];

  // --- Rôle système ---
  sections.push(
    "Tu es un assistant IA pour un agent immobilier professionnel en Algérie.",
    "Tu rédiges un message à envoyer à un client dans le cadre d'un suivi commercial immobilier.",
    "IMPORTANT : Ce message sera RELU et VALIDÉ par l'agent humain avant envoi. Génère un brouillon de qualité.",
  );

  // --- Langue ---
  sections.push(`\n## Langue\n${LANGUAGE_INSTRUCTIONS[ctx.language]}`);

  // --- Canal ---
  sections.push(`\n## Format (canal : ${ctx.channel})\n${CHANNEL_INSTRUCTIONS[ctx.channel]}`);

  // --- Étape pipeline ---
  sections.push(`\n## Contexte commercial\n${STAGE_PROMPTS[ctx.client.pipelineStage]}`);

  // --- Infos client ---
  const clientLines = [
    `\n## Client`,
    `- Nom : ${ctx.client.firstName} ${ctx.client.lastName}`,
    `- Étape : ${ctx.client.pipelineStage}`,
  ];
  if (ctx.client.budgetMin || ctx.client.budgetMax) {
    const min = ctx.client.budgetMin ? `${ctx.client.budgetMin.toLocaleString()} DA` : "?";
    const max = ctx.client.budgetMax ? `${ctx.client.budgetMax.toLocaleString()} DA` : "?";
    clientLines.push(`- Budget : ${min} — ${max}`);
  }
  if (ctx.client.desiredType) clientLines.push(`- Type recherché : ${ctx.client.desiredType}`);
  if (ctx.client.desiredWilaya) clientLines.push(`- Wilaya souhaitée : ${ctx.client.desiredWilaya}`);
  if (ctx.client.desiredRooms) clientLines.push(`- Pièces souhaitées : ${ctx.client.desiredRooms}`);
  if (ctx.client.desiredSurface) clientLines.push(`- Surface souhaitée : ${ctx.client.desiredSurface} m²`);
  sections.push(clientLines.join("\n"));

  // --- Bien concerné ---
  if (ctx.property) {
    const propLines = [
      `\n## Bien concerné`,
      `- Nom : ${ctx.property.name}`,
      `- Type : ${ctx.property.type}`,
      `- Statut : ${ctx.property.status}`,
    ];
    if (ctx.property.price) propLines.push(`- Prix : ${ctx.property.price.toLocaleString()} DA`);
    if (ctx.property.surface) propLines.push(`- Surface : ${ctx.property.surface} m²`);
    if (ctx.property.rooms) propLines.push(`- Pièces : ${ctx.property.rooms}`);
    if (ctx.property.projectName) propLines.push(`- Projet : ${ctx.property.projectName}`);
    sections.push(propLines.join("\n"));
  }

  // --- Historique interactions ---
  if (ctx.recentInteractions.length > 0) {
    const interLines = [`\n## Dernières interactions`];
    for (const inter of ctx.recentInteractions) {
      const date = new Date(inter.createdAt).toLocaleDateString("fr-FR");
      interLines.push(`- [${date}] ${inter.type} (${inter.direction}) : ${inter.content.slice(0, 200)}`);
    }
    sections.push(interLines.join("\n"));
  }

  // --- Tâche ---
  sections.push(`\n## Tâche à accomplir\n- Titre : ${ctx.taskTitle}\n- Type : ${ctx.taskType}`);
  if (ctx.taskNotes) {
    sections.push(`- Notes : ${ctx.taskNotes}`);
  }

  // --- Consigne finale ---
  sections.push(
    `\n## Consigne\nGénère UNIQUEMENT le message à envoyer au client via ${ctx.channel}. Pas de méta-commentaire, pas d'explication. Juste le message prêt à envoyer.`,
  );

  return sections.join("\n");
}
