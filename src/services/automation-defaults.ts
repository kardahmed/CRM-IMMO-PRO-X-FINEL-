import type { PipelineStage } from "@prisma/client";
import type { IAutomationTask } from "@/services/automation-engine";

/**
 * Configurations par défaut des automatisations pour les 9 étapes du pipeline.
 *
 * Canaux : WhatsApp / SMS / Appel / Document / Meeting uniquement.
 * Pas d'email — tout passe par WhatsApp, SMS ou appel direct.
 *
 * Chaque tâche est liée au client (clientId) et assignée à son agent.
 * Le superviseur peut activer/désactiver chaque tâche et choisir la cible
 * (un agent spécifique ou tous les agents du workspace).
 */
export const DEFAULT_AUTOMATION_CONFIGS: Record<PipelineStage, IAutomationTask[]> = {
  // ============================================================================
  // 1. NEW — Lead entrant
  // ============================================================================
  NEW: [
    {
      title: "Envoyer WhatsApp de bienvenue à {clientName}",
      type: "OTHER",
      delayMinutes: 5,
      description: "Message WhatsApp de bienvenue avec présentation de l'agence et catalogue",
    },
    {
      title: "Appeler le nouveau lead {clientName}",
      type: "CALL",
      delayMinutes: 15,
      description: "Premier contact téléphonique pour qualifier le lead",
    },
  ],

  // ============================================================================
  // 2. CONTACTED — Premier contact établi
  // ============================================================================
  CONTACTED: [
    {
      title: "Qualifier les besoins de {clientName}",
      type: "CALL",
      delayMinutes: 60, // 1h après
      description: "Appel de qualification : budget, type de bien, localisation souhaitée",
    },
    {
      title: "Envoyer WhatsApp récapitulatif à {clientName}",
      type: "OTHER",
      delayMinutes: 120, // 2h après
      description: "Message WhatsApp avec récapitulatif de l'échange et prochaines étapes",
    },
    {
      title: "Relance WhatsApp si pas de réponse de {clientName}",
      type: "OTHER",
      delayMinutes: 1440, // 24h après
      description: "Message WhatsApp de relance si le client n'a pas répondu",
    },
    {
      title: "Relance appel {clientName}",
      type: "CALL",
      delayMinutes: 2880, // 48h après
      description: "Relance téléphonique si toujours pas de réponse après WhatsApp",
    },
  ],

  // ============================================================================
  // 3. QUALIFIED — Besoin et budget validés
  // ============================================================================
  QUALIFIED: [
    {
      title: "Préparer sélection de biens pour {clientName}",
      type: "OTHER",
      delayMinutes: 30,
      description: "Sélectionner 3-5 biens correspondant aux critères du client",
    },
    {
      title: "Envoyer catalogue via WhatsApp à {clientName}",
      type: "OTHER",
      delayMinutes: 120, // 2h après
      description: "Message WhatsApp avec les biens sélectionnés et fiches détaillées",
    },
    {
      title: "Appeler pour proposer des dates de visite à {clientName}",
      type: "CALL",
      delayMinutes: 240, // 4h après
      description: "Appeler pour proposer des créneaux de visite",
    },
  ],

  // ============================================================================
  // 4. VISIT_SCHEDULED — Visite programmée
  // ============================================================================
  VISIT_SCHEDULED: [
    {
      title: "Préparer dossier visite pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 60,
      description: "Préparer les fiches techniques et plans des biens à visiter",
    },
    {
      title: "Confirmer la visite via WhatsApp avec {clientName}",
      type: "OTHER",
      delayMinutes: 1440, // J-1
      description: "Message WhatsApp de confirmation la veille de la visite",
    },
    {
      title: "Rappel SMS jour J visite {clientName}",
      type: "OTHER",
      delayMinutes: 2880, // Matin du jour
      description: "SMS de rappel le matin de la visite avec l'adresse exacte",
    },
  ],

  // ============================================================================
  // 5. VISITED — Visite effectuée
  // ============================================================================
  VISITED: [
    {
      title: "Recueillir le feedback de {clientName}",
      type: "CALL",
      delayMinutes: 120, // 2h après la visite
      description: "Appeler le client pour connaître ses impressions post-visite",
    },
    {
      title: "Envoyer récap visite via WhatsApp à {clientName}",
      type: "OTHER",
      delayMinutes: 180, // 3h après
      description: "Message WhatsApp avec photos, plans et détails des biens visités",
    },
    {
      title: "Relance post-visite {clientName}",
      type: "CALL",
      delayMinutes: 2880, // 48h après
      description: "Relance pour savoir si le client souhaite avancer",
    },
  ],

  // ============================================================================
  // 6. NEGOTIATION — Offre / contre-offre en cours
  // ============================================================================
  NEGOTIATION: [
    {
      title: "Alerter superviseur — négociation {clientName}",
      type: "OTHER",
      delayMinutes: 5,
      description: "Notification au superviseur qu'une négociation est en cours",
    },
    {
      title: "Préparer simulation financière pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 60,
      description: "Calculer le plan de paiement et les conditions financières",
    },
    {
      title: "Relance négociation {clientName}",
      type: "CALL",
      delayMinutes: 1440, // 24h après
      description: "Suivi de la négociation si pas de retour",
    },
  ],

  // ============================================================================
  // 7. RESERVED — Réservation signée
  // ============================================================================
  RESERVED: [
    {
      title: "Envoyer WhatsApp de félicitations à {clientName}",
      type: "OTHER",
      delayMinutes: 15,
      description: "Message WhatsApp de félicitations avec les prochaines étapes",
    },
    {
      title: "Générer contrat de réservation pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 30,
      description: "Préparer le contrat de réservation avec les conditions",
    },
    {
      title: "Collecter documents juridiques de {clientName}",
      type: "DOCUMENT",
      delayMinutes: 240, // 4h après
      description: "Demander CIN, extrait de naissance, justificatifs via WhatsApp",
    },
    {
      title: "Planifier rendez-vous notaire {clientName}",
      type: "MEETING",
      delayMinutes: 1440, // 24h après
      description: "Organiser le RDV chez le notaire pour la signature",
    },
  ],

  // ============================================================================
  // 8. SIGNED — Compromis / acte signé
  // ============================================================================
  SIGNED: [
    {
      title: "Mettre à jour statut du bien",
      type: "OTHER",
      delayMinutes: 15,
      description: "Passer le bien en statut RESERVED ou SOLD dans le système",
    },
    {
      title: "Confirmer le paiement de {clientName}",
      type: "OTHER",
      delayMinutes: 60,
      description: "Vérifier que le premier versement a été effectué",
    },
    {
      title: "Envoyer copie signée via WhatsApp à {clientName}",
      type: "OTHER",
      delayMinutes: 120,
      description: "Envoyer par WhatsApp la copie numérique du contrat signé",
    },
  ],

  // ============================================================================
  // 9. CLOSED — Transaction finalisée
  // ============================================================================
  CLOSED: [
    {
      title: "Remise des clés à {clientName}",
      type: "MEETING",
      delayMinutes: 60,
      description: "Organiser la remise des clés et l'état des lieux",
    },
    {
      title: "Envoyer WhatsApp de satisfaction à {clientName}",
      type: "OTHER",
      delayMinutes: 1440, // 24h après la clôture
      description: "Enquête de satisfaction et demande d'avis via WhatsApp",
    },
    {
      title: "Demander recommandation à {clientName}",
      type: "CALL",
      delayMinutes: 10080, // 7 jours après
      description: "Appeler pour demander un parrainage ou recommandation",
    },
  ],
};
